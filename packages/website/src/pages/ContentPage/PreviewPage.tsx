import { InlineLoading } from 'carbon-components-react';
import React, { CSSProperties, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useManagedRenderStack } from '../../context/RenderStack';
import { selectDocMode } from '../../reduxSlices/doc';
import { selectSidebarOpen } from '../../reduxSlices/siderTree';
import { DriveFile, HalfViewPreviewMimeTypes } from '../../utils';

export interface IPreviewPageProps {
  file: DriveFile;
  versions?: boolean;
  renderStackOffset?: number;
}

function PreviewPage({ file, versions, renderStackOffset = 0 }: IPreviewPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef<HTMLIFrameElement>(null);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const docMode = useSelector(selectDocMode(file.mimeType ?? ''));
  const location = useLocation();

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
    if (versions) {
      qp = qp + '&versions=1';
    } else if (docMode === 'edit' && !sidebarOpen) {
      qp = qp + '&rm=demo';
    }
    const params = new URLSearchParams(location.search);
    const disco = params.get('disco');
    if (disco) {
      console.log('disco', disco);
      qp = qp + `&disco=${disco}`;
    }
    if (location.hash) {
      qp = qp + location.hash;
    }
    return file.webViewLink?.replace(
      /\/(edit|view)(\?usp=drivesdk)?/,
      docMode === 'edit' ? `/edit${qp}` : `/preview${qp}`
    );
  }, [sidebarOpen, file.webViewLink, location, docMode, versions]);

  useLayoutEffect(() => {
    setIsLoading(true);
    if (!ref.current) {
      return;
    }
    const cb = () => {
      setIsLoading(false);
    };
    ref.current.addEventListener('load', cb);
    const timeout = setTimeout(function(){
      setIsLoading(false);
    }, 10000);
    const addedRef = ref.current;
    return () => {
      clearTimeout(timeout);
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

  let headSubtract = 143;
  if (docMode !== 'view' || !sidebarOpen) {
    headSubtract = headSubtract - 48;
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
