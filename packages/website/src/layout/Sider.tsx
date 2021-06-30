import { CollapseAll16, Launch16 } from '@carbon/icons-react';
import { InlineLoading, SkeletonText } from 'carbon-components-react';
import TreeView, { TreeNode, TreeNodeProps } from 'carbon-components-react/lib/components/TreeView';
import cx from 'classnames';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DriveIcon } from '../components';
import { getConfig } from '../config';
import {
  selectError,
  selectLoading,
  selectMapIdToChildren,
  selectMapIdToFile,
} from '../reduxSlices/files';
import { selectHeaders } from '../reduxSlices/headers';
import {
  activate,
  expand,
  collapse,
  selectActiveId,
  selectExpanded,
  selectSelected,
} from '../reduxSlices/siderTree';
import {
  DriveFile,
  fileIsFolderOrFolderShortcut,
  MarkdownLink,
  mdLink,
  MimeTypes,
  parseFolderChildrenDisplaySettings,
} from '../utils';
import { DocHeader, TreeHeading, isTreeHeading, MakeTree } from '../utils/docHeaders';
import styles from './Sider.module.scss';
import { HeaderExtraActionsForMobile } from '.';

function renderChildren(
  activeId: string,
  mapIdToFile: Record<string, DriveFile>,
  mapIdToChildren: Record<string, DriveFile[]>,
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

  if (parentId === activeId || mapIdToFile?.[activeId]?.parents?.[0] === parentId) {
    // When selecting something, we display all of its children at last.
  } else {
    // When current item is not selected, we only display children item which is a folder.
    files = files.filter((file) => {
      return file.mimeType === MimeTypes.GoogleFolder;
    });
  }

  return files.map((file) => {
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

    let label: React.ReactNode = file.name;
    switch (itemType) {
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

    const childrenNode = renderChildren(
      activeId,
      mapIdToFile,
      mapIdToChildren,
      file.id,
      expanded,
      handleToggle
    );

    const nodeProps: TreeNodeProps = {
      isExpanded: expanded?.has(file.id ?? ''),
      onToggle: handleToggle,
      label,
      value: file as any,
    };
    if ((childrenNode?.length ?? 0) > 0) {
      return (
        <TreeNode key={file.id} id={file.id} {...nodeProps}>
          {childrenNode}
        </TreeNode>
      );
    } else {
      return <TreeNode key={file.id} id={file.id} {...nodeProps} />;
    }
  });
}

function Sider_({ isExpanded = true }: { isExpanded?: boolean }) {
  const dispatch = useDispatch();

  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const mapIdToFile = useSelector(selectMapIdToFile);
  const mapIdToChildren = useSelector(selectMapIdToChildren);
  const expanded = useSelector(selectExpanded);
  const selected = useSelector(selectSelected);
  const headers = useSelector(selectHeaders);

  const id = useSelector(selectActiveId) ?? getConfig().REACT_APP_ROOT_ID;

  const handleSelect = useCallback((_ev, payload) => {
    mdLink.handleFileLinkClick(payload.value);
  }, []);

  const handleToggle = useCallback(
    (_, node: TreeNodeProps) => {
      if (node.isExpanded) {
        dispatch(expand([node.id ?? '']));
      } else {
        dispatch(collapse([node.id ?? '']));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (mapIdToFile[id]) {
      dispatch(activate({ id: id, mapIdToFile: mapIdToFile }));
    }
  }, [id, mapIdToFile, dispatch]);

  function entryNode(heading: DocHeader): JSX.Element {
    const label = <a href={'#' + heading.id}>{heading.text}</a>;
    return <TreeNode key={heading.id} id={'tree-' + heading.id} label={label} />;
  }

  function treeNode(heading: DocHeader, inner) {
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
  const headerTreeNodes = MakeTree(headers.slice()).map(toTreeElements);

  return (
    <div className={cx(styles.sider, { [styles.isExpanded]: isExpanded })}>
      <HeaderExtraActionsForMobile />
      {loading && (
        <div className={styles.skeleton}>
          <SkeletonText paragraph />
        </div>
      )}
      {!loading && error && (
        <div className={styles.skeleton}>
          <InlineLoading description={`Error: ${error.message}`} status="error" />
        </div>
      )}
      {!loading && !error && (
        <TreeView label="Table of Content" selected={selected} onSelect={handleSelect} active={id}>
          {renderChildren(
            id,
            mapIdToFile,
            mapIdToChildren,
            getConfig().REACT_APP_ROOT_ID,
            expanded,
            handleToggle
          )}
        </TreeView>
      )}
      {headerTreeNodes.length > 0 && (
        <div>
          <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
            &nbsp;
          </Stack>
          <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
            &nbsp;Outline
          </Stack>
          <TreeView label="Document Headers" selected={[headerTreeNodes[0].key?.toString() ?? 0]}>
            {headerTreeNodes}
          </TreeView>
        </div>
      )}
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
