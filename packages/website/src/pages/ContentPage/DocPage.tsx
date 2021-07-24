import { ArrowUp16, Launch16 } from '@carbon/icons-react';
import { InlineLoading } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback, useEffect, useState } from 'react';
import Avatar from 'react-avatar';
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom';
import { useManagedRenderStack } from '../../context/RenderStack';
import { setHeaders, setComments, selectComments, setFile, setNoFile } from '../../reduxSlices/doc';
import { history, DriveFile, parseDriveLink } from '../../utils';
import { fromHTML, MakeTree } from '../../utils/docHeaders';

export interface IDocPageProps {
  file: DriveFile;
  renderStackOffset?: number;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

function prettify(baseEl: HTMLElement, fileId: string) {
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
        el.href = history.createHref({ pathname: `/view/${id}` });
        el.dataset['__gdoc_history'] = `/view/${id}`;
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
      if (!style.includes('text-decoration')) {
        style = style + ';text-decoration: none';
      }
      if (!style.match(/(^|[; ])color:/)) {
        style = style + ';color: rgb(0, 0, 0);';
      }
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

function DocPage({ file, renderStackOffset = 0 }: IDocPageProps) {
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();
  const dispatch = useDispatch();
  const docComments = useSelector(selectComments);

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

  const setDocWithRichContent = useCallback(
    (content: HTMLBodyElement) => {
      dispatch(
        setHeaders(
          MakeTree(Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(fromHTML))
        )
      );
      prettify(content, file.id ?? '');
      setDocContent(content.innerHTML);
    },
    [file.id, dispatch]
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
    const comments = docComments.filter((comment) => comment.resolved !== true);
    if (comments.length === 0) {
      return;
    }

    const commentLookup = {};
    for (const comment of comments) {
      commentLookup[comment.content ?? ''] = comment;
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
      const origText = origTextPieces.join('\n');
      const comment = commentLookup[origText];
      if (comment) {
        delete commentLookup[origText];
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
          replyLookup[reply.content] = reply;
        }
      } else if (replyLookup[origText]) {
        delete replyLookup[origText];
        // note that we no longer link replies back to the text
        // So delete those supers as well
        document.getElementById((commentLink.getAttribute('href') ?? '').slice(1))?.remove();
        parent.remove();
      } else {
        console.debug('did not find comment for', origText);
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
              <p dangerouslySetInnerHTML={{ __html: comment.htmlContent ?? '' }}></p>
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
                <p dangerouslySetInnerHTML={{ __html: reply.htmlContent ?? '' }}></p>
              </Stack>
            </Stack>
          ))}
        </>
      );
    }
  }, [docComments, isLoading, file.id]);

  const handleDocContentClick = useCallback(
    (ev: React.MouseEvent) => {
      if (isModifiedEvent(ev)) {
        return;
      }
      const h = (ev.target as HTMLElement).dataset?.['__gdoc_history'];
      if (h) {
        ev.preventDefault();
        history.push(h);
      }
    },
    [history]
  );

  return (
    <div style={{ maxWidth: '50rem' }}>
      {isLoading && <InlineLoading description="Loading document content..." />}
      {!isLoading && (
        <div
          style={{ maxWidth: '50rem' }}
          dangerouslySetInnerHTML={{ __html: docContent }}
          onClick={handleDocContentClick}
        />
      )}
    </div>
  );
}

export default React.memo(DocPage);
