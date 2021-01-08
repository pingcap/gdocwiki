import { InlineLoading } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Tag } from '../components';
import { getConfig } from '../config';
import useFileMeta from '../hooks/useFileMeta';
import { selectMapIdToFile } from '../reduxSlices/files';
import { selectPageReloadToken } from '../reduxSlices/pageReload';
import { extractTags } from '../utils';
import ContentPage from './ContentPage';
import FileAction from './FileAction';
import FileBreadcrumb from './FileBreadcrumb';
import styles from './Page.module.scss';

function PageReloader({ overrideId }: { overrideId?: string }) {
  const token = useSelector(selectPageReloadToken);
  return <Page overrideId={overrideId} key={token} />;
}

function Page({ overrideId }: { overrideId?: string }) {
  const { id: paramId } = useParams<any>();
  const id = overrideId ?? paramId;
  const { file, loading, error } = useFileMeta(id);

  const mapIdToFile = useSelector(selectMapIdToFile);

  useEffect(() => {
    let suffix = 'Gdoc Wiki';
    if (getConfig().REACT_APP_NAME) {
      suffix = `${getConfig().REACT_APP_NAME} Wiki`;
    } else {
      const s = mapIdToFile?.[getConfig().REACT_APP_ROOT_ID]?.name;
      if (s) {
        suffix = `${s} Wiki`;
      }
    }

    if (!file || file?.id === getConfig().REACT_APP_ROOT_ID) {
      document.title = suffix;
    } else {
      document.title = `${file.name} - ${suffix}`;
    }
  }, [file, mapIdToFile]);

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
              <Tag key={tag} text={tag} />
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
