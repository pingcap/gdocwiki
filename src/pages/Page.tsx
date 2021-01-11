import { InlineLoading } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Tag } from '../components';
import { getConfig } from '../config';
import useFileMeta from '../hooks/useFileMeta';
import useTitle from '../hooks/useTitle';
import useUpdateSiderFromPath from '../hooks/useUpdateSiderFromPath';
import { selectPageReloadToken } from '../reduxSlices/pageReload';
import { extractTags } from '../utils';
import ContentPage from './ContentPage';
import FileAction from './FileAction';
import FileBreadcrumb from './FileBreadcrumb';
import RightContainer from './RightContainer';

function Page() {
  const id = useUpdateSiderFromPath('id');
  const { file, loading, error } = useFileMeta(id);

  useTitle(
    (file) => {
      if (file && file?.id !== getConfig().REACT_APP_ROOT_ID) {
        return file.name;
      } else {
        return undefined;
      }
    },
    [file]
  );

  const tags = useMemo(() => {
    if (!file) {
      return [];
    }
    return extractTags(file);
  }, [file]);

  return (
    <RightContainer>
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
              <Tag.Link key={tag} text={tag} />
            ))}
          </Stack>
        )}
      </div>
      {loading && <InlineLoading description="Loading file metadata..." />}
      {!loading && !!error && error}
      {!loading && !!file && <ContentPage file={file} />}
    </RightContainer>
  );
}

function Reloader() {
  const token = useSelector(selectPageReloadToken);
  return <Page key={token} />;
}

export default React.memo(Reloader);
