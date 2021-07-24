import React from 'react';
import { useSelector } from 'react-redux';
import { selectDocMode } from '../../reduxSlices/doc';
import { DriveFile, MimeTypes, PreviewableMimeTypes } from '../../utils';
import DocPage from './DocPage';
import FolderPage from './FolderPage';
import PreviewPage from './PreviewPage';
import ShortcutPage from './ShortcutPage';

export interface IContentPageProps {
  loading: string | null;
  file?: DriveFile;
  shortCutFile?: DriveFile;
  renderStackOffset?: number;
}

function ContentPage({ loading, file, shortCutFile, renderStackOffset = 0 }: IContentPageProps) {
  const docMode = useSelector(selectDocMode);

  // Assume a document for speed in that case.
  // We might be wrong, but that will get corrected without issue.
  if (loading !== null) {
    return <DocPage file={{ id: loading }} renderStackOffset={renderStackOffset} />;
  }

  if (PreviewableMimeTypes.indexOf(file?.mimeType ?? '') > -1) {
    return <PreviewPage file={file!} renderStackOffset={renderStackOffset} />;
  }

  switch (file?.mimeType ?? '') {
    case MimeTypes.GoogleDocument:
      if (docMode !== 'view') {
        const edit = docMode === 'edit';
        return <PreviewPage edit={edit} file={file!} renderStackOffset={renderStackOffset} />;
      }
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
      <a href={file!.webViewLink} target="_blank" rel="noreferrer">
        View in Google Drive
      </a>
    </div>
  );
}

export default React.memo(ContentPage);
