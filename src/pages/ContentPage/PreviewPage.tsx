import { useEventListener } from 'ahooks';
import { InlineLoading } from 'carbon-components-react';
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useManagedRenderStack } from '../../context/RenderStack';
import { DriveFile, MimeTypes } from '../../utils';

export interface IPreviewPageProps {
  file: DriveFile;
  renderStackOffset?: number;
}

function PreviewPage({ file, renderStackOffset = 0 }: IPreviewPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef<HTMLIFrameElement>(null);

  useManagedRenderStack({
    depth: renderStackOffset,
    id: 'PreviewPage',
    file,
  });

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

  const contentStyle = useMemo(() => {
    const baseStyle: CSSProperties = {};
    if (
      file.mimeType !== MimeTypes.GoogleSpreadsheet &&
      file.mimeType !== MimeTypes.GooglePresentation &&
      file.mimeType !== MimeTypes.MSOpenExcel &&
      file.mimeType !== MimeTypes.MSExcel
    ) {
      baseStyle.maxWidth = '50rem';
    }
    return baseStyle;
  }, [file.mimeType]);

  useEffect(() => {}, [file.mimeType]);

  return (
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
  );
}

export default React.memo(PreviewPage);
