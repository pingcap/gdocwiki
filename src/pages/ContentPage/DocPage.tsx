import { InlineLoading } from 'carbon-components-react';
import React, { useEffect, useState } from 'react';
import { useManagedRenderStack } from '../../context/RenderStack';

export interface IDocPageProps {
  file: gapi.client.drive.File;
  renderStackOffset?: number;
}

function prettify(baseEl: HTMLElement) {
  // Prettify rule: Remove all font families, except for some monospace fonts.
  const fontWhitelist = ['Source Code Pro', 'Courier New'];
  const elements = baseEl.getElementsByTagName('*') as HTMLCollectionOf<HTMLElement>;
  for (const el of elements) {
    if (el.style) {
      let hitWhitelist = false;
      for (const f of fontWhitelist) {
        if (el.style.fontFamily.indexOf(f) > -1) {
          hitWhitelist = true;
          break;
        }
      }
      if (!hitWhitelist) {
        el.style.fontFamily = '';
      }
    }
  }
}

function DocPage({ file, renderStackOffset = 0 }: IDocPageProps) {
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
        console.log('files.export', file.id, resp);

        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(resp.body, 'text/html');
        const bodyEl = htmlDoc.querySelector('body');
        if (bodyEl) {
          prettify(bodyEl);
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
  }, [file.id]);

  return (
    <div style={{ maxWidth: '50rem' }}>
      {isLoading && <InlineLoading description="Loading document content..." />}
      {!isLoading && (
        <div style={{ maxWidth: '50rem' }} dangerouslySetInnerHTML={{ __html: docContent }}></div>
      )}
    </div>
  );
}

export default React.memo(DocPage);
