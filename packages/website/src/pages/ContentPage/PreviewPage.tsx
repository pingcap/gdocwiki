import { InlineLoading } from 'carbon-components-react';
import React, { CSSProperties, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useManagedRenderStack } from '../../context/RenderStack';
import { selectDocMode } from '../../reduxSlices/doc';
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
  const docMode = useSelector(selectDocMode);

  useManagedRenderStack({
    depth: renderStackOffset,
    id: 'PreviewPage',
    file,
  });

  const contentStyle = useMemo(() => {
    const baseStyle: CSSProperties = {};
    if (HalfViewPreviewMimeTypes.indexOf(file.mimeType ?? '') > -1) {
      baseStyle.maxWidth = '50rem';
    }
    return baseStyle;
  }, [file.mimeType]);

  const iframeSrc = useMemo(() => {
    let qp = `?frameborder=0`;
    if (edit && !sidebarOpen) {
      qp = qp + '&rm=demo';
    }
    return file.webViewLink?.replace(
      /\/(edit|view)\?usp=drivesdk/,
      edit ? `/edit${qp}` : `/preview${qp}`
    );
  }, [edit, sidebarOpen, file.webViewLink]);

  useLayoutEffect(() => {
    setIsLoading(true);
    if (!ref.current) {
      return;
    }
    const cb = () => {
      setIsLoading(false);
    };
    ref.current.addEventListener('load', cb);
    const addedRef = ref.current;
    return () => {
      addedRef.removeEventListener('load', cb);
    };
  }, [iframeSrc]);

  if (!file.webViewLink) {
    return (
      <div style={contentStyle}>
        <p>No preview available</p>
      </div>
    );
  }

  let headSubtract = sidebarOpen ? 100 : 65;
  if (docMode === 'view') {
    headSubtract += 60;
  }

  return (
    <div style={contentStyle}>
      <div>
        {isLoading && <InlineLoading description="Loading preview..." />}
        <iframe
          title="Preview"
          width="100%"
          key={iframeSrc} // force the iframe to be recreated
          src={iframeSrc}
          ref={ref}
          style={{ height: `calc(100vh - ${headSubtract}px)`, minHeight: 500 }}
        />
      </div>
    </div>
  );
}

export default React.memo(PreviewPage);
