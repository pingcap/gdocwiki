import TreeView, { TreeNode } from 'carbon-components-react/lib/components/TreeView';
import React, { useMemo } from 'react';
import { IDocTreeItem, useDocTree } from '../context/DocTree';

interface INavItemProps {
  id: string;
  value?: string;
  label?: React.ReactNode;
  children?: INavItemProps[];
  isExpanded?: boolean;
}

function renderTree(nodes?: INavItemProps[], expanded?: boolean) {
  if (!nodes) {
    return;
  }
  return nodes.map(({ children, isExpanded, ...nodeProps }) => (
    <TreeNode key={nodeProps.id} isExpanded={expanded ?? isExpanded} {...nodeProps}>
      {renderTree(children, expanded)}
    </TreeNode>
  ));
}

function mapDocTreeItem(nodes?: IDocTreeItem[]): INavItemProps[] {
  return (nodes ?? [])?.map((node) => {
    const optionalChildren: any = {};
    if (node.children.length > 0) {
      optionalChildren.children = mapDocTreeItem(node.children);
    }
    return {
      id: node.id,
      label: node.name,
      ...optionalChildren,
    } as INavItemProps;
  });
}

export default function Nav() {
  const { loading, data } = useDocTree();
  const treeData = useMemo(() => mapDocTreeItem(data), [data]);
  return (
    <TreeView label="Table of Content" selected={[]}>
      {renderTree(treeData, false)}
    </TreeView>
  );
}
