import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { MultiLineSkeleton } from '../components';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Edit16 } from '@carbon/icons-react';
import LastModificatioNote from '../components/LastModificationNote';

export interface IDocPageProps {
  file: gapi.client.drive.File;
}

export default function DocPage({ file }: IDocPageProps) {
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  const handleOpen = useCallback(() => {
    window.open(file.webViewLink, '_blank');
  }, [file]);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 20 }}>
          <LastModificatioNote file={file} />
          {file.webViewLink && (
            <DefaultButton onClick={handleOpen}>
              <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
                <Edit16 />
                <div>Open in Google Doc</div>
              </Stack>
            </DefaultButton>
          )}
        </Stack>
      </div>
      <div style={{ maxWidth: '50rem' }}>
        {isLoading && <MultiLineSkeleton />}
        {!isLoading && (
          <div style={{ maxWidth: '50rem' }} dangerouslySetInnerHTML={{ __html: docContent }}></div>
        )}
      </div>
    </div>
  );
}
