import React from 'react';
import { useSelector } from 'react-redux';
import { selectDocMode } from '../../reduxSlices/doc';
import { DriveFile, inlineEditable, MimeTypes, previewable } from '../../utils';
import DocPage from './DocPage';
import FolderPage from './FolderPage';
import PreviewPage from './PreviewPage';
import ShortcutPage from './ShortcutPage';

export interface IContentPageProps {
  file: DriveFile;
  shortCutFile?: DriveFile;
  renderStackOffset?: number;
  splitWithFileListing?: boolean;
  versions?: boolean;
}

interface PageProps {
  renderStackOffset: number;
  file: { id?: string };
  versions?: boolean;
}

function ContentPage({
  file,
  shortCutFile,
  splitWithFileListing = false,
  renderStackOffset = 0,
  versions = false,
}: IContentPageProps) {
  const docMode = useSelector(selectDocMode(file?.mimeType ?? ''));
  function docPage(props: PageProps) {
    let style = {};
    if (!splitWithFileListing) {
      style = Object.assign(style, { marginLeft: '1rem' });
    }
    return (
      <div style={style}>
        <DocPage key={file.id} {...props} />
      </div>
    );
  }

  const pageProps: PageProps = {
    renderStackOffset: renderStackOffset,
    file,
    versions,
  };

  // Assume a document for speed if we are still loading the file metadata
  // We might be wrong, but that will get corrected without issue.
  if (!file.name) {
    if (file.id !== 'root') {
      return docPage({
        file,
        renderStackOffset: renderStackOffset,
      });
    } else {
      return <FolderPage {...pageProps} shortCutFile={shortCutFile} />;
    }
  }

  if (docMode) {
    const noVersionsPreview = versions && !inlineEditable(file.mimeType ?? '');
    return docMode === 'view' || noVersionsPreview ? (
      docPage(pageProps)
    ) : (
      <PreviewPage {...pageProps} />
    );
  }

  if (previewable(file.mimeType ?? '')) {
    // Use key to force an unmount when the file changes
    // This resets event handlers
    return <PreviewPage {...pageProps} />;
  }

  switch (file.mimeType ?? '') {
    case MimeTypes.GoogleFolder:
      return <FolderPage {...pageProps} shortCutFile={shortCutFile} />;
    case MimeTypes.GoogleShortcut:
      const child = (pointingFile: DriveFile) => (
        <ContentPage
          file={pointingFile}
          shortCutFile={file}
          splitWithFileListing={splitWithFileListing}
          renderStackOffset={renderStackOffset + 1}
        />
      );
      if (!shortCutFile) {
        return <ShortcutPage file={file} child={child} renderStackOffset={renderStackOffset} />;
      }
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
