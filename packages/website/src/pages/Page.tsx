import { InlineLoading } from 'carbon-components-react';
import { Stack, StackItem } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConfig } from '../config';
import useFileMeta from '../hooks/useFileMeta';
import useTitle from '../hooks/useTitle';
import useUpdateSiderFromPath from '../hooks/useUpdateSiderFromPath';
import { selectDocMode, setDocMode } from '../reduxSlices/doc';
import { selectPageReloadToken } from '../reduxSlices/pageReload';
import { selectSidebarOpen } from '../reduxSlices/siderTree';
import { DocMode, MimeTypes } from '../utils';
import ContentPage from './ContentPage';
import FileAction from './FileAction';
import FileBreadcrumb from './FileBreadcrumb';
import RightContainer from './RightContainer';

interface PageProps {
  docMode?: DocMode;
}

function Page(props: PageProps) {
  const id = useUpdateSiderFromPath('id');
  const { file, loading, error } = useFileMeta(id);
  const dispatch = useDispatch();
  const docMode = useSelector(selectDocMode);
  const sidebarOpen = useSelector(selectSidebarOpen);
  if (props.docMode && props.docMode !== docMode) {
    dispatch(setDocMode(props.docMode));
  }

  useTitle((file) => {
    if (file && file?.id !== getConfig().REACT_APP_ROOT_ID) {
      return file.name;
    } else {
      return undefined;
    }
  }, file);

  const previewMode = useMemo(() => {
    return (
      !sidebarOpen &&
      file &&
      (file.mimeType !== MimeTypes.GoogleFolder || docMode !== 'view') &&
      file.mimeType !== MimeTypes.GoogleDocument
    );
  }, [sidebarOpen, file, docMode]);

  console.log('previewMode', previewMode, docMode);
  return (
    <RightContainer>
      <>
        {previewMode ? (
          <Stack horizontal>
            <StackItem key="breadcrumb">
              <FileBreadcrumb file={file} />
            </StackItem>
            {previewMode && (
              <StackItem key="fileaction">
                <FileAction file={file} key={file?.id} allOverflow={true} />
              </StackItem>
            )}
          </Stack>
        ) : (
          <>
            {docMode === 'view' && (
              <div style={{ paddingTop: '0.2rem' }}>
                <FileBreadcrumb file={file} />
              </div>
            )}
            <FileAction file={file} key={file?.id} />
          </>
        )}
      </>
      {loading && <InlineLoading description="Loading file metadata..." />}
      {!loading && !!error && error}
      {<ContentPage loading={loading || error ? id : null} file={file} />}
    </RightContainer>
  );
}

function Reloader(props: PageProps) {
  const token = useSelector(selectPageReloadToken);
  return <Page key={token} {...props} />;
}

export default React.memo(Reloader);
