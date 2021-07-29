import { ArrowUp16, Launch16 } from '@carbon/icons-react';
import { InlineLoading } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback, useEffect, useState } from 'react';
import Avatar from 'react-avatar';
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux'
import { withRouter } from 'react-router';
import { useHistory } from 'react-router-dom';
import { useManagedRenderStack } from '../../context/RenderStack';
import { setHeaders, setComments, selectComments, setFile, setNoFile } from '../../reduxSlices/doc';
import { DriveFile, parseDriveLink } from '../../utils';
import { fromHTML, MakeTree } from '../../utils/docHeaders';
import styles from './FolderPage.module.scss';

export interface IDocPageProps {
  file: DriveFile;
  renderStackOffset?: number;
  match: any;
  location: any;
  history: any;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

function prettify(history: any, baseEl: HTMLElement, fileId: string) {
  {
    // Remove all font families, except for some monospace fonts.
    const monoFF = ['source code', 'courier', 'mono'];
    const elements = baseEl.getElementsByTagName('*') as HTMLCollectionOf<HTMLElement>;
    for (const el of elements) {
      if (el.style) {
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
    }
  }
  {
    // Rewrite `https://www.google.com/url?q=`
    const elements = baseEl.getElementsByTagName('a');
    for (const el of elements) {
      if (el.href.indexOf('https://www.google.com/url') !== 0) {
        continue;
      }
      const url = new URL(el.href);
      const newHref = url.searchParams.get('q');
      if (newHref) {
        el.href = newHref;
      }
    }
  }
  {
    // Open Google Doc and Google Drive link inline, for other links open in new window.
    const elements = baseEl.getElementsByTagName('a');
    for (const el of elements) {
      const id = parseDriveLink(el.href);
      if (id) {
        el.href = `/view/${id}`;
        el.dataset['__gdoc_id'] = id;
        el.classList.add(styles.gdocLink);
        continue;
      }
      if ((el.getAttribute('href') ?? '').indexOf('#') !== 0) {
        el.target = '_blank';
        el.classList.add('__gdoc_external_link');
        continue;
      }
    }
  }

  highlightAndLinkComments(baseEl);

  if (fileId) {
    externallyLinkHeaders(baseEl, fileId);
  }
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

// Highlight commented text just as in Google Docs.
// Link to the comment text at the bottom of the doc.
function highlightAndLinkComments(baseEl: HTMLElement) {
  for (const sup of baseEl.querySelectorAll('sup')) {
    const supLink = sup.children?.[0];
    if (supLink.id.startsWith('cmnt_')) {
      const span = sup.previousElementSibling;
      if (!span || span.nodeName !== 'SPAN') {
        if (span && span.id.startsWith('cmnt_')) {
          // There are multiple sups next to eachother for replies
          // This removes the replies
          sup.remove();
        }
        continue;
      }

      const link = document.createElement('a');
      const href = supLink.getAttribute('href');
      if (!href) {
        console.error('no href for a link');
        continue;
      }
      link.setAttribute('href', href);
      for (const name of span.getAttributeNames()) {
        link.setAttribute(name, span.getAttribute(name) ?? '');
      }
      let style = span.getAttribute('style') || '';
      if (!style.includes('background-color')) {
        style = style + ';background-color: rgb(255, 222, 173)';
      }
      // The linked text should not be styled like a link.
      // The highlight already indicates it is a link like in Google Docs.
      style = removeLinkStyling(style);
      link.setAttribute('style', style);
      link.innerHTML = span.innerHTML;
      link.id = supLink.id;
      sup.remove();
      span.replaceWith(link);
    }
  }
}

function externallyLinkHeaders(baseEl: HTMLElement, fileId: string) {
  function headerLink(fileId: string, headerId: string): HTMLAnchorElement {
    let link = document.createElement('a');
    link.target = '_blank';
    link.classList.add('__gdoc_external_link');
    link.href = 'https://docs.google.com/document/d/' + fileId + '/edit#heading=' + headerId;
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
        let link = headerLink(fileId, el.id);
        link.innerHTML = (inner as HTMLElement).innerHTML;
        for (const a of (inner as HTMLElement).attributes) {
          link.setAttribute(a.name, a.value);
        }
        if (!link.getAttribute('style')) {
          link.setAttribute('style', removeLinkStyling(''));
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
      const link = headerLink(fileId, el.id);
      el.appendChild(link);
      for (const inner of children) {
        link.appendChild(inner);
      }
    }
  }
}

function DocPage({ match, file, renderStackOffset = 0 }: IDocPageProps) {
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const docComments = useSelector(selectComments);
  const history = useHistory();

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
          console.debug('translated ' + msg);
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
      prettify(history, content, file.id ?? '');
      setDocContent(content.innerHTML);
    },
    [file.id, dispatch, history]
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
      return s.replaceAll(/\s+/g, ' ');
    }

    const comments = docComments.filter((comment) => comment.resolved !== true);
    if (comments.length === 0) {
      return;
    }

    const commentLookup = {};
    for (const comment of comments) {
      commentLookup[removeSpace(comment.content ?? '')] = comment;
    }
    const replyLookup = {};
    let i = 0;
    while (true) {
      i += 1;
      const domId = 'cmnt' + i.toString();
      const commentLink = document.getElementById(domId);
      if (!commentLink) {
        // console.debug(commentLookup);
        // console.debug(replyLookup);
        return;
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
      const comment = commentLookup[lookupText];
      if (comment) {
        delete commentLookup[lookupText];
        for (const child of parent.children) {
          parent.removeChild(child);
        }
        ReactDOM.render(
          ReactComment({
            comment,
            htmlId: commentLink.id,
            topHref: commentLink.getAttribute('href') ?? '#',
          }),
          parent
        );
        // need to delete all the replies
        for (const reply of comment.replies) {
          replyLookup[removeSpace(reply.content ?? '')] = reply;
        }
      } else if (replyLookup[lookupText]) {
        delete replyLookup[lookupText];
        // note that we no longer link replies back to the text
        // So delete those supers as well
        document.getElementById((commentLink.getAttribute('href') ?? '').slice(1))?.remove();
        parent.remove();
      } else {
        console.debug('did not find comment for', lookupText);
        // console.debug(replyLookup);
      }
    }

    function ReactComment(props: {
      htmlId: string;
      topHref: string;
      comment: gapi.client.drive.Comment;
    }) {
      const { htmlId, topHref, comment } = props;
      return (
        <>
          <Stack
            horizontal
            style={{ paddingLeft: '10px', paddingTop: '5px' }}
            key={topHref}
            tokens={{ childrenGap: 12, padding: 0 }}
          >
            <a
              target="_blank"
              rel="noreferrer"
              title="open to comment in google doc"
              href={'https://docs.google.com/document/d/' + file.id + '/?disco=' + comment.id}
            >
              <Launch16 />
            </a>
            <span>
              <a id={htmlId} href={topHref} style={{ textDecoration: 'none' }} title="back to text">
                <em>{comment.quotedFileContent?.value}</em>
              </a>
              <a id={htmlId} href={topHref} title="back to text">
                <ArrowUp16 />
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
        </>
      );
    }
  }, [docComments, isLoading, file.id]);

  useEffect(
    function linkPreview() {
      for (const link of document.querySelectorAll('.' + styles.gdocLink)) {
        const id = (link as HTMLElement).dataset?.['__gdoc_id'];
        if (id) {
          const req = { fileId: id, supportsAllDrives: true, fields: 'thumbnailLink' }
          gapi.client.drive.files.get(req).then((rsp) => {
            const imgSrc = rsp.result.thumbnailLink;
            if (!imgSrc) {
              return;
            }
            let img = document.createElement('img');
            img.src = imgSrc;
            img.alt = 'File Icon';
            img.classList.add(styles.gdocThumbnail);
            img.setAttribute('style', 'border:solid;');
            link.append(img);
          });
        }
      }
    },
    [isLoading, file.id]
  );

  const handleDocContentClick = useCallback(
    (ev: React.MouseEvent) => {
      if (isModifiedEvent(ev)) {
        return;
      }
      const id = (ev.target as HTMLElement).dataset?.['__gdoc_id'];
      if (id) {
        ev.preventDefault();
        history.push( `/view/${id}`);
      }
    },
    [history]
  );

  return (
    <div id="doc-page-outer" style={{ maxWidth: '50rem' }}>
      <hr />
      {isLoading && <InlineLoading description="Loading document content..." />}
      {!isLoading && (
        <div
          id="gdoc-html-content"
          style={{ marginTop: '1rem', maxWidth: '50rem' }}
          dangerouslySetInnerHTML={{ __html: docContent }}
          onClick={handleDocContentClick}
        />
      )}
    </div>
  );
}

export default React.memo(withRouter(DocPage));
