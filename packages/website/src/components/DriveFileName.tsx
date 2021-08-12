import { Stack } from 'office-ui-fabric-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { DriveFile, mdLink, MimeTypes } from '../utils';
import { DriveIcon } from './DriveIcon';
import { ShortcutIcon } from './ShortcutIcon';

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

export interface IFileInList {
  file: DriveFile;
  openInNewWindow: boolean;
  children: any;
}

export function FileWithIcon({ file }: { file: DriveFile }) {
  return (
    <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
      <DriveIcon file={file} />
      <DriveFileName file={file} />
    </Stack>
  );
}

export function FileLink({ file, openInNewWindow, children }: IFileInList) {
  const link = mdLink.parse(file.name);
  const target = openInNewWindow ? '_blank' : undefined;
  return link ? (
    <a href={link.url} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link to={`/view/${file.id}`} target={target}>
      {children}
    </Link>
  );
}