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
import { DriveIcon, Tag } from '../components';
import { getConfig } from '../config';
import { useRender } from '../context/RenderStack';
import useFileMeta from '../hooks/useFileMeta';
import responsiveStyle from '../layout/responsive.module.scss';
import { selectDocMode, setDocMode } from '../reduxSlices/doc';
import { canChangeSettings, canEdit, extractTags, DocMode, DriveFile, MimeTypes } from '../utils';
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
  const { file } = props;

  useEffect(() => {
    if (file.id === folderPageId) {
      return;
    }
    const fields = 'revisions(id, modifiedTime, lastModifyingUser, exportLinks)'
    async function loadRevisions() {
      try {
        const resp = await gapi.client.drive.revisions.list({ fileId: file.id!, fields })
        setRevisions(resp.result.revisions!.reverse());
      } catch (e) {
        console.error('DocPage files.revisions', file, e);
      }
    }

    loadRevisions();
  }, [file]);

  if (revisions.length === 0) {
    return null;
  }

  return (
    <div className="revisions">
      <hr />
      {revisions.map((revision) => {
        const htmlLink = file.webViewLink + '&versions';
        // const htmlLink = (revision.exportLinks ?? {})['text/html'];
        return (
          <Stack
            key={revision.id}
            verticalAlign="center"
            horizontal
            tokens={{ childrenGap: 16, padding: 2 }}
            className={styles.note}
          >
            <a target="_blank" rel="noreferrer" href={htmlLink}>
              {dayjs(revision.modifiedTime).fromNow()}
            </a>
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
  );
}

function FileAction(props: { file?: DriveFile, allOverflow?: boolean }) {
  const [revisionsEnabled, setRevisionsEnabled] = useState(false);
  const dispatch = useDispatch();
  const docMode = useSelector(selectDocMode);
  const history = useHistory();

  // When viewing a folder and auto-displaying a README,
  // rOuter is the folder and rInner is the README.
  const { inMost: rInner, outMost: rOuter } = useRender();
  const file =
    rInner?.file.name?.toLowerCase() === 'readme'
      ? rOuter?.file ?? rInner?.file
      : rInner?.file ?? props.file;

  const outerFolderId = file?.mimeType === MimeTypes.GoogleFolder ? file?.id : file?.parents?.[0];
  const outerFolder = useFileMeta(outerFolderId);

  useEffect(() => {
    return () => {
      dispatch(setDocMode('view'));
    };
  }, [dispatch]);

  const tags = useMemo(() => {
    if (!file) {
      return [];
    }
    return extractTags(file);
  }, [file]);

  const settingsCommand = useCallback(
    (file: DriveFile, hasTags = false) => {
      const isFolder = file.mimeType === MimeTypes.GoogleFolder;
      return {
        key: 'settings',
        text: !isFolder && !hasTags ? 'Tag' : 'Settings',
        iconProps: { iconName: 'Settings' },
        onClick: () => {
          history.push(`/view/${file.id}/settings`);
        },
      };
    },
    [history]
  );

  const commandBarItems: ICommandBarItemProps[] = useMemo(() => {
    function toggleRevisions() {
      setRevisionsEnabled((v) => !v);
    }
    const commands: ICommandBarItemProps[] = [];

    if (file && file?.mimeType !== MimeTypes.GoogleFolder) {
      if (file.webViewLink) {
        commands.push({
          key: 'launch',
          text: props.allOverflow ? 'Open in Google' : undefined,
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

    if (file && canChangeSettings(file) && tags.length === 0) {
      commands.push(settingsCommand(file, false));
    }

    return commands;
  }, [file, outerFolder.file, tags.length, settingsCommand]);

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
      // Do not allow trash root folder..
      if (file.id !== getConfig().REACT_APP_ROOT_ID && file.capabilities?.canTrash) {
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

    if (file && canChangeSettings(file) && tags.length > 0) {
      commands.push(settingsCommand(file, true));
    }

    return commands;
  }, [file, outerFolder.file, tags.length, settingsCommand]);

  const switchDocMode = useCallback(
    (item) => {
      const mode = item.props['itemKey'];
      if (file) {
        const modePathPiece = mode === 'view' ? '' : mode;
        history.push(`/view/${file.id}/${modePathPiece}`);
      }
    },
    [history, file]
  );

  if (commandBarItems.length === 0 && commandBarOverflowItems.length === 0) {
    console.log('no command bar items, return null');
    return null;
  }

  function tooltip(mode: DocMode, icon: JSX.Element) {
    return () => <TooltipHost content={mode}>{icon}</TooltipHost>;
  }

  if (!file) {
    console.log('no file, return null');
    return null;
  }

  return (
    <div style={{ marginLeft: '1rem' }}>
      <Stack horizontal>
        {file.mimeType === MimeTypes.GoogleDocument && (
          <Stack.Item disableShrink>
            <Pivot onLinkClick={switchDocMode} selectedKey={docMode}>
              <PivotItem
                itemKey="view"
                onRenderItemLink={tooltip('view', <Icon icon={fileEdit} />)}
              />
              <PivotItem itemKey="preview" onRenderItemLink={tooltip('preview', <View16 />)} />
              {canEdit(file) && (
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
            <Tags tags={tags} file={file} />
          </Stack.Item>
        )}
      </Stack>
      {revisionsEnabled && <Revisions file={file} />}
      {docMode === 'view' && <Tags tags={tags} file={file} />}
    </div>
  );
}

function Tags({ file, tags }: { file: DriveFile; tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <Stack horizontal>
      <Stack
        verticalAlign="center"
        horizontal
        tokens={{ childrenGap: 4 }}
        style={{ paddingLeft: 8, paddingTop: 12 }}
      >
        {tags.map((tag) => (
          <Tag.Link key={tag} text={tag} />
        ))}
      </Stack>
      <Stack
        verticalAlign="center"
        horizontal
        tokens={{ childrenGap: 4 }}
        style={{ paddingLeft: 8, paddingTop: 12 }}
      >
        <Link to={`/view/${file.id}/settings`}>Add Tag</Link>
      </Stack>
    </Stack>
  );
}

export default React.memo(FileAction);
