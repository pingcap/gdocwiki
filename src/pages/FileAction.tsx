import { InlineNotification } from 'carbon-components-react';
import dayjs from 'dayjs';
import {
  CommandBar,
  ICommandBarItemProps,
  IContextualMenuItem,
  Stack,
} from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import Avatar from 'react-avatar';
import { useHistory } from 'react-router-dom';
import { DriveIcon } from '../components';
import { useRender } from '../context/RenderStack';
import useFileMeta from '../hooks/useFileMeta';
import { handleGapiError, MimeTypes, showModal } from '../utils';
import { showCreateFileModal } from './FileAction.CreateFileModal';
import { showCreateLinkModal } from './FileAction.CreateLinkModal';
import styles from './FileAction.module.scss';

function FileAction() {
  const history = useHistory();

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
          previewIcon = 'MdiFileEdit';
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
      // Open folder command
      const folderValid =
        outerFolder.file?.mimeType === MimeTypes.GoogleFolder && outerFolder.file?.webViewLink;
      commands.push({
        key: 'open_folder',
        text: 'Open Folder',
        // Always occupy a place
        disabled: !folderValid,
        iconProps: { iconName: 'ColorGoogleDrive' },
        onClick: () => {
          window.open(outerFolder.file?.webViewLink, '_blank');
        },
      });

      // Add file command
      if (outerFolder.file?.id) {
        const addFileValid = folderValid && outerFolder.file?.capabilities?.canAddChildren;
        const addFileMenuItems: IContextualMenuItem[] = [];

        const s: [string, string][] = [
          ['Page', MimeTypes.GoogleDocument],
          ['Sheet', MimeTypes.GoogleSpreadsheet],
          ['Slide', MimeTypes.GooglePresentation],
          ['Folder', MimeTypes.GoogleFolder],
        ];
        s.forEach(([text, mimeType]) => {
          addFileMenuItems.push({
            key: text,
            text: text,
            iconProps: {
              imageProps: { src: DriveIcon.getIconSrc(mimeType), width: 16 },
            },
            onClick: () => {
              showCreateFileModal(text, async (name) => {
                try {
                  await gapi.client.drive.files.create({
                    supportsAllDrives: true,
                    resource: {
                      name,
                      mimeType,
                      parents: [outerFolder.file!.id!],
                    },
                  });
                  // TODO: Perform inplace update
                  setTimeout(() => {
                    history.push(`/view/${outerFolder.file!.id!}`);
                    window.location.reload();
                  }, 1000);
                } catch (e) {
                  showModal({
                    title: 'Error',
                    content: (
                      <InlineNotification
                        hideCloseButton
                        title={handleGapiError(e).message}
                        kind="error"
                      />
                    ),
                  });
                  // Throw error out to keep form modal open
                  throw e;
                }
              });
            },
          });
        });

        commands.push({
          key: 'create_file_in_folder',
          text: 'Create',
          disabled: !addFileValid,
          iconProps: { iconName: 'MdiFolderPlus' },
          subMenuProps: {
            items: [
              ...addFileMenuItems,
              {
                key: 'link',
                text: 'Link',
                iconProps: {
                  iconName: 'link',
                },
                onClick: () => {
                  showCreateLinkModal(async (name, link) => {
                    try {
                      await gapi.client.drive.files.create({
                        supportsAllDrives: true,
                        resource: {
                          name: `[${name}](${link})`,
                          mimeType: MimeTypes.GoogleDocument,
                          parents: [outerFolder.file!.id!],
                        },
                      });
                      // TODO: Perform inplace update
                      setTimeout(() => {
                        history.push(`/view/${outerFolder.file!.id!}`);
                        window.location.reload();
                      }, 1000);
                    } catch (e) {
                      showModal({
                        title: 'Error',
                        content: (
                          <InlineNotification
                            hideCloseButton
                            title={handleGapiError(e).message}
                            kind="error"
                          />
                        ),
                      });
                      // Throw error out to keep form modal open
                      throw e;
                    }
                  });
                },
              },
            ],
          },
        });
      }
    }

    return commands;
  }, [rInner?.file, outerFolder.file, history]);

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
