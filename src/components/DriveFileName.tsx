import { Stack } from 'office-ui-fabric-react';
import React from 'react';
import { DriveFile, mdLink, MimeTypes } from '../utils';
import { ShortcutIcon } from '.';

function DriveFileName({ file }: { file: DriveFile }) {
  const link = mdLink.parse(file.name);
  if (link) {
    return <span>{link.title}</span>;
  } else {
    return (
      <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
        <span>{file.name}</span>
        {file.mimeType === MimeTypes.GoogleShortcut && <ShortcutIcon />}
      </Stack>
    );
  }
}

export default React.memo(DriveFileName);
