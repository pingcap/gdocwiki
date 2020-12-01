import React, { useEffect, useMemo, useState } from 'react';
import { MultiLineSkeleton } from '../components';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
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

  const commandBarItems = useMemo(() => {
    const r: ICommandBarItemProps[] = [
      {
        key: 'modify_user',
        text: (<LastModificatioNote file={file} />) as any,
      },
    ];
    if (file.webViewLink) {
      r.push({
        key: 'open',
        text: 'Open in Google Doc',
        iconProps: { iconName: 'Edit' },
        onClick: () => {
          window.open(file.webViewLink, '_blank');
        },
      });
    }
    return r;
  }, [file.webViewLink]);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <CommandBar items={commandBarItems} />
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
