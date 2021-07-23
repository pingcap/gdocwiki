import { InlineLoading } from 'carbon-components-react';
import React from 'react';
import { useManagedRenderStack } from '../../context/RenderStack';
import useFileMeta from '../../hooks/useFileMeta';
import { DriveFile } from '../../utils';
import ContentPage from '.';

export interface IShortcutPageProps {
  file: DriveFile;
  renderStackOffset?: number;
}

function ShortcutPage({ file, renderStackOffset = 0 }: IShortcutPageProps) {
  useManagedRenderStack({
    depth: renderStackOffset,
    id: 'ShortcutPage',
    file,
  });

  const { file: pointingFile, loading, error } = useFileMeta(file.shortcutDetails?.targetId);
  return (
    <>
      {loading && <InlineLoading description="Loading shortcut metadata..." />}
      {!loading && !!error && error}
      {!loading && !!pointingFile && (
        <ContentPage
          loading={null}
          file={pointingFile}
          shortCutFile={file}
          renderStackOffset={renderStackOffset + 1}
        />
      )}
    </>
  );
}

export default React.memo(ShortcutPage);
