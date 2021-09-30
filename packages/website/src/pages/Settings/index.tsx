import { InlineLoading } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React from 'react';
import { useSelector } from 'react-redux';
import useFileMeta from '../../hooks/useFileMeta';
import useUpdateSiderFromPath from '../../hooks/useUpdateSiderFromPath';
import { selectPageReloadToken } from '../../reduxSlices/pageReload';
import { shouldShowTagSettings } from '../../utils';
import FileBreadcrumb from '../FileBreadcrumb';
import RightContainer from '../RightContainer';
import SettingsTag from './Settings.tags';

function Settings() {
  const id = useUpdateSiderFromPath('id');
  const { file, loading, error } = useFileMeta(id);

  return (
    <RightContainer>
      <div style={{ marginBottom: 32 }}>
        <FileBreadcrumb
          file={file}
          extraItems={[
            {
              key: 'settings',
              text: 'Settings',
            },
          ]}
        />
      </div>
      {loading && <InlineLoading description="Loading..." />}
      {error}
      <div style={{ maxWidth: '30rem' }}>
        <Stack tokens={{ childrenGap: 50 }}>
          {shouldShowTagSettings(file) && <SettingsTag file={file!} />}
        </Stack>
      </div>
    </RightContainer>
  );
}

function Reloader() {
  const token = useSelector(selectPageReloadToken);
  return <Settings key={token} />;
}

export default React.memo(Reloader);
