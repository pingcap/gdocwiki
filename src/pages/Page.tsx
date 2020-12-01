import { InlineLoading } from 'carbon-components-react';
import React from 'react';
import { useParams } from 'react-router-dom';
import useFileMeta from '../hooks/useFileMeta';
import ContentPage from './ContentPage';
import FileAction from './FileAction';
import FileBreadcrumb from './FileBreadcrumb';
import styles from './Page.module.scss';

function Page() {
  const { id } = useParams<any>();
  const { file, loading, error } = useFileMeta(id);

  return (
    <div className={styles.contentContainer}>
      <FileBreadcrumb file={file} />
      <FileAction />
      {loading && <InlineLoading description="Loading file metadata..." />}
      {!loading && !!error && error}
      {!loading && !!file && <ContentPage file={file} />}
    </div>
  );
}

export default React.memo(Page);
