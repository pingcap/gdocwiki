import { InlineLoading } from 'carbon-components-react';
import { Stack, Text } from 'office-ui-fabric-react';
import React from 'react';
import { useSelector } from 'react-redux';
import useFileMeta from '../hooks/useFileMeta';
import useUpdateSiderFromPath from '../hooks/useUpdateSiderFromPath';
import { selectPageReloadToken } from '../reduxSlices/pageReload';
import { shouldShowTagSettings } from '../utils';
import FileBreadcrumb from './FileBreadcrumb';
import RightContainer from './RightContainer';
import SettingsTag from './Settings.tags';

export function SettingsTitle({ children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Text variant="large">{children}</Text>
    </div>
  );
}

function Settings() {
  const outerId = useUpdateSiderFromPath('outerId');
  const { file: outerFile, loading, error } = useFileMeta(outerId);

  return (
    <RightContainer>
      <div style={{ marginBottom: 32 }}>
        <FileBreadcrumb
          file={outerFile}
          extraItems={[
            {
              key: 'settings',
              text: 'Settings',
            },
          ]}
        />
      </div>
      {loading && <InlineLoading description="Loading..." />}
      {!loading && !!error && error}
      <div style={{ maxWidth: '30rem' }}>
        <Stack tokens={{ childrenGap: 50 }}>
          {shouldShowTagSettings(outerFile) && <SettingsTag file={outerFile!} />}
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
