import { Stack } from 'office-ui-fabric-react';
import React from 'react';
import { DriveFile, mdLink, MimeTypes } from '../utils';
import { ShortcutIcon } from '.';

function DriveFileName_({ file }: { file: DriveFile }) {
  const link = mdLink.parse(file.name);
  const style = { textDecoration: 'underline', color: '#0f62fe' };
  if (link) {
    return <span style={style}>{link.title}</span>;
  } else {
    return (
      <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
        <span style={style}>{file.name}</span>
        {file.mimeType === MimeTypes.GoogleShortcut && <ShortcutIcon />}
      </Stack>
    );
  }
}

export const DriveFileName = React.memo(DriveFileName_);
