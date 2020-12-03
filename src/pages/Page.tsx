import { InlineLoading } from 'carbon-components-react';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePageReloadToken } from '../context/PageReloader';
import useFileMeta from '../hooks/useFileMeta';
import ContentPage from './ContentPage';
import FileAction from './FileAction';
import FileBreadcrumb from './FileBreadcrumb';
import styles from './Page.module.scss';

function PageReloader({ overrideId }: { overrideId?: string }) {
  const token = usePageReloadToken();
  return <Page overrideId={overrideId} key={token} />;
}

function Page({ overrideId }: { overrideId?: string }) {
  const { id: paramId } = useParams<any>();
  const id = overrideId ?? paramId;
  const { file, loading, error } = useFileMeta(id);

  useEffect(() => {
    if (file?.name) {
      document.title = `${file.name} - Gdoc Wiki`;
    }
  }, [file]);

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

export default React.memo(PageReloader);
