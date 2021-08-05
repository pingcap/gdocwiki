import { InlineLoading } from 'carbon-components-react';
import React from 'react';
import { useManagedRenderStack } from '../../context/RenderStack';
import useFileMeta from '../../hooks/useFileMeta';
import { DriveFile } from '../../utils';
import ContentPage from '.';

export interface IShortcutPageProps {
  file: DriveFile;
  renderStackOffset?: number;
  splitWithFileListing?: boolean;
}

function ShortcutPage(props: IShortcutPageProps) {
  const { file, splitWithFileListing = false, renderStackOffset = 0 } = props;
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
          splitWithFileListing={splitWithFileListing}
          renderStackOffset={renderStackOffset + 1}
        />
      )}
    </>
  );
}

export default React.memo(ShortcutPage);
