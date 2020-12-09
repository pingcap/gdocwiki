import React from 'react';
import { MimeTypes } from '../../utils';
import DocPage from './DocPage';
import FolderPage from './FolderPage';
import PreviewPage from './PreviewPage';
import ShortcutPage from './ShortcutPage';

export interface IContentPageProps {
  file: gapi.client.drive.File;
  shortCutFile?: gapi.client.drive.File;
  renderStackOffset?: number;
}

function ContentPage({ file, shortCutFile, renderStackOffset = 0 }: IContentPageProps) {
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
    case MimeTypes.GoogleSpreadsheet:
    case MimeTypes.GooglePresentation:
    case MimeTypes.GoogleDrawing:
    case MimeTypes.MSOpenWord:
    case MimeTypes.MSOpenExcel:
    case MimeTypes.MSWord:
    case MimeTypes.MSExcel:
    case MimeTypes.PDF:
      return <PreviewPage file={file!} renderStackOffset={renderStackOffset} />;
    case MimeTypes.GoogleShortcut:
      if (!shortCutFile) {
        return <ShortcutPage file={file!} renderStackOffset={renderStackOffset} />;
      }
      break;
  }

  return <div>Unsupported file: {file.mimeType}</div>;
}

export default React.memo(ContentPage);
