import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import LastModificatioNote from '../../components/LastModificationNote';
import { InlineLoading } from 'carbon-components-react';
import { useEventListener } from 'ahooks';

export interface IDocPageProps {
  file: gapi.client.drive.File;
}

export default function PreviewPage({ file }: IDocPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef<HTMLIFrameElement>(null);

  useEventListener(
    'load',
    () => {
      setIsLoading(false);
    },
    { target: ref }
  );

  useEffect(() => {
    setIsLoading(true);
  }, [file, file.webViewLink]);

  const commandBarItems = useMemo(() => {
    const r: ICommandBarItemProps[] = [
      {
        key: 'modify_user',
        text: (<LastModificatioNote file={file} />) as any,
      },
    ];

    let previewText = 'Preview in Google Drive';
    let previewIcon = 'Launch';

    switch (file.mimeType) {
      case 'application/vnd.google-apps.presentation':
      case 'application/vnd.google-apps.spreadsheet':
        previewText = 'Open in Google Doc';
        previewIcon = 'Edit';
        break;
    }

    if (file.webViewLink) {
      r.push({
        key: 'view',
        text: previewText,
        iconProps: { iconName: previewIcon },
        onClick: () => {
          window.open(file.webViewLink, '_blank');
        },
      });
    }
    return r;
  }, [file]);

  const contentStyle = useMemo(() => {
    const baseStyle: CSSProperties = {};
    if (
      file.mimeType !== 'application/vnd.google-apps.spreadsheet' &&
      file.mimeType !== 'application/vnd.google-apps.presentation'
    ) {
      baseStyle.maxWidth = '50rem';
    }
    return baseStyle;
  }, [file.mimeType]);

  useEffect(() => {}, [file.mimeType]);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <CommandBar items={commandBarItems} />
      </div>
      <div style={contentStyle}>
        {file.webViewLink && (
          <div>
            {isLoading && <InlineLoading description="Loading preview..." />}
            <iframe
              width="100%"
              src={file.webViewLink.replace(/\/(edit|view)\?usp=drivesdk/, '/preview')}
              ref={ref}
              style={{ height: 'calc(100vh - 300px)', minHeight: 500 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
