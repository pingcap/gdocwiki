import { Launch16 } from '@carbon/icons-react';
import { SkeletonText } from 'carbon-components-react';
import TreeView, { TreeNode, TreeNodeProps } from 'carbon-components-react/lib/components/TreeView';
import cx from 'classnames';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import config from '../config';
import { DriveFile, selectLoading, selectMapIdToChildren } from '../reduxSlices/files';
import { select, selectExpanded, selectSelected } from '../reduxSlices/sider-tree';
import { mdLink, MimeTypes } from '../utils';
import styles from './Sider.module.scss';

function dummy() {}

function renderChildren(
  mapIdToChildren: Record<string, DriveFile[]>,
  parentId?: string,
  expanded?: ReadonlySet<string>,
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

    const childrenNode = renderChildren(mapIdToChildren, file.id, expanded);

    const nodeProps: TreeNodeProps = {
      isExpanded: expanded?.has(file.id ?? ''),
      onToggle: dummy,
      label,
      value: file as any,
    };
    if (file.mimeType === MimeTypes.GoogleFolder || (childrenNode?.length ?? 0) > 0) {
      // Display a triangle icon at all the time for empty folders.
      return (
        <TreeNode key={file.id} {...nodeProps}>
          {childrenNode}
        </TreeNode>
      );
    } else {
      return <TreeNode key={file.id} {...nodeProps} />;
    }
  });
}

function Sider({
  isExpanded = true,
  overrideId
}: {
  isExpanded?: boolean;
  overrideId?: string;
}) {
  const dispatch = useDispatch()

  const loading = useSelector(selectLoading);
  const mapIdToChildren = useSelector(selectMapIdToChildren);

  const selected = useSelector(selectSelected);
  const expanded = useSelector(selectExpanded);

  const history = useHistory();

  const handleSelect = useCallback(
    (_ev, payload) => {
      dispatch(select([payload.key]));
      mdLink.handleFileLinkClick(history, payload.value);
    },
    [history, dispatch]
  );

  return (
    <div className={cx(styles.sider, { [styles.isExpanded]: isExpanded })}>
      {loading && (
        <div className={styles.skeleton}>
          <SkeletonText paragraph />
        </div>
      )}
      {!loading && (
        <TreeView label="Table of Content" selected={selected} onSelect={handleSelect}>
          {renderChildren(mapIdToChildren, config.rootId, expanded)}
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
