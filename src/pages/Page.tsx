import { InlineLoading } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Tag } from '../components';
import { usePageReloadToken } from '../context/PageReloader';
import useFileMeta from '../hooks/useFileMeta';
import { extractTags } from '../utils';
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

  const tags = useMemo(() => {
    if (!file) {
      return [];
    }
    return extractTags(file);
  }, [file]);

  return (
    <div className={styles.contentContainer}>
      <div style={{ marginBottom: 32 }}>
        <FileBreadcrumb file={file} />
        <FileAction />
        {tags.length > 0 && (
          <Stack
            verticalAlign="center"
            horizontal
            tokens={{ childrenGap: 4 }}
            style={{ paddingLeft: 8, paddingTop: 8 }}
          >
            {tags.map((tag) => (
              <Tag text={tag} />
            ))}
          </Stack>
        )}
      </div>
      {loading && <InlineLoading description="Loading file metadata..." />}
      {!loading && !!error && error}
      {!loading && !!file && <ContentPage file={file} />}
    </div>
  );
}

export default React.memo(PageReloader);
