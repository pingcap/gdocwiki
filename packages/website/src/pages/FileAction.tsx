import { View16, Edit16 } from '@carbon/icons-react';
import fileEdit from '@iconify-icons/mdi/file-edit';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import {
  CommandBar,
  ICommandBarItemProps,
  IContextualMenuItem,
  Pivot,
  PivotItem,
  Stack,
  TooltipHost,
} from 'office-ui-fabric-react';
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import Avatar from 'react-avatar';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, Link } from 'react-router-dom';
import { DriveIcon, Tags } from '../components';
import { getConfig } from '../config';
import useFileMeta from '../hooks/useFileMeta';
import responsiveStyle from '../layout/responsive.module.scss';
import { selectDocMode, resetDocMode } from '../reduxSlices/doc';
import { selectDriveId } from '../reduxSlices/files';
import {
  canChangeSettings,
  canEdit,
  inlineEditable,
  DocMode,
  DriveFile,
  MimeTypes,
  docModes,
  isTouchScreen,
} from '../utils';
import { folderPageId } from './ContentPage/FolderPage';
import { showCreateFile } from './FileAction.createFile';
import { showCreateLink } from './FileAction.createLink';
import styles from './FileAction.module.scss';
import { showMoveFile } from './FileAction.moveFile';
import { showRenameFile } from './FileAction.renameFile';
import { showTrashFile } from './FileAction.trashFile';

function Revisions(props: { file: DriveFile }) {
  const revs: Array<gapi.client.drive.Revision> = [];
  const [revisions, setRevisions] = useState(revs);
  const [isLoading, setIsLoading] = useState(true);
  const { file } = props;

  useEffect(() => {
    if (file.id === folderPageId) {
      return;
    }
    const fields = 'revisions(id, modifiedTime, lastModifyingUser, exportLinks)';
    async function loadRevisions() {
      try {
        const resp = await gapi.client.drive.revisions.list({ fileId: file.id!, fields })
        setRevisions(resp.result.revisions!.reverse());
      } catch (e) {
        console.error('DocPage files.revisions', file, e);
      } finally {
        setIsLoading(false);
      }
    }

    loadRevisions();
  }, [file]);

  const link = inlineEditable(file.mimeType ?? '') ? `/view/${file.id}/versions` : null;
  return (
    <div className="revisions">
      {isLoading && <p>Loading Revisions ...</p>}
      {revisions.map((revision) => {
        const timeAgo = dayjs(revision.modifiedTime).fromNow();
        return (
          <Stack
            key={revision.id}
            verticalAlign="center"
            horizontal
            tokens={{ childrenGap: 16, padding: 2 }}
            className={styles.note}
          >
            {link ? <Link to={link}>{timeAgo}</Link> : <span>{timeAgo}</span>}
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
      <hr />
    </div>
  );
}

function FileAction(props: { file: DriveFile, allOverflow?: boolean }) {
  const [revisionsEnabled, setRevisionsEnabled] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();

  let file = props.file;
  const outerFolderId = file.mimeType === MimeTypes.GoogleFolder ? file.id : file.parents?.[0];
  const outerFolder = useFileMeta(outerFolderId);
  const docMode = useSelector(selectDocMode(file.mimeType ?? '')) || 'view';
  const driveId = useSelector(selectDriveId) ?? getConfig().REACT_APP_ROOT_ID;

  useEffect(() => {
    return () => {
      if (!file.mimeType) {
        return;
      }
      dispatch(resetDocMode(file.mimeType));
    };
  }, [dispatch, file]);

  const settingsCommand = useCallback(
    (file: DriveFile) => {
      return {
        key: 'settings',
        text: 'Tag',
        iconProps: { iconName: 'Settings' },
        onClick: () => {
          history.push(`/view/${file.id}/settings`);
        },
      };
    },
    [history]
  );

  const chooseDocMode = useMemo(() => {
    return !isTouchScreen && file.mimeType && docModes(file.mimeType).length > 1;
  }, [file.mimeType]);

  const commandBarItems: ICommandBarItemProps[] = useMemo(() => {
    function toggleRevisions() {
      setRevisionsEnabled((v) => !v);
    }
    const commands: ICommandBarItemProps[] = [];

    if (file.mimeType !== MimeTypes.GoogleFolder) {
      if (file.webViewLink) {
        const showText = props.allOverflow || !chooseDocMode;
        commands.push({
          key: 'launch',
          text: showText ? 'Open in Google' : undefined,
          title: showText ? undefined : 'Open in Google',
          iconProps: { iconName: 'Launch' },
          onClick: () => {
            window.open(file.webViewLink, '_blank');
          },
        });
      }

      // For non-folder, show modify date, and how to open it.
      commands.push({
        key: 'modify_user',
        onClick: () => {
          toggleRevisions();
        },
        text: (
          <Stack
            verticalAlign="center"
            horizontal
            tokens={{ childrenGap: 8 }}
            className={styles.note}
          >
            <Avatar
              name={file.lastModifyingUser?.displayName}
              src={file.lastModifyingUser?.photoLink}
              size="20"
              round
            />
            <span className={responsiveStyle.hideInPhone}>
              {file.lastModifyingUser?.displayName}
              {' edited '}
              {dayjs(file.modifiedTime).fromNow()}
            </span>
            <span className={responsiveStyle.showInPhone}>
              {file.lastModifyingUser?.displayName}
            </span>
          </Stack>
        ) as any,
      });
    } else {
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
  }, [file, outerFolder.file, props.allOverflow]);

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

    if (file && canChangeSettings(file)) {
      commands.push(settingsCommand(file));
    }

    if (file) {
      let fileKind;
      switch (file.mimeType) {
        case MimeTypes.GoogleFolder:
          fileKind = 'Folder';
          break;
        case MimeTypes.GoogleShortcut:
          fileKind = 'Shortcut';
          break;
        default:
          fileKind = 'File';
      }
      if (file.capabilities?.canRename) {
        // Rename
        commands.push({
          key: 'rename',
          text: `Rename ${fileKind}`,
          iconProps: { iconName: 'Edit' },
          onClick: () => {
            showRenameFile(fileKind, file);
          },
        });
      }

      if (file.mimeType !== MimeTypes.GoogleFolder && file.webViewLink) {
        commands.push({
          key: 'launch_preview',
          text: 'Preview in Google',
          iconProps: { iconName: 'DocumentView' },
          onClick: () => {
            const link = file.webViewLink?.replace(/\/(edit|view)\?usp=drivesdk/, '/preview');
            window.open(link, '_blank');
          },
        });
      }

      // Do not allow trash root folder..
      if (file.id !== driveId && file.capabilities?.canTrash) {
        // Trash
        commands.push({
          key: 'trash',
          text: `Trash ${fileKind}`,
          iconProps: { iconName: 'Trash' },
          onClick: () => {
            showTrashFile(fileKind, file);
          },
        });
      }
    }

    return commands;
  }, [file, outerFolder.file, settingsCommand]);

  const switchDocMode = useCallback(
    (item) => {
      const mode = item.props['itemKey'];
      if (file) {
        history.push(`/view/${file.id}/${mode}`);
      }
    },
    [history, file]
  );

  if (!file) {
    console.log('no file, return null');
    return null;
  }

  if (commandBarItems.length === 0 && commandBarOverflowItems.length === 0) {
    console.log('no command bar items, return null');
    return null;
  }

  function tooltip(mode: DocMode, icon: JSX.Element) {
    return () => <TooltipHost content={mode}>{icon}</TooltipHost>;
  }

  const showEditLink = file.mimeType && inlineEditable(file.mimeType) && canEdit(file);

  return (
    <div style={{ marginLeft: '1rem' }}>
      <Stack horizontal>
        {chooseDocMode && (
          <Stack.Item disableShrink>
            <Pivot onLinkClick={switchDocMode} selectedKey={docMode}>
              <PivotItem
                itemKey="view"
                onRenderItemLink={tooltip('view', <Icon icon={fileEdit} />)}
              />
              <PivotItem itemKey="preview" onRenderItemLink={tooltip('preview', <View16 />)} />
              {showEditLink && (
                <PivotItem itemKey="edit" onRenderItemLink={tooltip('edit', <Edit16 />)} />
              )}
            </Pivot>
          </Stack.Item>
        )}
        <Stack.Item disableShrink grow={1} style={{ paddingLeft: '1em' }}>
          {file.mimeType === MimeTypes.GoogleFolder ? (
            <CommandBar items={commandBarItems.concat(commandBarOverflowItems)} />
          ) : props.allOverflow ? (
            <CommandBar
              items={[]}
              overflowItems={commandBarItems.concat(commandBarOverflowItems)}
            />
          ) : (
            <CommandBar items={commandBarItems} overflowItems={commandBarOverflowItems} />
          )}
        </Stack.Item>
        {docMode !== 'view' && (
          <Stack.Item disableShrink grow={1}>
            <Tags file={file} add={true} style={{ paddingLeft: 8, paddingTop: 12 }} />
          </Stack.Item>
        )}
      </Stack>
      {revisionsEnabled && <Revisions file={file} />}
      {docMode === 'view' && (
        <Tags file={file} add={true} style={{ marginTop: '0.5rem', padding: '0.4rem' }} />
      )}
    </div>
  );
}

export default React.memo(FileAction);
