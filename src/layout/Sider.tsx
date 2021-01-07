import { Launch16 } from '@carbon/icons-react';
import { InlineLoading, SkeletonText } from 'carbon-components-react';
import TreeView, { TreeNode, TreeNodeProps } from 'carbon-components-react/lib/components/TreeView';
import cx from 'classnames';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { getConfig } from '../config';
import {
  selectError,
  selectLoading,
  selectMapIdToChildren,
  selectMapIdToFile,
} from '../reduxSlices/files';
import {
  activate,
  expand,
  collapse,
  selectExpanded,
  selectActive,
} from '../reduxSlices/sider-tree';
import { DriveFile, mdLink, MimeTypes } from '../utils';
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
  const error = useSelector(selectError);
  const mapIdToFile = useSelector(selectMapIdToFile);
  const mapIdToChildren = useSelector(selectMapIdToChildren);

  const active = useSelector(selectActive);
  const expanded = useSelector(selectExpanded);

  const history = useHistory();
  const paramId = useParams<any>().id as string;
  const id = overrideId ?? paramId;

  const handleSelect = useCallback(
    (_ev, payload) => {
      mdLink.handleFileLinkClick(history, payload.value);
    },
    [history]
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

  // active file
  if ((active ?? '') !== id && mapIdToFile[id] !== undefined) {
    dispatch(activate({ id: id, mapIdToFile: mapIdToFile }));
  }

  return (
    <div className={cx(styles.sider, { [styles.isExpanded]: isExpanded })}>
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
        <TreeView label="Table of Content" selected={[id]} onSelect={handleSelect} active={id}>
          {renderChildren(mapIdToChildren, getConfig().REACT_APP_ROOT_ID, expanded, handleToggle)}
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
