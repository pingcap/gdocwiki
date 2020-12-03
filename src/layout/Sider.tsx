import { Launch16 } from '@carbon/icons-react';
import { SkeletonText } from 'carbon-components-react';
import TreeView, { TreeNode, TreeNodeProps } from 'carbon-components-react/lib/components/TreeView';
import cx from 'classnames';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import config from '../config';
import { DriveFile, selectLoading, selectMapIdToChildren } from '../reduxSlices/files';
import {
  select,
  expand,
  collapse,
  selectExpanded,
  selectSelected,
} from '../reduxSlices/sider-tree';
import { mdLink, MimeTypes } from '../utils';
import styles from './Sider.module.scss';

function renderChildren(
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
  const files = mapIdToChildren[parentId];
  if (!mapIdToChildren[parentId]) {
    return null;
  }
  return files.map((file) => {
    // Try to parse as a Markdown link
    let label: React.ReactNode = file.name;
    const link = mdLink.parse(file.name);
    if (link) {
      label = (
        <Stack
          verticalAlign="center"
          horizontal
          tokens={{ childrenGap: 8 }}
          style={{ cursor: 'pointer' }}
        >
          <span>{link.title}</span>
          <Launch16 />
        </Stack>
      );
    }

    const childrenNode = renderChildren(mapIdToChildren, file.id, expanded, handleToggle);

    const nodeProps: TreeNodeProps = {
      isExpanded: expanded?.has(file.id ?? ''),
      onToggle: handleToggle,
      label,
      value: file as any,
    };
    if (file.mimeType === MimeTypes.GoogleFolder || (childrenNode?.length ?? 0) > 0) {
      // Display a triangle icon at all the time for empty folders.
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

function Sider({ isExpanded = true, overrideId }: { isExpanded?: boolean; overrideId?: string }) {
  const dispatch = useDispatch();

  const loading = useSelector(selectLoading);
  const mapIdToChildren = useSelector(selectMapIdToChildren);

  const selected = useSelector(selectSelected);
  const expanded = useSelector(selectExpanded);

  const history = useHistory();
  const paramId = useParams<any>().id as string;

  const handleSelect = useCallback(
    (_ev, payload) => {
      dispatch(select([payload.key]));
      mdLink.handleFileLinkClick(history, payload.value);
    },
    [history, dispatch]
  );

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

  return (
    <div className={cx(styles.sider, { [styles.isExpanded]: isExpanded })}>
      {loading && (
        <div className={styles.skeleton}>
          <SkeletonText paragraph />
        </div>
      )}
      {!loading && (
        <TreeView
          label="Table of Content"
          selected={selected}
          onSelect={handleSelect}
          active={overrideId ?? paramId}
        >
          {renderChildren(mapIdToChildren, config.rootId, expanded, handleToggle)}
        </TreeView>
      )}
    </div>
  );
}

export default React.memo(Sider);

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
