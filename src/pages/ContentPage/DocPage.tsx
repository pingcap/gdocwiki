import { InlineLoading } from 'carbon-components-react';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react';
import React, { useEffect, useMemo, useState } from 'react';
import { LastModificationNote } from '../../components';

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
        text: (<LastModificationNote file={file} />) as any,
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
  }, [file]);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <CommandBar items={commandBarItems} />
      </div>
      <div style={{ maxWidth: '50rem' }}>
        {isLoading && <InlineLoading description="Loading document content..." />}
        {!isLoading && (
          <div style={{ maxWidth: '50rem' }} dangerouslySetInnerHTML={{ __html: docContent }}></div>
        )}
      </div>
    </div>
  );
}
