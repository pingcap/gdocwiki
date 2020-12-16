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
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { DriveIcon } from '../components';
import config from '../config';
import { usePageReloader } from '../context/PageReloader';
import { useRender } from '../context/RenderStack';
import useFileMeta from '../hooks/useFileMeta';
import { removeFile, updateFile } from '../reduxSlices/files';
import { handleGapiError, MimeTypes, showConfirm, showPrompt } from '../utils';
import { showCreateFileModal } from './FileAction.CreateFileModal';
import { showCreateLinkModal } from './FileAction.CreateLinkModal';
import { showRenameFileModal } from './FileAction.RenameFileModal';
import styles from './FileAction.module.scss';

function promptError(e) {
  showPrompt({
    title: 'Error',
    content: <InlineNotification hideCloseButton title={handleGapiError(e).message} kind="error" />,
  });
  // Throw error out to keep form modal open
  throw e;
}

function FileAction() {
  const history = useHistory();
  const dispatch = useDispatch();
  const reloadPage = usePageReloader();

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
      if (outerFolder.file?.id && outerFolder.file?.capabilities?.canAddChildren) {
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
                  const resp = await gapi.client.drive.files.create({
                    supportsAllDrives: true,
                    fields: '*',
                    resource: {
                      name,
                      mimeType,
                      parents: [outerFolder.file!.id!],
                    },
                  });
                  dispatch(updateFile(resp.result));
                  history.push(`/view/${outerFolder.file!.id!}`);
                  reloadPage();
                } catch (e) {
                  promptError(e);
                }
              });
            },
          });
        });

        commands.push({
          key: 'create_file_in_folder',
          text: 'Create',
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
                      const resp = await gapi.client.drive.files.create({
                        supportsAllDrives: true,
                        fields: '*',
                        resource: {
                          name: `[${name}](${link})`,
                          mimeType: MimeTypes.GoogleDocument,
                          parents: [outerFolder.file!.id!],
                        },
                      });
                      dispatch(updateFile(resp.result));
                      history.push(`/view/${outerFolder.file!.id!}`);
                      reloadPage();
                    } catch (e) {
                      promptError(e);
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
  }, [rInner?.file, outerFolder.file, history, dispatch, reloadPage]);

  const commandBarOverflowItems = useMemo(() => {
    const commands: ICommandBarItemProps[] = [];

    if (rOuter?.file) {
      const fileKind = rOuter.file.mimeType === MimeTypes.GoogleFolder ? 'Folder' : 'File';

      if (rOuter.file.capabilities?.canRename) {
        commands.push({
          key: 'rename',
          text: `Rename ${fileKind}`,
          iconProps: { iconName: 'Edit' },
          onClick: () => {
            showRenameFileModal(fileKind, rOuter.file.name, async (name) => {
              try {
                const resp = await gapi.client.drive.files.update({
                  supportsAllDrives: true,
                  fileId: rOuter.file.id!,
                  fields: '*',
                  resource: {
                    name,
                  },
                });
                dispatch(updateFile(resp.result));
                reloadPage();
              } catch (e) {
                promptError(e);
              }
            });
          },
        });
      }

      // Do not allow trash root folder..
      if (rOuter?.file.id !== config.REACT_APP_ROOT_ID && rOuter.file.capabilities?.canTrash) {
        commands.push({
          key: 'trash',
          text: `Trash ${fileKind}`,
          iconProps: { iconName: 'Trash' },
          onClick: () => {
            showConfirm({
              modalHeading: `Trash ${fileKind}`,
              yesButtonKind: 'danger',
              submittingText: 'Trashing...',
              submittedText: `${fileKind} trashed!`,
              content: (
                <span>
                  Are you sure want to move "<strong>{rOuter.file.name}</strong>" to trash?
                </span>
              ),
              submitFn: async () => {
                try {
                  await gapi.client.drive.files.update({
                    fileId: rOuter.file.id!,
                    supportsAllDrives: true,
                    resource: {
                      trashed: true,
                    },
                  });
                  dispatch(removeFile(rOuter.file.id!));
                  if (rOuter.file.parents?.[0]) {
                    history.push(`/view/${rOuter.file.parents[0]}`);
                  } else {
                    history.push(`/`);
                  }
                } catch (e) {
                  promptError(e);
                }
              },
            });
          },
        });
      }
    }

    return commands;
  }, [rOuter?.file, dispatch, reloadPage, history]);

  if (commandBarItems.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <CommandBar items={commandBarItems} overflowItems={commandBarOverflowItems} />
    </div>
  );
}

export default React.memo(FileAction);
