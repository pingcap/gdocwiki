import dayjs from 'dayjs';
import { CommandBar, ICommandBarItemProps, Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import Avatar from 'react-avatar';
import { useRender } from '../context/RenderStack';
import useFileMeta from '../hooks/useFileMeta';
import { MimeTypes } from '../utils';
import styles from './FileAction.module.scss';

function FileAction() {
  // Support we have a folder, containing a shortcut to a README document,
  // the rInner is README and the rOuter is the folder.
  const { inMost: rInner, outMost: rOuter } = useRender();

  const outerFolderId =
    rOuter?.file.mimeType === MimeTypes.GoogleFolder ? rOuter?.file.id : rOuter?.file.parents?.[0];
  const outerFolder = useFileMeta(outerFolderId);

  const commandBarItems: ICommandBarItemProps[] = useMemo(() => {
    const commands: ICommandBarItemProps[] = [];

    if (rInner?.file && rInner.file.mimeType !== MimeTypes.GoogleFolder) {
      // For non-folder, show modify date, and how to open it.
      commands.push({
        key: 'modify_user',
        text: (
          <Stack
            verticalAlign="center"
            horizontal
            tokens={{ childrenGap: 8 }}
            className={styles.note}
          >
            <Avatar
              name={rInner.file.lastModifyingUser?.displayName}
              src={rInner.file.lastModifyingUser?.photoLink}
              size="20"
              round
            />
            <span>
              Last modified by {rInner.file.lastModifyingUser?.displayName}
              {' at '}
              {dayjs(rInner.file.modifiedTime).fromNow()}
            </span>
          </Stack>
        ) as any,
      });

      let previewText = 'Open Preview';
      let previewIcon = 'Launch';

      switch (rInner.file.mimeType) {
        case MimeTypes.GoogleDocument:
        case MimeTypes.GoogleSpreadsheet:
        case MimeTypes.GooglePresentation:
          previewText = 'Open Google Doc';
          previewIcon = 'Edit';
          break;
      }

      if (rInner.file.webViewLink) {
        commands.push({
          key: 'view',
          text: previewText,
          iconProps: { iconName: previewIcon },
          onClick: () => {
            window.open(rInner.file.webViewLink, '_blank');
          },
        });
      }
    }

    {
      const folderValid =
        outerFolder.file?.mimeType === MimeTypes.GoogleFolder && outerFolder.file?.webViewLink;
      commands.push({
        key: 'open_folder',
        text: 'Open Folder in Google Drive',
        // Always occupy a place
        disabled: !folderValid,
        iconProps: { iconName: 'GoogleDrive' },
        onClick: () => {
          window.open(outerFolder.file?.webViewLink, '_blank');
        },
      });
    }

    return commands;
  }, [rInner?.file, outerFolder.file]);

  if (commandBarItems.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <CommandBar items={commandBarItems} />
    </div>
  );
}

export default React.memo(FileAction);
