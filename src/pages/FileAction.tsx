import dayjs from 'dayjs';
import { CommandBar, ICommandBarItemProps, Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import Avatar from 'react-avatar';
import { useDeepestRender } from '../context/RenderStack';
import useFileMeta from '../hooks/useFileMeta';
import { MimeTypes } from '../utils';
import styles from './FileAction.module.scss';

function FileAction() {
  const r = useDeepestRender();
  const parent = useFileMeta(r?.file.parents?.[0]);

  const commandBarItems: ICommandBarItemProps[] = useMemo(() => {
    console.log(r?.file);

    if (!r?.file) {
      return [];
    }
    const commands: ICommandBarItemProps[] = [];

    if (r.file.mimeType !== MimeTypes.GoogleFolder) {
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
              name={r.file.lastModifyingUser?.displayName}
              src={r.file.lastModifyingUser?.photoLink}
              size="20"
              round
            />
            <span>
              Last modified by {r.file.lastModifyingUser?.displayName}
              {' at '}
              {dayjs(r.file.modifiedTime).fromNow()}
            </span>
          </Stack>
        ) as any,
      });

      let previewText = 'Open Preview';
      let previewIcon = 'Launch';

      switch (r.file.mimeType) {
        case MimeTypes.GoogleDocument:
        case MimeTypes.GoogleSpreadsheet:
        case MimeTypes.GooglePresentation:
          previewText = 'Open Google Doc';
          previewIcon = 'Edit';
          break;
      }

      if (r.file.webViewLink) {
        commands.push({
          key: 'view',
          text: previewText,
          iconProps: { iconName: previewIcon },
          onClick: () => {
            window.open(r.file.webViewLink, '_blank');
          },
        });
      }
    }

    {
      const folderValid =
        parent.file?.mimeType === MimeTypes.GoogleFolder && parent.file?.webViewLink;
      commands.push({
        key: 'open_folder',
        text: 'Open Folder in Google Drive',
        disabled: !folderValid,
        iconProps: { iconName: 'GoogleDrive' },
        onClick: () => {
          window.open(parent.file?.webViewLink, '_blank');
        },
      });
    }

    return commands;
  }, [r?.file, parent.file]);

  if (!r || commandBarItems.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <CommandBar items={commandBarItems} />
    </div>
  );
}

export default React.memo(FileAction);
