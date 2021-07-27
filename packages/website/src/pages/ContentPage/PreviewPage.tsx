import { useEventListener } from 'ahooks';
import { InlineLoading } from 'carbon-components-react';
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useManagedRenderStack } from '../../context/RenderStack';
import { selectSidebarOpen } from '../../reduxSlices/siderTree';
import { DriveFile, HalfViewPreviewMimeTypes } from '../../utils';

export interface IPreviewPageProps {
  file: DriveFile;
  edit?: boolean;
  renderStackOffset?: number;
}

function PreviewPage({ file, edit = false, renderStackOffset = 0 }: IPreviewPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef<HTMLIFrameElement>(null);
  const sidebarOpen = useSelector(selectSidebarOpen);

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
    if (HalfViewPreviewMimeTypes.indexOf(file.mimeType ?? '') > -1) {
      baseStyle.maxWidth = '50rem';
    }
    return baseStyle;
  }, [file.mimeType]);

  useEffect(() => {}, [file.mimeType]);

  if (!file.webViewLink) {
    return (
      <div style={contentStyle}>
        <p>No preview available</p>
      </div>
    );
  }

  const iframeSrc = file.webViewLink.replace(
    /\/(edit|view)\?usp=drivesdk/,
    edit === true ? '/edit' : '/preview'
  );

  const headSubtract = edit === true ? (!sidebarOpen ? 70 : 100) : 120;

  return (
    <div style={contentStyle}>
      <div>
        {isLoading && <InlineLoading description="Loading preview..." />}
        <iframe
          title="Preview"
          width="100%"
          src={iframeSrc}
          ref={ref}
          style={{ height: `calc(100vh - ${headSubtract}px)`, minHeight: 500 }}
        />
      </div>
    </div>
  );
}

export default React.memo(PreviewPage);
