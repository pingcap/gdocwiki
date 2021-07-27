import { InlineLoading } from 'carbon-components-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConfig } from '../config';
import useFileMeta from '../hooks/useFileMeta';
import useTitle from '../hooks/useTitle';
import useUpdateSiderFromPath from '../hooks/useUpdateSiderFromPath';
import { selectDocMode, setDocMode } from '../reduxSlices/doc';
import { selectPageReloadToken } from '../reduxSlices/pageReload';
import { DocMode } from '../utils';
import ContentPage from './ContentPage';
import FileAction from './FileAction';
import FileBreadcrumb from './FileBreadcrumb';
import styles from './Page.module.scss';
import RightContainer from './RightContainer';

interface PageProps {
  docMode?: DocMode;
}

function Page(props: PageProps) {
  const id = useUpdateSiderFromPath('id');
  const { file, loading, error } = useFileMeta(id);
  const dispatch = useDispatch();
  if (props.docMode) {
    dispatch(setDocMode(props.docMode));
  }
  const docMode = useSelector(selectDocMode);

  useTitle((file) => {
    if (file && file?.id !== getConfig().REACT_APP_ROOT_ID) {
      return file.name;
    } else {
      return undefined;
    }
  }, file);

  return (
    <RightContainer>
      <div className={styles.actionBar}>
        {docMode === 'view' && <FileBreadcrumb file={file} />}
        <FileAction />
      </div>
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
