import { ArrowUp16, Close20 } from '@carbon/icons-react';
import { InlineLoading } from 'carbon-components-react';
import cx from 'classnames';
import { unzipSync, strFromU8 } from 'fflate';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Avatar from 'react-avatar';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router';
import { useHistory } from 'react-router-dom';
import { useManagedRenderStack } from '../../context/RenderStack';
import {
  addDriveLinks,
  setHeaders,
  setDriveLinks,
  setExternalLinks,
  setComments,
  selectComments,
  selectDriveLinksLookup,
  setFile,
  setNoFile,
  DriveLink,
  ExternalLink,
} from '../../reduxSlices/doc';
import { selectSidebarOpen } from '../../reduxSlices/siderTree';
import { DriveFile, MimeTypes } from '../../utils';
import { fromHTML, MakeTree } from '../../utils/docHeaders';
import { gdocIdAttr, origHrefAttr, prettify, rewriteLink } from '../../utils/docMarkup';
import { escapeHtml, isModifiedEvent } from '../../utils/html';
import styles from './DocPage.module.scss';

export interface IDocPageProps {
  file: DriveFile;
  renderStackOffset?: number;
  match: any;
  location: any;
  history: any;
}

function strToUint8Array(binary_string: string): Uint8Array {
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

type DriveFileLookup = { [fileId: string]: DriveFile };

// linkPreview performs blocking API calls
async function linkPreview(
  baseEl: HTMLElement,
  driveFileLookup?: DriveFileLookup
): Promise<{ driveLinks: DriveLink[], externalLinks: ExternalLink[] }> {
  const files: { [fileId: string]: DriveFile } = driveFileLookup ?? {};
  const driveLinks: DriveLink[] = [];
  const externalLinks: ExternalLink[] = [];

  try {
    const linkElems = baseEl.classList.contains(styles.gdocLink)
      ? [baseEl]
      : baseEl.querySelectorAll('.' + styles.gdocLink);
    for (const linkEl of linkElems) {
      const link = linkEl as HTMLAnchorElement;
      const id = link.dataset?.[gdocIdAttr];
      if (id && !files[id]) {
        const fields = 'id,name,thumbnailLink,mimeType,iconLink';
        const req = { fileId: id, supportsAllDrives: true, fields };
        const rsp = await gapi.client.drive.files.get(req);
        files[id] = rsp.result;

        driveLinks.push({
          file: rsp.result,
          wikiLink: link.href,
          driveLink: link.dataset?.[origHrefAttr] || link.href,
          linkText: link.innerText,
          id: id,
        });

        const imgSrc = rsp.result.thumbnailLink;
        if (!imgSrc) {
          if (rsp.result.mimeType !== MimeTypes.GoogleFolder) {
            console.debug('preview no thumbnail', id);
          }
          continue;
        }
        let img = document.createElement('img');
        img.src = imgSrc;
        img.alt = 'Doc Preview';
        img.classList.add(styles.gdocThumbnail);
        img.setAttribute('style', 'border:solid;');
        link.append(img);
      }
    }

    if (!baseEl.classList.contains(styles.gdocLink)) {
      const linkElems = baseEl.getElementsByTagName('a');
      for (const linkEl of linkElems) {
        const link = linkEl as HTMLAnchorElement;
        const id = link.dataset?.[gdocIdAttr];
        const href = link.getAttribute('href');
        if (!id && href?.match(/https?:/)) {
          externalLinks.push({
            linkText: link.textContent,
            href: link.href,
          });
        }
      }
    }
  } catch (e) {
    if (e.result?.error) {
      console.error('linkPreview thumbnails', e.result.error);
    } else {
      console.error('linkPreview thumbnails', e);
    }
  }

  return { driveLinks, externalLinks };
}

interface UpgradedComment {
  htmlId: string;
  topHref: string;
  comment: gapi.client.drive.Comment;
}

function DocPage({ match, file, renderStackOffset = 0 }: IDocPageProps) {
  const docContentElement = useRef(null as null | HTMLBodyElement);
  const [docContent, setDocContent] = useState('');
  const docContentHasBeenRendered = !!docContentElement.current;
  const [docName] = useState(file.name ?? '');

  const [isLoading, setIsLoading] = useState(true);
  const [viewingComment, setViewingComment] = useState(null as string | null);
  const dispatch = useDispatch();
  const docComments = useSelector(selectComments);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const driveLinksLookup = useSelector(selectDriveLinksLookup);
  const history = useHistory();
  const [upgradedComments, setUpgradedComments] = useState([] as UpgradedComment[]);
  const [readyForLinkPreview, setReadyForLinkPreview] = useState(false);
  const [docHtmlChangesFinished, setDocHtmlChangesFinished] = useState(false);

  const isSpreadSheet = file.mimeType === MimeTypes.GoogleSpreadsheet;

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
          const contentNode = document.getElementById('gdoc-html-content')!;
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

  useEffect(
    function doLinkPreview() {
      const content = docContentElement.current;
      if (!content) {
        return;
      }

      linkPreview(content).then(function (newLinks) {
        setDocContent(content.innerHTML);
        dispatch(setDriveLinks(newLinks.driveLinks));
        dispatch(setExternalLinks(newLinks.externalLinks));
        setDocHtmlChangesFinished(true);
      });
    },
    [readyForLinkPreview, dispatch],
  );

  useEffect(
    function doAlterHtml() {
      async function alterHtml() {
        const content = docContentElement.current;
        if (!content) {
          return;
        }

        // prettify could take a noticeable amount of time for a large doc on a slow device.
        // So it is important to be in a separate useEffect
        prettify(content, styles, file);
        setDocContent(content.innerHTML);
        setReadyForLinkPreview(true);
      }

      // check file.name: optimistic rendering initially sets only the id
      if (!isSpreadSheet && docContentHasBeenRendered && file.name) {
        alterHtml();
      }
    },
    // file.name is needed in the dependencies
    // optimistic rendering initially sets only the id
    [file, file.name, isSpreadSheet, docContentHasBeenRendered, dispatch]
  );

  const setDocWithRichContent = useCallback(
    (content: HTMLBodyElement, pretty: boolean) => {
      dispatch(
        setHeaders(
          MakeTree(Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(fromHTML))
        )
      );
      setDocContent(content.innerHTML);
      docContentElement.current = content;
    },
    [dispatch]
  );

  useEffect(
    function loadDoc() {
      function loadHtmlBody(body: string, pretty: boolean = true): void {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(body, 'text/html');
        const bodyEl = htmlDoc.querySelector('body');
        if (bodyEl) {
          const styleEls = htmlDoc.querySelectorAll('style');
          styleEls.forEach((el) => bodyEl.appendChild(el));
          setDocWithRichContent(bodyEl, pretty);
        } else {
          setDocWithPlainText('Error?');
        }
      }

      async function loadHtmlView() {
        setIsLoading(true);
        // At least when in dev mode this needs to be reset
        docContentElement.current = null;
        setDocWithPlainText('');

        // TODO: this gets called multiple times on page load
        // separate this out with only a dependency on file.id
        try {
          if (isSpreadSheet) {
            const resp = await gapi.client.drive.files.export({
              alt: 'media',
              fileId: file.id!,
              mimeType: 'application/zip',
            });
            const decompressed = unzipSync(strToUint8Array(resp.body), {})
            console.debug('DocPage files.export zip', file.id, Object.keys(decompressed));
            let html = '';
            let css = '';
            for (const k in decompressed) {
              // TODO: multiple sheets
              if (!html && k.endsWith('.html')) {
                html = strFromU8(decompressed[k]);
              } else if (k.endsWith('.css')) {
                // An iframe would probably be better
                // But this seems to fix visible issues
                css = strFromU8(decompressed[k]).replaceAll(/(a[{:])/g, '#gdoc-html-content $1');
              }
            }
            loadHtmlBody(html + '<style>' + css + '</style>', false);
          } else {
            const resp = await gapi.client.drive.files.export({
              fileId: file.id!,
              mimeType: 'text/html',
            });
            console.debug('DocPage files.export', file.id);
            loadHtmlBody(resp.body, true);
          }
        } catch (e) {
          // To speed things up we do optimistic rendering just with the id
          // That would result in throwing an error here
          if (docName) {
            setDocWithPlainText('Error Loading Document');
            throw e;
          }
          console.debug('ignore optimistic export error');
        } finally {
          setIsLoading(false);
        }
      }

      loadHtmlView();

      return function () {
        dispatch(setHeaders([]));
        dispatch(setDriveLinks([]));
        dispatch(setExternalLinks([]));
      };
    },
    [file.id, isSpreadSheet, dispatch, setDocWithPlainText, setDocWithRichContent, docName]
  );

  useEffect(
    function showNameInUrl() {
      // The DocPage can be shown without a /view or /n url.
      // Just skip in this case. It may not be a file.
      if (match.params.id !== file.id || !file.name) {
        return;
      }

      var urlParams = new URLSearchParams(window.location.search);
      // Change invalid characters to '_' but don't show 2 of those next to each other
      // Change '_-_' to '-'
      let newSlugName = encodeURIComponent(file.name.replaceAll('%', '_'))
        .replaceAll(/%../g, '_')
        .replaceAll(/_+/g, '_')
        .replaceAll(/_-/g, '-')
        .replaceAll(/-_+/g, '-')
        .replace(/_+$/, '')
        .replace(/^_+/, '');
      const givenParamName = urlParams.get('n');
      if (givenParamName === newSlugName) {
        return;
      }

      const givenPathName = match.params.slug;
      if (!givenPathName) {
        urlParams.set('n', newSlugName);
        const urlNoParam = window.location.pathname;
        const newUrl = urlNoParam + '?' + urlParams.toString();
        history.replace(newUrl);
        return;
      }

      if (newSlugName === '_' || newSlugName === '-') {
        newSlugName = '';
      }

      if (givenPathName !== newSlugName) {
        let path = '/n/' + newSlugName + '/' + match.params.id;
        history.replace(path);
      }
    },
    [file.id, file.name, match.params, history]
  );

  useEffect(
    function doLoadComments() {
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
    },
    [file.id, dispatch, file.name]
  );

  // TODO: when using Google translate the comments could already be translated
  // We need to use the pre-inserted HTML
  // In this case we need to fallback to using the quoted value and position
  //
  // TODO:
  // We do not get the comments from the API for a re-opened comment thread.
  // AS per above should have a fallback, at least do not remove superscript links from text.
  useEffect(
    function doUpgradeComments(): void {
      async function upgradeComments() {
        function removeSpace(s: string): string {
          return s.replaceAll(/\s+/g, '');
        }

        function replyText(reply: gapi.client.drive.Reply): string {
          if (reply.action === 'resolve' && !reply.content?.startsWith('_Marked as done_')) {
            return '_Marked as done_ ' + (reply.content ?? '');
          }
          return reply.content ?? '';
        }

        const body = docContentElement.current;
        if (!body) {
          return;
        }

        // We would like to filter out resolve comments
        // However, once a comment thread is resolved it may stay marked resolved
        // Even after being re-opened
        // We also won't see the replies after it is re-opened
        const apiComments = docComments; // .filter((comment) => comment.resolved !== true);
        if (apiComments.length === 0) {
          return;
        }

        let newDriveLinks: DriveLink[] = [];
        let fileLookup: { [fileId: string]: DriveFile } = {};
        for (const id in driveLinksLookup) {
          const f = driveLinksLookup[id].file;
          if (f) {
            fileLookup[id] = f;
          }
        }
        const prettifyHtmlContent = async (htmlContent: string) => {
          if (!htmlContent) {
            return htmlContent;
          }

          const parser = new DOMParser();
          const body = parser.parseFromString(htmlContent, 'text/html').body;
          for (const el of body.getElementsByTagName('a')) {
            rewriteLink(el, styles);
            const newLinks = await linkPreview(el, fileLookup);
            newDriveLinks = newDriveLinks.concat(newLinks.driveLinks);
          }
          return body.innerHTML;
        };

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
        let i = 0;
        while (true) {
          i += 1;
          const domId = '#cmnt' + i.toString();
          const commentLink = body.querySelector(domId);
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
            const textContent = child.textContent || '';
            if (
              textContent.startsWith('_Assigned to') ||
              textContent.startsWith('_Reassigned to')
            ) {
              continue;
            }
            origTextPieces.push(textContent);
          }
          const lookupText = removeSpace(origTextPieces.join('\n'));
          const comments = commentLookup[lookupText];
          if (comments) {
            if (comments.length === 1) {
              delete commentLookup[lookupText];
            }
            const topHref = commentLink.getAttribute('href') ?? '#';
            // console.log(topHref);
            // console.log(body.querySelector(topHref));
            const docTextNoSpace = removeSpace(
              escapeHtml((body.querySelector(topHref) as HTMLElement | null)?.innerText ?? '')
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

            let apiComment = exactComment;
            if (exactComment.htmlContent) {
              const html = await prettifyHtmlContent(exactComment.htmlContent);
              apiComment = { ...exactComment, htmlContent: html };
            }

            // Create a lookup for all the replies.
            // This will confirm that the replies in the DOM exist in our data.
            if (apiComment.replies) {
              const replies = [...apiComment.replies];
              for (const [i, reply] of apiComment.replies.entries()) {
                const replyNoSpace = removeSpace(replyText(reply));
                const repliesForText = replyLookup[replyNoSpace];
                if (repliesForText) {
                  repliesForText.push(reply);
                } else {
                  replyLookup[replyNoSpace] = [reply];
                }

                if (reply.htmlContent) {
                  const html = await prettifyHtmlContent(reply.htmlContent);
                  replies[i] = { ...reply, htmlContent: html };
                }
              }
              apiComment = { ...apiComment, replies }
            }

            newComments.push({
              comment: apiComment,
              topHref,
              htmlId: commentLink.id,
            });

            parent.remove();
          } else if (replyLookup[lookupText]) {
            const replies = replyLookup[lookupText];
            // Don't bother figuring out the exact correct reply.
            replies.shift();
            if (replies.length === 0) {
              delete replyLookup[lookupText];
            }
            // note that we no longer link replies back to the text
            // So delete those supers as well
            (body.querySelector(
              commentLink.getAttribute('href') ?? ''
            ) as HTMLElement | null)?.remove();
            parent.remove();
          } else {
            console.debug('did not find comment for', lookupText);
            // console.debug(Object.keys(commentLookup));
            // console.debug(replyLookup);
          }
        }

        if (newDriveLinks.length > 0) {
          dispatch(addDriveLinks(newDriveLinks));
        }
        setUpgradedComments(newComments);
        setDocContent(body.innerHTML);
      }

      // wait for all other HTML alterations to complete
      if (docHtmlChangesFinished) {
        upgradeComments();
      }
    },
    [docComments, docHtmlChangesFinished, dispatch, driveLinksLookup]
  );

  useEffect(
    function updateLastViewed() {
      // wait for all other HTML alterations to complete.
      // There are 2 potential benefits:
      // * ensure this network request does not delay more important ones
      // * If someone quickly hits the back button their view may not be recorded
      if (!docHtmlChangesFinished) {
        return;
      }

      // check another field like mimeType for the case of optimistic rendering
      if (!file.id || !file.mimeType) {
        return;
      }

      async function updateApi() {
        const d = new Date();
        try {
          await gapi.client.drive.files.update(
            { fileId: file.id!, supportsAllDrives: true },
            { viewedByMeTime: d.toISOString() }
          );
        } catch (e) {
          console.log('update file error: ', e);
        }
      }

      updateApi();
    },
    [file.id, file.mimeType, docHtmlChangesFinished]
  );

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
        while (['SVG', 'PATH', 'FONT'].includes(target.nodeName) && target.parentElement) {
          target = target.parentElement;
        }
      }
      const id = target.dataset?.[gdocIdAttr];
      if (id) {
        ev.preventDefault();
        if ((target as HTMLElement).nodeName === 'A') {
          const hrefAttr = target.getAttribute('href');
          console.log('opening target', hrefAttr);
          if (hrefAttr?.[0] === '/' && hrefAttr?.[1] !== '/') {
            const u = new URL((target as HTMLAnchorElement).href);
            history.push(u.pathname + u.search + u.hash);
          } else {
            // For touchscreen preview/edit we open externally in gdocs app
            window.open((target as HTMLAnchorElement).href, '_blank');
          }
        } else {
          history.push(`/view/${id}`);
        }
        return;
      }
      const commentLink = target.dataset?.['gdocwiki_comment_id'];
      if (commentLink) {
        ev.preventDefault();
        console.log('setting viewing comment to', commentLink);
        setViewingComment(commentLink);
        scrollWithOffset(target);
      }
    },
    [history]
  );

  if (isLoading) {
    return (
      <div id="doc-page-outer" style={{ maxWidth: '50rem' }}>
        <InlineLoading description="Loading document content..." />
      </div>
    );
  }

  const fixSidebar = { position: 'fixed' as 'fixed', right: 0, left: sidebarOpen ? '320px' : '0' };

  return (
    <div id="doc-page-outer" style={{ maxWidth: '50rem' }} onClick={handleDocContentClick}>
      <div
        key="gdoc-html-content"
        id="gdoc-html-content"
        style={{ marginTop: '1rem' }}
        dangerouslySetInnerHTML={{ __html: docContent }}
      />
      <div key="upgradedComments" style={{ paddingTop: '30px' }}>
        <hr />
        <p>{upgradedComments.length === 0 ? 'No' : 'All'} Comments</p>
        <hr style={{ marginBottom: '1rem' }} />
        {upgradedComments.map((comment, i) => (
          <div key={comment.htmlId}>
            {i !== 0 && <hr />}
            <CommentView key={comment.htmlId} fileId={file.id!} comment={comment} />
          </div>
        ))}
      </div>
      {viewingComment && (
        <div
          key="viewingComment"
          style={fixSidebar}
          className={cx(styles.commentsDrawer, { [styles.viewing]: !!viewingComment })}
        >
          <div key="view-comment-header" style={fixSidebar}>
            <hr />
            <Stack horizontal>
              <a
                onClick={() => {
                  setViewingComment(null);
                }}
              >
                <Close20 />
              </a>
              <h4>Comment</h4>
            </Stack>
            <hr />
          </div>
          <div key="vew-comment-body" style={{ marginTop: '4.0rem' }}>
            {upgradedComments.map((comment) =>
              !!viewingComment && comment.htmlId !== viewingComment ? null : (
                <div>
                  <CommentView
                    hideLinkBack={true}
                    key={comment.htmlId}
                    fileId={file.id!}
                    comment={comment}
                  />
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function scrollWithOffset(link: HTMLElement, fixedOffset = 100) {
  const rect = link.getBoundingClientRect();
  const fractionFromBottom = (window.innerHeight - rect.top) / window.innerHeight;
  // The comment drawer is set to a height of 50%
  if (fractionFromBottom > 0.5) {
    return;
  }
  // Add a fixedOffset to give some room before the comments
  const scrollToY = window.pageYOffset + fixedOffset + (0.5 - fractionFromBottom) * window.innerHeight;
  console.log('scrollWithOffset', scrollToY, fixedOffset, window.pageYOffset);
  window.scrollTo(window.pageXOffset, scrollToY);
}

interface CommentViewProps {
  fileId: string;
  comment: UpgradedComment;
  hideLinkBack?: boolean;
}

function CommentView(props: CommentViewProps): JSX.Element {
  const { htmlId, topHref, comment } = props.comment;
  return (
    <div style={{ paddingBottom: '20px' }}>
      <Stack
        horizontal
        style={{ paddingLeft: '10px' }}
        key={topHref}
        tokens={{ childrenGap: 12, padding: 0 }}
      >
        {!props.hideLinkBack && (
          <a href={topHref} title="back to document">
            <ArrowUp16 />
          </a>
        )}
        <span>
          <a
            id={htmlId}
            data-__gdoc_id={props.fileId}
            href={`/view/${props.fileId}/edit/?disco=${comment.id}`}
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
