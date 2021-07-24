import cx from 'classnames';
import dayjs from 'dayjs';
import {
  CommandBar,
  ICommandBarItemProps,
  IContextualMenuItem,
  Stack,
} from 'office-ui-fabric-react';
import React, { useMemo, useEffect, useState } from 'react';
import Avatar from 'react-avatar';
import { useHistory } from 'react-router-dom';
import { DriveIcon } from '../components';
import { getConfig } from '../config';
import { useRender } from '../context/RenderStack';
import useFileMeta from '../hooks/useFileMeta';
import { MimeTypes, shouldShowFolderChildrenSettings, shouldShowTagSettings } from '../utils';
import { showCreateFile } from './FileAction.createFile';
import { showCreateLink } from './FileAction.createLink';
import styles from './FileAction.module.scss';
import { showMoveFile } from './FileAction.moveFile';
import { showRenameFile } from './FileAction.renameFile';
import { showTrashFile } from './FileAction.trashFile';
import responsiveStyle from '../layout/responsive.module.scss';
import { folderPageId } from './ContentPage/FolderPage';

function FileAction() {
  // Support we have a folder, containing a shortcut to a README document,
  // the rInner is README and the rOuter is the folder.
  const { inMost: rInner, outMost: rOuter } = useRender();
  const [revisionsEnabled, setRevisionsEnabled] = useState("");
  function toggleRevisions() {
    setRevisionsEnabled(v => v === rInner?.file.id! ? "" : rInner?.file.id!);
  }
  const revs: Array<gapi.client.drive.Revision> = []
  const [revisions, setRevisions] = useState(revs);

  const history = useHistory();

  const outerFolderId =
    rOuter?.file.mimeType === MimeTypes.GoogleFolder ? rOuter?.file.id : rOuter?.file.parents?.[0];
  const outerFolder = useFileMeta(outerFolderId);

  const commandBarItems: ICommandBarItemProps[] = useMemo(() => {
    const commands: ICommandBarItemProps[] = [];

    if (rInner?.file && rInner.file.mimeType !== MimeTypes.GoogleFolder) {
      // For non-folder, show modify date, and how to open it.
      commands.push({
        key: 'modify_user',
        onClick: () => { toggleRevisions(); },
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
            <span className={responsiveStyle.hideInPhone}>
              {rInner.file.lastModifyingUser?.displayName}
              {' edited '}
              {dayjs(rInner.file.modifiedTime).fromNow()}
            </span>
            <span className={responsiveStyle.showInPhone}>
              {rInner.file.lastModifyingUser?.displayName}
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
    }
    return commands;
  }, [rInner?.file, outerFolder.file]);

  const commandBarOverflowItems = useMemo(() => {
    const commands: ICommandBarItemProps[] = [];
    if (outerFolder.file?.id && outerFolder.file?.capabilities?.canAddChildren) {
      // Add file command
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
            showCreateFile(text, mimeType, outerFolder.file!.id!);
          },
        });
      });

      commands.push({
        key: 'create_file_in_folder',
        text: 'Create',
        iconProps: { iconName: 'Add' },
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
                showCreateLink(outerFolder.file!.id!);
              },
            },
            {
              key: 'move',
              text: 'Import by Move',
              iconProps: {
                iconName: 'StackedMove',
              },
              onClick: () => {
                showMoveFile(outerFolder.file!);
              },
            },
          ],
        },
      });
    }
    if (rOuter?.file) {
      let fileKind;
      switch (rOuter.file.mimeType) {
        case MimeTypes.GoogleFolder:
          fileKind = 'Folder';
          break;
        case MimeTypes.GoogleShortcut:
          fileKind = 'Shortcut';
          break;
        default:
          fileKind = 'File';
      }
      if (rOuter.file.capabilities?.canRename) {
        // Rename
        commands.push({
          key: 'rename',
          text: `Rename ${fileKind}`,
          iconProps: { iconName: 'Edit' },
          onClick: () => {
            showRenameFile(fileKind, rOuter.file);
          },
        });
      }
      // Do not allow trash root folder..
      if (rOuter?.file.id !== getConfig().REACT_APP_ROOT_ID && rOuter.file.capabilities?.canTrash) {
        // Trash
        commands.push({
          key: 'trash',
          text: `Trash ${fileKind}`,
          iconProps: { iconName: 'Trash' },
          onClick: () => {
            showTrashFile(fileKind, rOuter.file);
          },
        });
      }
      if (shouldShowTagSettings(rOuter.file) || shouldShowFolderChildrenSettings(rInner?.file)) {
        commands.push({
          key: 'settings',
          text: `Settings`,
          iconProps: { iconName: 'Settings' },
          onClick: () => {
            history.push(`/view/${rOuter.file.id}/settings`);
          },
        });
      }
    }

    return commands;
  }, [rInner?.file, rOuter?.file, outerFolder.file, history]);

  useEffect(() => {
    if (rInner?.id === folderPageId) { return }
    const fields = "revisions(id, modifiedTime, lastModifyingUser, exportLinks)"
    async function loadRevisions() {
      try {
        const resp = await gapi.client.drive.revisions.list({fileId: rInner?.file.id!, fields})
        setRevisions(resp.result.revisions!.reverse());
      } catch(e) {
        console.error('DocPage files.revisions', rInner, e);
      }
    }

    if (revisionsEnabled) {
      loadRevisions();
    }
  }, [rInner?.file, revisionsEnabled]);

  if (commandBarItems.length === 0 && commandBarOverflowItems.length === 0) {
    return null;
  }
  const showRevisions = revisionsEnabled && (revisionsEnabled === rInner?.file.id) && (revisions.length > 0);

  return (
    <div>
      <CommandBar items={commandBarItems} overflowItems={commandBarOverflowItems} />
      {showRevisions && (
        <div className="revisions">
          <hr />
          {revisions.map((revision) => {
            const htmlLink = (revision.exportLinks ?? {})['text/html'];
            return (
              <Stack
                key={revision.id}
                verticalAlign="center"
                horizontal
                tokens={{ childrenGap: 16, padding: 2 }}
                className={styles.note}
              >
                <a href={htmlLink}>{dayjs(revision.modifiedTime).fromNow()}</a>
                <div>
                  <Avatar
                    name={revision.lastModifyingUser?.displayName}
                    src={revision.lastModifyingUser?.photoLink}
                    size="20"
                    round
                  />
                  <span>
                    &nbsp;
                    {revision.lastModifyingUser?.displayName}
                  </span>
                </div>
              </Stack>
            )
          })}
        </div>
      )}
    </div>
  );
}

export default React.memo(FileAction);
