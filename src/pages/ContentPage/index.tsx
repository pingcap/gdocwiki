import React from 'react';
import DocPage from './DocPage';
import FolderPage from './FolderPage';
import PreviewPage from './PreviewPage';
import ShortcutPage from './ShortcutPage';

export default function ContentPage({
  file,
  shortCutFile,
}: {
  file: gapi.client.drive.File;
  shortCutFile?: gapi.client.drive.File;
}) {
  switch (file?.mimeType ?? '') {
    case 'application/vnd.google-apps.document':
      return <DocPage file={file!} />;
    case 'application/vnd.google-apps.folder':
      return <FolderPage file={file!} shortCutFile={shortCutFile} />;
    case 'application/vnd.google-apps.spreadsheet':
    case 'application/vnd.google-apps.drawing':
    case 'application/vnd.google-apps.presentation':
    case 'application/pdf':
      return <PreviewPage file={file!} />;
    case 'application/vnd.google-apps.shortcut':
      if (!shortCutFile) {
        return <ShortcutPage file={file!} />;
      }
      break;
  }

  return <div>Unsupported file: {file.mimeType}</div>;
}
