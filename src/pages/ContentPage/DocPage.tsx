import { InlineLoading } from 'carbon-components-react';
import * as H from 'history';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useManagedRenderStack } from '../../context/RenderStack';
import { DriveFile, parseDriveLink } from '../../utils';

export interface IDocPageProps {
  file: DriveFile;
  renderStackOffset?: number;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

function prettify<HistoryLocationState = H.LocationState>(
  history: H.History<HistoryLocationState>,
  baseEl: HTMLElement
) {
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
}

function DocPage({ file, renderStackOffset = 0 }: IDocPageProps) {
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();

  useManagedRenderStack({
    depth: renderStackOffset,
    id: 'DocPage',
    file,
  });

  useEffect(() => {
    async function loadPreview() {
      setIsLoading(true);
      setDocContent('');

      try {
        const resp = await gapi.client.drive.files.export({
          fileId: file.id!,
          mimeType: 'text/html',
        });
        console.trace('DocPage files.export', file.id, resp);

        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(resp.body, 'text/html');
        const bodyEl = htmlDoc.querySelector('body');
        if (bodyEl) {
          prettify(history, bodyEl);
          const styleEls = htmlDoc.querySelectorAll('style');
          styleEls.forEach((el) => bodyEl.appendChild(el));
          setDocContent(bodyEl.innerHTML);
        } else {
          setDocContent('Error?');
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadPreview();
    // Ignore history change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

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
