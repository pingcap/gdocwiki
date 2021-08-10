import { InlineLoading } from 'carbon-components-react';
import { Stack, StackItem } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConfig } from '../config';
import useFileMeta from '../hooks/useFileMeta';
import useTitle from '../hooks/useTitle';
import useUpdateSiderFromPath from '../hooks/useUpdateSiderFromPath';
import { selectDocMode, setDocMode, resetDocMode  } from '../reduxSlices/doc';
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
  const docMode = useSelector(selectDocMode(file?.mimeType ?? ''));
  const sidebarOpen = useSelector(selectSidebarOpen);
  if (file?.mimeType && props.docMode !== docMode) {
    if (!props.docMode) {
      dispatch(resetDocMode(file.mimeType));
    } else {
      const newModes = {};
      newModes[file!.mimeType!] = props.docMode;
      dispatch(setDocMode(newModes));
    }
  }

  useTitle((file) => {
    if (file && file?.id !== getConfig().REACT_APP_ROOT_ID) {
      return file.name;
    } else {
      return undefined;
    }
  }, file);

  const previewModeNotDoc = useMemo(() => {
    return (
      !sidebarOpen &&
      file &&
      file.mimeType !== MimeTypes.GoogleFolder &&
      file.mimeType !== MimeTypes.GoogleDocument
    );
  }, [sidebarOpen, file]);

  const previewModeDoc = file?.mimeType === MimeTypes.GoogleDocument && docMode !== 'view';

  return (
    <RightContainer>
      <>
        {previewModeNotDoc || previewModeDoc ? (
          <Stack horizontal>
            <StackItem key="fileaction" grow={1}>
              <FileAction file={file} key={file?.id} allOverflow={true} />
            </StackItem>
            <StackItem key="breadcrumb" grow={11}>
              <FileBreadcrumb file={file} />
            </StackItem>
          </Stack>
        ) : (
          <>
            <div style={{ paddingTop: '0.2rem' }}>
              <FileBreadcrumb file={file} />
            </div>
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
