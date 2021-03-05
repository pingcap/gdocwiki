import React from 'react';
import { DriveFile, MimeTypes, PreviewableMimeTypes } from '../../utils';
import DocPage from './DocPage';
import FolderPage from './FolderPage';
import PreviewPage from './PreviewPage';
import ShortcutPage from './ShortcutPage';

export interface IContentPageProps {
  file: DriveFile;
  shortCutFile?: DriveFile;
  renderStackOffset?: number;
}

function ContentPage({ file, shortCutFile, renderStackOffset = 0 }: IContentPageProps) {
  if (PreviewableMimeTypes.indexOf(file?.mimeType ?? '') > -1) {
    return <PreviewPage file={file!} renderStackOffset={renderStackOffset} />;
  }

  switch (file?.mimeType ?? '') {
    case MimeTypes.GoogleDocument:
      return <DocPage file={file!} renderStackOffset={renderStackOffset} />;
    case MimeTypes.GoogleFolder:
      return (
        <FolderPage
          file={file!}
          shortCutFile={shortCutFile}
          renderStackOffset={renderStackOffset}
        />
      );
    case MimeTypes.GoogleShortcut:
      if (!shortCutFile) {
        return <ShortcutPage file={file!} renderStackOffset={renderStackOffset} />;
      }
      break;
  }

  return (
    <div>
      This file cannot be previewed.{' '}
      <a href={file.webViewLink} target="_blank" rel="noreferrer">
        View in Google Drive
      </a>
    </div>
  );
}

export default React.memo(ContentPage);
