import { CollapseAll16, Launch16 } from '@carbon/icons-react';
import { Accordion, AccordionItem, InlineLoading, SkeletonText } from 'carbon-components-react';
import TreeView, { TreeNode, TreeNodeProps } from 'carbon-components-react/lib/components/TreeView';
import cx from 'classnames';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { DriveIcon, FolderChildrenList } from '../components';
import { useFolderFilesMeta } from '../hooks/useFolderFilesMeta';
import { selectHeaders, selectDriveFile, selectDriveLinks } from '../reduxSlices/doc';
import {
  selectDrives,
  setDrive,
  selectDriveId,
  selectRootFolderId,
  selectError,
  selectLoading,
  selectMapIdToChildren,
  selectMapIdToFile,
} from '../reduxSlices/files';
import {
  expand,
  collapse,
  selectActiveId,
  selectExpanded,
  selectSelected,
  selectShowFiles,
  setShowFiles,
  unsetShowFiles,
} from '../reduxSlices/siderTree';
import {
  DriveFile,
  fileIsFolderOrFolderShortcut,
  MarkdownLink,
  mdLink,
  MimeTypes,
  parseFolderChildrenDisplaySettings,
} from '../utils';
import { DocHeader, TreeHeading, isTreeHeading } from '../utils/docHeaders';
import styles from './Sider.module.scss';
import { HeaderExtraActionsForMobile } from '.';

function isLeafFolder(file: DriveFile, mapIdToChildren: Record<string, DriveFile[]>): boolean {
  return (
    !!file.id &&
    (mapIdToChildren[file.id] ?? []).filter((file) => {
      return file.mimeType === MimeTypes.GoogleFolder;
    }).length === 0
  );
}

function entryNode(heading: DocHeader): JSX.Element {
  const label = <a href={'#' + heading.id}>{heading.text}</a>;
  return <TreeNode key={heading.id} id={'tree-' + heading.id} label={label} />;
}

function treeNode(heading: DocHeader, inner: JSX.Element[]) {
  const label = <a href={'#' + heading.id}>{heading.text}</a>;
  return (
    <TreeNode key={heading.id} id={'tree-' + heading.id} isExpanded={true} label={label}>
      {inner}
    </TreeNode>
  );
}

function toTreeElements(node: TreeHeading | DocHeader): JSX.Element {
  return isTreeHeading(node) ? treeNode(node, node.entries.map(toTreeElements)) : entryNode(node);
}

function renderChildren(
  activeId: string,
  mapIdToFile: Record<string, DriveFile>,
  mapIdToChildren: Record<string, DriveFile[]>,
  onFolderShowFiles: (file: DriveFile) => void,
  showFiles: Record<string, boolean>,
  parentId?: string,
  expanded?: ReadonlySet<string>,
  handleToggle?: (
    event: any,
    node: {
      id: string;
      isExpanded: boolean;
    }
  ) => void
) {
  if (!parentId) {
    return null;
  }

  let files = mapIdToChildren[parentId];
  if (!mapIdToChildren[parentId]) {
    return null;
  }
  if (mapIdToFile[parentId]) {
    const childrenDisplaySettings = parseFolderChildrenDisplaySettings(mapIdToFile[parentId]);
    if (!childrenDisplaySettings.displayInSidebar) {
      files = [];
    }
  }

  const filesFolder: DriveFile[] = files.filter((file) => {
    return file.mimeType === MimeTypes.GoogleFolder;
  });
  let filesNotFolder: DriveFile[] = [];
  if (showFiles[parentId]) {
    filesNotFolder = files.filter((file) => {
      return file.mimeType !== MimeTypes.GoogleFolder;
    });
  }

  const folderViews = filesFolder.map((file: DriveFile) => {
    const childrenNode = renderChildren(
      activeId,
      mapIdToFile,
      mapIdToChildren,
      onFolderShowFiles,
      showFiles,
      file.id,
      expanded,
      handleToggle
    );

    const isExpanded = expanded?.has(file.id ?? '');
    const leafFolder = isLeafFolder(file, mapIdToChildren);
    let label: React.ReactNode = nodeLabel({
      file,
      mapIdToChildren,
      isActive: file.id === activeId,
      isExpanded,
      isLeafFolder: leafFolder,
      filesShown: file.id ? showFiles[file.id] : false,
      onFolderShowFiles,
    });

    const onSelect = () => {
      if (file.id === activeId) {
        onFolderShowFiles(file);
      } else {
        selectFile(file)();
      }
    };
    if ((childrenNode?.length ?? 0) > 0) {
      const nodeProps: TreeNodeProps = {
        isExpanded: isExpanded,
        onToggle: handleToggle,
        label,
        value: file.id!,
        onSelect: onSelect,
      };
      return (
        <TreeNode key={file.id} id={file.id} {...nodeProps}>
          {childrenNode}
        </TreeNode>
      );
    } else {
      const nodeProps: TreeNodeProps = {
        isExpanded: false,
        label,
        value: file.id!,
        onSelect: onSelect,
      };
      return <TreeNode key={file.id} id={file.id} {...nodeProps} />;
    }
  });

  const fileViews = filesNotFolder.map((file: DriveFile) => {
    let label: React.ReactNode = nodeLabel({ file, mapIdToChildren });
    const nodeProps: TreeNodeProps = {
      isExpanded: false,
      label,
      value: file.id!,
      onSelect: selectFile(file),
    };
    return <TreeNode key={file.id} id={file.id} {...nodeProps} />;
  });

  return folderViews.concat(fileViews);
}

function nodeLabel(props: {
  file: DriveFile;
  mapIdToChildren: Record<string, DriveFile[]>;
  isLeafFolder?: boolean;
  isExpanded?: boolean;
  isActive?: boolean;
  filesShown?: boolean;
  onFolderShowFiles?: (file: DriveFile) => void;
}): React.ReactNode {
  const { file } = props;
  let isChildrenHidden = false;
  const childrenDisplaySettings = parseFolderChildrenDisplaySettings(file);
  if (!childrenDisplaySettings.displayInSidebar && file.mimeType === MimeTypes.GoogleFolder) {
    isChildrenHidden = true;
  }

  let itemType: 'hidden_folder' | 'folder' | 'link' | 'file';
  let parsedLink: MarkdownLink | null = null;
  if (fileIsFolderOrFolderShortcut(file)) {
    if (isChildrenHidden) {
      itemType = 'hidden_folder';
    } else {
      itemType = 'folder';
    }
  } else {
    parsedLink = mdLink.parse(file.name);
    if (parsedLink) {
      itemType = 'link';
    } else {
      itemType = 'file';
    }
  }

  let label: JSX.Element | null = null;
  switch (itemType) {
    case 'folder':
      label = (
        <a
          href={`/view/${file.id}`}
          style={{ textDecoration: 'none', color: 'black' }}
          onClick={(ev) => {
            ev.preventDefault();
          }}
        >
          {file.name}
        </a>
      );
      if ((props.isExpanded || props.isLeafFolder) && props.onFolderShowFiles) {
        label = <ExpandedFolder {...props} label={label} />;
      }
      break;
    case 'hidden_folder':
      label = (
        <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
          <CollapseAll16 />
          <span>{file.name}</span>
        </Stack>
      );
      break;
    case 'link':
      label = (
        <Stack
          verticalAlign="center"
          horizontal
          tokens={{ childrenGap: 8 }}
          style={{ cursor: 'pointer' }}
        >
          <Launch16 />
          <span>{parsedLink!.title}</span>
        </Stack>
      );
      break;
    case 'file':
      label = (
        <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
          <DriveIcon file={file} />
          <span>{file.name}</span>
        </Stack>
      );
      break;
  }

  return label;
}

function ExpandedFolder(props: {
  label: JSX.Element;
  file: DriveFile;
  mapIdToChildren: Record<string, DriveFile[]>;
  isLeafFolder?: boolean;
  isExpanded?: boolean;
  isActive?: boolean;
  filesShown?: boolean;
  onFolderShowFiles?: (file: DriveFile) => void;
}) {
  const { file, mapIdToChildren } = props;
  const filesMeta = useFolderFilesMeta(file.id!);
  const files = useMemo(() => mapIdToChildren[file.id!] ?? filesMeta.files ?? [], [
    mapIdToChildren,
    filesMeta.files,
    file.id,
  ]);
  const nonFolderCount = useMemo(() => {
    return files.filter((file) => file.mimeType !== MimeTypes.GoogleFolder).length;
  }, [files]);
  const noFilesEver = !filesMeta.loading && nonFolderCount === 0;

  if (noFilesEver) {
    const style = {};
    if (files?.length === 0) {
      style['textIndent'] = '-.2em';
      style['listStylePosition'] = 'inside';
      style['listStyleType'] = 'disc';
    }
    return (
      <ul>
        <li style={style}>{props.label}</li>
      </ul>
    );
  }

  const style = {};
  if (props.isLeafFolder) {
    if ((props.isExpanded && props.isActive && filesMeta.loading) || props.filesShown) {
      style['textIndent'] = '-1.1em';
    } else {
      style['paddingLeft'] = '0.1em';
    }
  } else if (props.isExpanded) {
    style['textIndent'] = '-1.1em';
  }

  return (
    <div style={style}>
      <a
        style={{ cursor: 'pointer' }}
        onClick={(ev) => {
          ev.stopPropagation();
          props.onFolderShowFiles?.(file);
        }}
      >
        ...
      </a>
      &nbsp;
      {props.label}
    </div>
  );
}

function selectFile(file: gapi.client.drive.File) {
  return () => {
    mdLink.handleFileLinkClick(file);
  };
}

function Sider_({ isExpanded = true }: { isExpanded?: boolean }) {
  const dispatch = useDispatch();
  const history = useHistory();

  const error = useSelector(selectError);
  const mapIdToFile = useSelector(selectMapIdToFile);
  const mapIdToChildren = useSelector(selectMapIdToChildren);
  const expanded = useSelector(selectExpanded);
  const selected = useSelector(selectSelected);
  const headers = useSelector(selectHeaders);
  const driveLinks = useSelector(selectDriveLinks);
  const file = useSelector(selectDriveFile);
  const showFiles = useSelector(selectShowFiles);

  const drives = useSelector(selectDrives);
  const rootFolderId = useSelector(selectRootFolderId);
  const driveId = useSelector(selectDriveId);
  const rootId = rootFolderId || driveId;
  const activeId = useSelector(selectActiveId);
  const id = activeId ?? rootFolderId ?? rootId;
  const loading = useSelector(selectLoading);

  const handleToggle = useCallback(
    (ev: React.MouseEvent, node: TreeNodeProps) => {
      // handleToggle is called before onSelect
      // This will stop the event from getting to onSelect
      ev.stopPropagation();
      if (!node.id) {
        return;
      }
      if (node.isExpanded) {
        dispatch(expand({ arg: [node.id], mapIdToFile }));
      } else {
        dispatch(collapse([node.id]));
        dispatch(unsetShowFiles(node.id));
      }
    },
    [dispatch, mapIdToFile]
  );

  const headerTreeNodes = (headers ?? []).slice().map(toTreeElements);

  function onFolderShowFiles(file: DriveFile) {
    if (!file.id) {
      return;
    }
    if (showFiles[file.id]) {
      dispatch(unsetShowFiles(file.id));
      if (isLeafFolder(mapIdToFile[file.id], mapIdToChildren)) {
        dispatch(collapse([file.id]));
      }
    } else {
      dispatch(setShowFiles(file.id));
      if (isLeafFolder(mapIdToFile[file.id], mapIdToChildren)) {
        dispatch(expand({ arg: [file.id], mapIdToFile }));
      }
    }
  }

  return (
    <div className={cx(styles.sider, { [styles.isExpanded]: isExpanded })}>
      <HeaderExtraActionsForMobile />
      {!loading && error && (
        <div className={styles.skeleton}>
          <InlineLoading description={`Error: ${error.message}`} status="error" />
        </div>
      )}
      <Accordion>
        {file?.id === activeId && (
          <>
            {driveLinks.length > 0 && (
              <AccordionItem key="links" title="Links">
                <div style={{ padding: '1rem' }}>
                  <FolderChildrenList
                    files={driveLinks.map((dl) => dl.file).filter((f) => f) as DriveFile[]}
                  />
                </div>
              </AccordionItem>
            )}
            {headerTreeNodes.length > 0 && (
              <AccordionItem key="outline" title="Outline">
                <TreeView
                  label="Document Outline"
                  hideLabel={true}
                  selected={[headerTreeNodes[0].key?.toString() ?? 0]}
                  id="tree-document-headers"
                >
                  <Stack
                    style={{ padding: '0.5rem', display: 'flex', justifyContent: 'center' }}
                    verticalAlign="center"
                    horizontal
                  >
                    <p>{file?.name}</p>
                  </Stack>
                  {headerTreeNodes}
                </TreeView>
              </AccordionItem>
            )}
          </>
        )}
        {/* > 1 because of My Drive */}
        {drives.length > 1 && (
          <AccordionItem key="drives" title="Shared Drives">
            <TreeView
              label="Shared Drives"
              hideLabel={true}
              selected={selected}
              active={driveId}
              id={'tree-drives'}
            >
              {drives.map((drive) => (
                <TreeNode
                  key={drive.id}
                  id={drive.id}
                  isExpanded={false}
                  label={drive.name}
                  onSelect={() => {
                    dispatch(setDrive(drive));
                    history.push(`/view/${drive.id}`);
                  }}
                />
              ))}
            </TreeView>
          </AccordionItem>
        )}
        {loading && <InlineLoading description="Loading Drive..." />}
        {!loading && !error && id && rootId && (
          <AccordionItem
            key="folders"
            open={true}
            title={'All Folders in ' + (mapIdToFile[rootId]?.name || '')}
          >
            <TreeView
              label="All Folders"
              hideLabel={true}
              selected={selected}
              active={id}
              id={'tree-folders'}
            >
              {renderChildren(
                id,
                mapIdToFile,
                mapIdToChildren,
                onFolderShowFiles,
                showFiles,
                rootId,
                expanded,
                handleToggle
              )}
            </TreeView>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

export const Sider = React.memo(Sider_);

function Content_({
  isExpanded = true,
  children,
}: {
  isExpanded?: boolean;
  children?: React.ReactNode;
}) {
  return <div className={cx(styles.content, { [styles.isExpanded]: isExpanded })}>{children}</div>;
}

export const Content = React.memo(Content_);
