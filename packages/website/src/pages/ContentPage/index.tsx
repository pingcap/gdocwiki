import React from 'react';
import { useSelector } from 'react-redux';
import { selectDocMode } from '../../reduxSlices/doc';
import { DriveFile, inlineEditable, MimeTypes, previewable } from '../../utils';
import DocPage from './DocPage';
import FolderPage from './FolderPage';
import PreviewPage from './PreviewPage';
import ShortcutPage from './ShortcutPage';

export interface IContentPageProps {
  loading: string | null;
  file?: DriveFile;
  shortCutFile?: DriveFile;
  renderStackOffset?: number;
  splitWithFileListing?: boolean;
  versions?: boolean;
}

interface PageProps {
  renderStackOffset: number;
  key: string;
  file: { id?: string };
  versions?: boolean;
}

function ContentPage({
  loading,
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
        <DocPage {...props} />
      </div>
    );
  }

  // Assume a document for speed in that case.
  // We might be wrong, but that will get corrected without issue.
  if (loading !== null) {
    return docPage({
      key: loading,
      file: { id: loading },
      renderStackOffset: renderStackOffset,
    });
  }

  if (!file) {
    return null;
  }

  const pageProps: PageProps = {
    renderStackOffset: renderStackOffset,
    key: file.id!,
    file: file!,
    versions,
  };

  if (docMode) {
    const noVersionsPreview = versions && !inlineEditable(file.mimeType ?? '');
    return docMode === 'view' || noVersionsPreview ? (
      docPage(pageProps)
    ) : (
      <PreviewPage {...pageProps} />
    );
  }

  if (previewable(file?.mimeType ?? '')) {
    // Use key to force an unmount when the file changes
    // This resets event handlers
    return <PreviewPage {...pageProps} />;
  }

  switch (file?.mimeType ?? '') {
    case MimeTypes.GoogleFolder:
      return <FolderPage {...pageProps} shortCutFile={shortCutFile} />;
    case MimeTypes.GoogleShortcut:
      if (!shortCutFile) {
        return <ShortcutPage {...pageProps} splitWithFileListing={splitWithFileListing} />;
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
