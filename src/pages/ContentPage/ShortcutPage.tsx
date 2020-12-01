import { InlineLoading } from 'carbon-components-react';
import React from 'react';
import ContentPage from '.';
import useFileMeta from '../../hooks/useFileMeta';

export default function ShortcutPage({ file }: { file: gapi.client.drive.File }) {
  const { file: pointingFile, loading, error } = useFileMeta(file.shortcutDetails?.targetId);
  return (
    <>
      {loading && <InlineLoading description="Loading shortcut metadata..." />}
      {!loading && !!error && error}
      {!loading && !!pointingFile && <ContentPage file={pointingFile} shortCutFile={file} />}
    </>
  );
}
