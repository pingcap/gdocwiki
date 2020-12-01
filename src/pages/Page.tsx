import { InlineLoading } from 'carbon-components-react';
import { Breadcrumb } from 'office-ui-fabric-react';
import React from 'react';
import { useParams } from 'react-router-dom';
import useFileMeta from '../hooks/useFileMeta';
import useFilePathBreadcrumb from '../hooks/useFilePathBreadcrumb';
import ContentPage from './ContentPage';
import styles from './Page.module.scss';

export default function Page() {
  const { id } = useParams<any>();
  const { file, loading, error } = useFileMeta(id);
  const { paths } = useFilePathBreadcrumb(file, loading);

  return (
    <div className={styles.contentContainer}>
      {(paths?.length ?? 0) > 0 && <Breadcrumb items={paths!} />}
      {loading && <InlineLoading description="Loading file metadata..." />}
      {!loading && !!error && error}
      {!loading && !!file && <ContentPage file={file} />}
    </div>
  );
}
