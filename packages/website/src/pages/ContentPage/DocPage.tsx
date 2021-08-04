import { ArrowUp16, Launch16 } from '@carbon/icons-react';
import { InlineLoading } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Avatar from 'react-avatar';
import { useDispatch, useSelector } from 'react-redux'
import { withRouter } from 'react-router';
import { useHistory } from 'react-router-dom';
import { useManagedRenderStack } from '../../context/RenderStack';
import { setHeaders, setComments, selectComments, setFile, setNoFile } from '../../reduxSlices/doc';
import { DriveFile, canEdit, parseDriveLink } from '../../utils';
import { fromHTML, MakeTree } from '../../utils/docHeaders';
import styles from './FolderPage.module.scss';

export interface IDocPageProps {
  file: DriveFile;
  renderStackOffset?: number;
  match: any;
  location: any;
  history: any;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

const monoFF = ['source code', 'courier', 'mono'];

// Remove all font families, except for some monospace fonts.
function monoFontsOnly(el: HTMLElement) {
  const ff = el.style.fontFamily.toLowerCase();
  let isMonoFont = false;
  for (const f of monoFF) {
    if (ff.indexOf(f) > -1) {
      isMonoFont = true;
      break;
    }
  }
  el.style.fontFamily = '';
  if (isMonoFont) {
    el.classList.add('__gdoc_monospace');
  }
}

const bgColors = {
  white: 'white',
  '#ffffff': 'white',
  'rgb(255, 255, 255)': 'white',
  'rgb(255,255,255)': 'white',
};

function cleanElem(el: HTMLElement, inherit: AncestorContext): void {
  if (inherit.inTable && !inherit.inList) {
    monoFontsOnly(el);
  }
  // Remove unnecessary background colors.
  // These can cause text above/below to be cutoff (vertically).
  // This has been seen after running Chrome's tranlsate
  const elBgColor = el.style.backgroundColor;
  if (
    inherit.parentBgColor === elBgColor ||
    bgColors[inherit.parentBgColor] === bgColors[elBgColor]
  ) {
    el.style.backgroundColor = '';
  }
}

type AncestorContext = {
  inTable: boolean;
  inList: boolean;
  parentBgColor: string;
};

// For modifiers that want to forward properties of the ancestors
function modifyDescendants(el: HTMLElement, inherit: AncestorContext) {
  const current = {
    parentBgColor: el.style.backgroundColor || inherit.parentBgColor,
    inTable: inherit.inTable || el.nodeName === 'TABLE',
    inList: inherit.inList || el.nodeName === 'LI',
  };
  cleanElem(el, current);

  const childEl = el.firstElementChild as HTMLElement | null;
  if (childEl) {
    modifyDescendants(childEl, current);
  }

  const sibling = el.nextElementSibling as HTMLElement | null;
  if (sibling) {
    modifyDescendants(sibling, inherit);
  }
}

const timing = false;
function timed(msg: string, cb: () => void) {
  if (!timing) {
    cb();
    return;
  }
  const t0 = performance.now();
  cb();
  const t1 = performance.now();
  console.log(msg + ' took ' + (t1 - t0) + ' milliseconds.');
}

function rewriteLink(el: HTMLAnchorElement): void {
  // Rewrite `https://www.google.com/url?q=`
  if (el.href.indexOf('https://www.google.com/url') === 0) {
    const url = new URL(el.href);
    const newHref = url.searchParams.get('q');
    if (newHref) {
      el.href = newHref;
    }
  }

  // Open Google Doc and Google Drive link inline, for other links open in new window.
  const id = parseDriveLink(el.href);
  if (id) {
    el.href = `/view/${id}`;
    el.dataset['__gdoc_id'] = id;
    el.classList.add(styles.gdocLink);
    return;
  }
  if ((el.getAttribute('href') ?? '').indexOf('#') !== 0) {
    el.target = '_blank';
    el.classList.add('__gdoc_external_link');
    return;
  }
}

function prettify(baseEl: HTMLElement, file?: DriveFile) {
  timed('modify descendants', () => {
    // The HTML export will not change the background color even if it is changed in the doc
    let parentBgColor = 'white';
    // The HTML export has only html elements
    modifyDescendants(baseEl, { inList: false, inTable: false, parentBgColor });
  });

  timed('padding fixes', () => {
    for (const li of baseEl.querySelectorAll('li')) {
      fixPaddingLi(li as HTMLLIElement);
    }
  });

  timed('comments', () => {
    for (const sup of baseEl.querySelectorAll('sup')) {
      highlightAndLinkComment(sup);
    }
  });

  timed('link rewrite', () => {
    const elements = baseEl.getElementsByTagName('a');
    for (const el of elements) {
      rewriteLink(el);
    }
  });

  if (file) {
    timed('externally link headers', () => {
      externallyLinkHeaders(baseEl, file);
    });
  }
}

const sourceSansPro = '"Source Sans Pro"';

function isFontFamily(fontFamily, fontFamily2) {
  if (fontFamily[0] !== '"') {
    fontFamily = '"' + fontFamily + '"';
  }
  if (fontFamily2[0] !== '"') {
    fontFamily2 = '"' + fontFamily2 + '"';
  }
  return fontFamily === fontFamily2;
}

// In some specific cases enormous padding gets added to both the top and bottom of a list
// In other specific cases some spacing is missing
// Do a lot of specific checks to avoid altering other docs where this is not a problem
function fixPaddingLi(li: HTMLLIElement): boolean {
  // The indent of the second line of the bullet point
  // should match the first
  li.style.textIndent = '-1em';
  li.style.listStylePosition = 'inside';

  const child = li.firstElementChild as HTMLElement | null;
  if (!child || child.nodeName !== 'SPAN') {
    return false;
  }

  // There is not much logic here.
  // This works well based on testing specific examples.
  const isArial = isFontFamily('Arial', li.style.fontFamily);
  const arialChildPro = isFontFamily(sourceSansPro, child.style.fontFamily) && isArial;
  const hasPadding = li.style.paddingTop && li.style.paddingBottom;
  let shouldAddSpace = hasPadding && (isFontFamily(sourceSansPro, li.style.fontFamily) || arialChildPro);

  if (!shouldAddSpace && isArial) {
    const grandChild = child.firstElementChild;
    // Add a little spacing to links with underlines
    if (grandChild && grandChild.nodeName === 'A') {
      if ((grandChild as HTMLAnchorElement).style.textDecoration === 'inherit') {
        if (parseInt(li.style.lineHeight) === 1) {
          li.style.lineHeight = '1.3';
          return true;
        }
      }
    }
  }

  if (!shouldAddSpace) {
    return false;
  }

  // Although there is too much padding, there is not enough line spacing
  // 1.5 is already recommended for accessibility
  if (parseInt(li.style.lineHeight) < 1.5) {
    li.style.lineHeight = '1.5';
  }
  if (parseInt(li.style.fontSize) > parseInt(child.style.fontSize)) {
    child.style.fontSize = '';
  }
  if (hasPadding) {
    if (arialChildPro || li.parentElement?.nodeName === 'OL') {
      li.style.paddingTop = '0pt';
      li.style.paddingBottom = '0pt';
    } else {
      li.style.paddingTop = '4pt';
      li.style.paddingBottom = '5pt';
    }
  }
  return true;
}

function removeLinkStyling(style: string): string {
  if (!style.includes('text-decoration')) {
    style = style + ';text-decoration: none';
  }
  if (!style.match(/(^|[; ])color:/)) {
    style = style + ';color: rgb(0, 0, 0);';
  }
  return style;
}

// linkPreview performs blocking API calls
async function linkPreview(cb?: () => void) {
  try {
    for (const link of document.querySelectorAll('.' + styles.gdocLink)) {
      const id = (link as HTMLElement).dataset?.['__gdoc_id'];
      if (id) {
        const req = { fileId: id, supportsAllDrives: true, fields: 'thumbnailLink' };
        const rsp = await gapi.client.drive.files.get(req);
        const imgSrc = rsp.result.thumbnailLink;
        if (!imgSrc) {
          console.debug('preview no thumbnail', id);
          return;
        }
        let img = document.createElement('img');
        img.src = imgSrc;
        img.alt = 'Doc Preview';
        img.classList.add(styles.gdocThumbnail);
        img.setAttribute('style', 'border:solid;');
        link.append(img);
      }
    }
  } catch (e) {
    console.error('linkPreview thumbnails', e);
  } finally {
    if (cb) {
      cb();
    }
  }
}

// Highlight commented text just as in Google Docs.
// Link to the comment text at the bottom of the doc.
function highlightAndLinkComment(sup: HTMLElement){
  const supLink = sup.children?.[0];
  if (supLink?.id.startsWith('cmnt_')) {
    const span = sup.previousElementSibling as HTMLElement;
    if (!span || span.nodeName !== 'SPAN') {
      if (span && span.id.startsWith('cmnt_')) {
        // There are multiple sups next to eachother for replies
        // This removes the replies
        sup.remove();
      }
      return;
    }

    const link = document.createElement('a');
    const href = supLink.getAttribute('href');
    if (!href) {
      console.error('no href for a link');
      return;
    }
    link.setAttribute('href', href);
    for (const name of span.getAttributeNames()) {
      link.setAttribute(name, span.getAttribute(name) ?? '');
    }
    let style = span.getAttribute('style') || '';
    // The linked text should not be styled like a link.
    // The highlight already indicates it is a link like in Google Docs.
    link.setAttribute('style', removeLinkStyling(style));
    if (!link.style.backgroundColor) {
      link.style.backgroundColor = 'rgb(255, 222, 173)';
    }
    // The highlight can obscure other content
    // inline-block fixes this.
    // We apply a textIndent fix to bulleted lists elsewhere
    // This does not play nicely with inline-block. so skip those
    if (!link.style.display && !span.parentElement?.style.textIndent) {
      link.style.display = 'inline-block';
    }
    link.innerHTML = span.innerHTML;
    link.id = supLink.id;
    sup.remove();
    span.replaceWith(link);
  }
}

function externallyLinkHeaders(baseEl: HTMLElement, file: DriveFile) {
  const fileId = file.id!;
  const editable = canEdit(file);
  function headerLink(headerId: string): HTMLAnchorElement {
    let link = document.createElement('a');
    const path = editable ? 'edit' : 'preview';
    const href = `/view/${fileId}/${path}#heading=${headerId}`;
    link.href = href;
    link.dataset['__gdoc_id'] = fileId;
    return link;
  }

  // Link from headers into the GDoc
  const headers = Array.from(
    baseEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  ) as HTMLHeadingElement[];
  for (const el of headers) {
    let children = Array.from(el.childNodes);
    if (children.every((n) => n.nodeName === 'SPAN')) {
      let style: string | null = null;
      for (const inner of children) {
        if (!style) {
          style = (inner as HTMLElement).getAttribute('style');
        }
        let link = headerLink(el.id);
        link.innerHTML = (inner as HTMLElement).innerHTML;
        for (const a of (inner as HTMLElement).attributes) {
          link.setAttribute(a.name, a.value);
        }
        if (!link.style.textDecoration) {
          link.style.textDecoration = 'none';
        }
        if (!link.style.color) {
          link.style.color = 'rgb(0, 0, 0)';
        }
        el.appendChild(link);
        el.removeChild(inner);
      }
      // Fix a Google Docs export bug
      // Sometimes when there are multiple spans in the header
      // Some of the span are missing the header styling
      if (style) {
        for (const child of el.childNodes) {
          if (!(child as HTMLElement).getAttribute('style')) {
            (child as HTMLElement).setAttribute('style', style);
          }
        }
      }

      // A header may already be linked, for example if there is a comment
      // In this case ignore the header
    } else if (children.every((n) => n.nodeName !== 'A')) {
      const link = headerLink(el.id);
      el.appendChild(link);
      for (const inner of children) {
        link.appendChild(inner);
      }
    }
  }
}

interface UpgradedComment {
  htmlId: string;
  topHref: string;
  comment: gapi.client.drive.Comment;
}

function DocPage({ match, file, renderStackOffset = 0 }: IDocPageProps) {
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const docComments = useSelector(selectComments);
  const history = useHistory();
  const [upgradedComments, setUpgradedComments] = useState([] as UpgradedComment[]);

  useCallback(() => {
    if (file.name) {
      dispatch(setFile(file));
    } else {
      dispatch(setNoFile());
    }
  }, [dispatch, file])();

  useManagedRenderStack({
    depth: renderStackOffset,
    id: 'DocPage',
    file,
  });

  const setDocWithPlainText = useCallback(
    (content: string) => {
      setDocContent(content);
      dispatch(setHeaders([]));
    },
    [dispatch]
  );

  useEffect(
    // Support Google Chrome's built-in translation feature.
    // It works when clicking on a new document
    // However it does not work for headers
    // Generally it has problems with small dynamic updates.
    // Solution: re-generate the headers from the now translated content.
    function chromeTranslateHeaders() {
      function handleTranslated(msg: string = '') {
        if (document.documentElement.className.includes('translated')) {
          const contentNode = document.getElementById('gdoc-html-content')!
          if (!contentNode) {
            return;
          }
          dispatch(
            setHeaders(
              MakeTree(
                Array.from(contentNode.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(fromHTML)
              )
            )
          );
        }
      }

      // Translation just enabled
      const htmlObserver = new MutationObserver(function () {
        handleTranslated('html');
      });

      htmlObserver.observe(document.documentElement, {
        attributes: true,
        childList: false,
        subtree: false,
      });

      // Translation is already enabled and now opening the doc.
      // This is not entirely reliable because we don't know how long translation will take.
      // We could listen for inner mutations indicating a translation update.
      const docObserver = new MutationObserver(function (mutationList: MutationRecord[] ) {
        for (const mutation of mutationList) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if ((node as HTMLElement).id === 'gdoc-html-content') {
                setTimeout(() => {
                  handleTranslated('gdoc html content');
                }, 1000);
              }
            }
          }
        }
      });
      docObserver.observe(document.getElementById('doc-page-outer')!, {
        attributes: false,
        childList: true,
        subtree: false,
      });

      // Only the visible content is translated.
      // So update as the document is scrolled.
      function scrollCallback() {
        setTimeout(() => {
          handleTranslated('scroll');
        }, 1000);
      }
      document.addEventListener('scroll', scrollCallback);

      return () => {
        htmlObserver.disconnect();
        docObserver.disconnect();
        document.removeEventListener('scroll', scrollCallback);
      };
    },
    [dispatch]
  );

  const setDocWithRichContent = useCallback(
    (content: HTMLBodyElement) => {
      dispatch(
        setHeaders(
          MakeTree(Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(fromHTML))
        )
      );

      // prettify could take a noticeable amount of time on a slow device.
      // particularly for a large document
      // So first do a raw render and then prettify.
      setDocContent(content.innerHTML);
      setTimeout(function () {
        prettify(content, file);
        setDocContent(content.innerHTML);
        // link preview makes blocking API calls
        setTimeout(function () {
          linkPreview(() => {
            setDocContent(content.innerHTML);
          });
        }, 1);
      }, 1);
    },
    [file, dispatch]
  );

  useEffect(() => {
    function loadHtml(body: string){
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(body, 'text/html');
      const bodyEl = htmlDoc.querySelector('body');
      if (bodyEl) {
        const styleEls = htmlDoc.querySelectorAll('style');
        styleEls.forEach((el) => bodyEl.appendChild(el));
        setDocWithRichContent(bodyEl);
      } else {
        setDocWithPlainText('Error?');
      }
    }

    async function loadPreview() {
      setIsLoading(true);
      setDocWithPlainText('');

      try {
        const resp = await gapi.client.drive.files.export({
          fileId: file.id!,
          mimeType: 'text/html',
        });
        console.log('DocPage files.export', file.id);
        loadHtml(resp.body);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreview();
    return function () {
      dispatch(setHeaders([]));
    };
  }, [file.id, dispatch, setDocWithPlainText, setDocWithRichContent]);

  useEffect(
    function showNameInUrl() {
      // The DocPage can be shown without a /view or /n url.
      // Just skip in this case. It may not be a file.
      if (match.params.id !== file.id || !file.name) {
        return;
      }

      var urlParams = new URLSearchParams(window.location.search);
      // The browsers seem to be lenient with non-asci characters.
      // But change those which do always get % encoded.
      const newParamName = file.name
        .replaceAll(/(\s|\(|\)|\[|\])+/g, '_')
        .replaceAll(/_+/g, '_')
        .replaceAll(/_-/g, '-')
        .replaceAll(/-_+/g, '-')
        .replace(/_+$/, '')
        .replace(/^_+/, '');
      const givenParamName = urlParams.get('n');
      if (givenParamName === newParamName) {
        return;
      }

      const givenPathName = match.params.slug;
      if (!givenPathName) {
        urlParams.set('n', newParamName);
        const urlNoParam = window.location.pathname;
        const newUrl = urlNoParam + '?' + urlParams.toString();
        history.replace(newUrl);
        return;
      }

      // Be more strict with url path pieces
      let slugName = file.name
        ?.replaceAll(/[^a-zA-Z0-9_-]/g, '_')
        .replaceAll(/_+/g, '_')
        .replaceAll(/_-/g, '-')
        .replaceAll(/-_+/g, '-');
      if (slugName === '_' || slugName === '-') {
        slugName = '';
      }

      if (givenPathName !== slugName) {
        let path = '/n/' + slugName + '/' + match.params.id;
        history.push(path);
      }
    },
    [file.id, file.name, match.params, history]
  );

  useEffect(() => {
    // When optimistically rendering the document, only an id is available.
    // Avoid optimistically fetching comments as well.
    // This API call would actually succeed against a folder
    // but we wouldn't end up using the resulit.
    if (!file.name) {
      return;
    }

    async function loadComments() {
      try {
        // problem: this does not return all of the visible comments
        const resp = await gapi.client.drive.comments.list({
          fileId: file.id!,
          includeDeleted: false,
          fields: '*',
          pageSize: 100,
        });
        const respComments = resp.result.comments ?? [];
        dispatch(setComments(respComments));
      } catch (e) {
        console.error('error loading comments', e);
      }
    }
    loadComments();
    return function () {
      dispatch(setComments([]));
    };
  }, [file.id, dispatch, file.name]);

  useEffect(() => {
    function removeSpace(s: string): string {
      return s.replaceAll(/\s+/g, '');
    }

    const apiComments = docComments.filter((comment) => comment.resolved !== true);
    if (apiComments.length === 0) {
      return;
    }
    const newComments: UpgradedComment[] = [];

    const commentLookup: { [text: string]: gapi.client.drive.Comment[] } = {};
    for (const comment of apiComments) {
      const text = removeSpace(comment.content ?? '')
      const multi = commentLookup[text];
      if (multi) {
        multi.push(comment);
      } else {
        commentLookup[text] = [comment];
      }
    }
    const replyLookup: { [text: string]: gapi.client.drive.Comment[] } = {};
    const removals: any[] = []
    let i = 0;
    while (true) {
      i += 1;
      const domId = 'cmnt' + i.toString();
      const commentLink = document.getElementById(domId);
      if (!commentLink) {
        // console.debug(commentLookup);
        // console.debug(replyLookup);
        break;
      }
      let parent = commentLink.parentElement;
      while (parent && parent.nodeName !== 'DIV') {
        parent = parent.parentElement;
      }
      if (!parent) {
        console.error('no parent for comment');
        continue;
      }
      let origTextPieces = [commentLink.nextElementSibling?.textContent ?? ''];
      for (const child of Array.from(parent.children).slice(1)) {
        if (child.textContent?.startsWith('_Assigned to')) {
          continue;
        }
        origTextPieces.push(child.textContent || '');
      }
      const lookupText = removeSpace(origTextPieces.join('\n'));
      const comments = commentLookup[lookupText];
      if (comments) {
        if (comments.length === 1) {
          delete commentLookup[lookupText];
        }
        const topHref = commentLink.getAttribute('href') ?? '#';
        // console.log(topHref);
        // console.log(document.getElementById(topHref.slice(1)));
        const docTextNoSpace = removeSpace(
          escapeHtml(document.getElementById(topHref.slice(1))?.innerText ?? '')
        );
        let exactComment: null | gapi.client.drive.Comment = null;
        if (docTextNoSpace) {
          for (const comment of comments) {
            const quotedNoSpace = removeSpace(comment.quotedFileContent?.value ?? '');
            if (quotedNoSpace === docTextNoSpace) {
              exactComment = comment;
            }
          }
        }
        if (!exactComment) {
          exactComment = comments.shift()!;
          if (comments.length > 0) {
            console.debug(
              'did not find exact',
              docTextNoSpace,
              'guessing',
               exactComment.quotedFileContent?.value
            );
          }
          for (const comment of comments) {
            console.debug('alternative', removeSpace(comment.quotedFileContent?.value ?? ''));
          }
        }

        for (const child of parent.children) {
          parent.removeChild(child);
        }
        newComments.push({
          comment: exactComment,
          topHref,
          htmlId: commentLink.id,
        });

        // Create a lookup for all the replies.
        // This will confirm that the replies in the DOM exist in our data.
        for (const reply of exactComment.replies ?? []) {
          const replyNoSpace = removeSpace(reply.content ?? '');
          const replies = replyLookup[replyNoSpace];
          if (replies) {
            replies.push(reply);
          } else {
            replyLookup[replyNoSpace] = [reply];
          }
        }

        removals.push(parent);
      } else if (replyLookup[lookupText]) {
        const replies = replyLookup[lookupText];
        // Don't bother figuring out the exact correct reply.
        replies.shift();
        if (replies.length === 0) {
          delete replyLookup[lookupText];
        }
        // note that we no longer link replies back to the text
        // So delete those supers as well
        document.getElementById((commentLink.getAttribute('href') ?? '').slice(1))?.remove();
        removals.push(parent);
      } else {
        console.debug('did not find comment for', lookupText);
        // console.debug(Object.keys(commentLookup));
        // console.debug(replyLookup);
      }
    }

    setUpgradedComments(newComments);

    // We incrementally upgrade the html
    // So we need to make sure those are done first
    // This is a hacky and unreliable way to achieve that
    setTimeout(function () {
      for (const parent of removals) {
        parent?.remove();
      }
    }, 5000);
  }, [docComments, isLoading, file.id]);

  const handleDocContentClick = useCallback(
    (ev: React.MouseEvent) => {
      if (isModifiedEvent(ev)) {
        return;
      }
      // Find the target href
      // An individual onclick handler would have been easier
      let target = ev.target as HTMLElement;
      if (target.nodeName !== 'A' && target.parentElement) {
        target = target.parentElement;
        while (['SVG', 'PATH'].includes(target.nodeName) && target.parentElement) {
          target = target.parentElement;
        }
      }
      const id = target.dataset?.['__gdoc_id'];
      if (id) {
        ev.preventDefault();
        if ((target as HTMLElement).nodeName === 'A') {
          const u = new URL((target as HTMLAnchorElement).href);
          history.push(u.pathname + u.search + u.hash);
        } else {
          history.push(`/view/${id}`);
        }
      }
    },
    [history]
  );

  if (isLoading) {
    return (
      <div id="doc-page-outer" style={{ maxWidth: '50rem' }}>
        <InlineLoading description="Loading document content..." />
      </div>
    )
  }

  return (
    <div
      id="doc-page-outer"
      style={{ maxWidth: '50rem', marginLeft: '1rem' }}
      onClick={handleDocContentClick}
    >
      <div
        id="gdoc-html-content"
        style={{ marginTop: '1rem', maxWidth: '50rem' }}
        dangerouslySetInnerHTML={{ __html: docContent }}
      />
      {upgradedComments.length > 0 && (
        <div style={{ paddingTop: '30px' }}>
          <hr />
          <p>Comments</p>
          {upgradedComments.map((comment) => (
            <ReactComment key={comment.htmlId} fileId={file.id!} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReactComment(props: { fileId: string, comment: UpgradedComment }): JSX.Element {
  const { fileId } = props;
  const { htmlId, topHref, comment } = props.comment;
  return (
    <div style={{ paddingBottom: '20px' }}>
      <hr />
      <Stack
        horizontal
        style={{ paddingLeft: '10px' }}
        key={topHref}
        tokens={{ childrenGap: 12, padding: 0 }}
      >
        <a href={topHref} title="back to text">
          <ArrowUp16 />
        </a>
        <span>
          <a
            id={htmlId}
            data-__gdoc_id={fileId}
            href={`/view/${fileId}/edit/?disco=${comment.id}`}
            style={{ textDecoration: 'none' }}
            title="view in doc">
            <em>{comment.quotedFileContent?.value}</em>
          </a>
        </span>
      </Stack>
      <hr />
      <Stack horizontal key={comment.id} tokens={{ childrenGap: 8, padding: 8 }}>
        <Stack>
          <Avatar
            name={comment.author?.displayName}
            src={'https://' + comment.author?.photoLink}
            size="30"
            round
          />
        </Stack>
        <Stack>
          <span dangerouslySetInnerHTML={{ __html: comment.htmlContent ?? '' }} />
        </Stack>
      </Stack>
      {comment.replies?.map((reply) => (
        <Stack horizontal key={reply.id} tokens={{ childrenGap: 8, padding: 8 }}>
          <Stack>
            <Avatar
              name={reply.author?.displayName}
              src={'https://' + reply.author?.photoLink}
              size="30"
              round
            />
          </Stack>
          <Stack>
            <span dangerouslySetInnerHTML={{ __html: reply.htmlContent ?? '' }} />
          </Stack>
        </Stack>
      ))}
    </div>
  );
}

export default React.memo(withRouter(DocPage));
