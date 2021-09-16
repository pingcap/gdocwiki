import { ChevronDown20 } from '@carbon/icons-react';
import { HeaderMenuItem, HeaderNavigation } from 'carbon-components-react';
import TreeView, { TreeNode } from 'carbon-components-react/lib/components/TreeView';
import cx from 'classnames';
import { Stack } from 'office-ui-fabric-react';
import Trigger from 'rc-trigger';
import React, { useMemo } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { ExtensionHeaderItem, NavMenu } from '../components';
import { getConfig, INavMenuGroupChildren } from '../config';
import styles from './HeaderExtraActions.module.scss';
import responsiveStyle from './responsive.module.scss';

export interface IHeaderExtraActionsProps {
  onExtensionAction?: () => void;
}

export function HeaderExtraActions({ onExtensionAction }) {
  return (
    <HeaderNavigation className={responsiveStyle.hideInPhone} aria-label="navigation" >
      <HeaderMenuItem<LinkProps> element={Link} to="/search/tag">
        Tags
      </HeaderMenuItem>
      {getConfig().NavItems.map((item) => {
        switch (item.type) {
          case 'link':
            return (
              <HeaderMenuItem href={item.href} target={item.target}>
                {item.text ?? ''}
              </HeaderMenuItem>
            );
          case 'group':
            return (
              <Trigger
                popupAlign={{
                  points: ['tl', 'bl'],
                }}
                mouseLeaveDelay={0.3}
                zIndex={10000}
                action="hover"
                popup={
                  <NavMenu>
                    {item.children?.map((childItem) => {
                      switch (childItem.type) {
                        case 'divider':
                          return <NavMenu.Divider>{childItem.text ?? ''}</NavMenu.Divider>;
                        case 'link':
                          return (
                            <NavMenu.Link
                              key={childItem.href}
                              href={childItem.href}
                              target={childItem.target}
                            >
                              {childItem.text ?? ''}
                            </NavMenu.Link>
                          );
                        default:
                          return null;
                      }
                    })}
                  </NavMenu>
                }
                popupTransitionName="slide-up"
              >
                <HeaderMenuItem onClick={(ev) => ev.preventDefault()} href="#">
                  <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
                    <span>{item.text ?? ''}</span>
                    <ChevronDown20 />
                  </Stack>
                </HeaderMenuItem>
              </Trigger>
            );
          default:
            return null;
        }
      })}
      <ExtensionHeaderItem onClick={onExtensionAction} />
    </HeaderNavigation>
  );
}

interface StruturalTreeNode {
  key?: string;
  href?: string;
  target?: string;
  text?: string;
  children?: Array<StruturalTreeNode>;
}

function renderTreeNode(nodes: Array<StruturalTreeNode>) {
  if (!nodes || nodes.length === 0) {
    return;
  }
  return nodes.map((node) => (
    <TreeNode
      key={node.key}
      value={node.key}
      label={node.text}
      onClick={() => {
        if (node.href) {
          window.location.href = node.href;
        }
      }}
    >
      {renderTreeNode(node.children ?? [])}
    </TreeNode>
  ));
}

function HeaderExtraActionsForMobile_() {
  const treeItems = useMemo(() => {
    const items: Array<StruturalTreeNode> = [];
    getConfig().NavItems.forEach((item) => {
      switch (item.type) {
        case 'link':
          items.push({ key: item.text, text: item.text, href: item.href, target: item.target });
          break;
        case 'group': {
          const subItems: Record<string, Array<StruturalTreeNode>> = {};
          let currentGroup: INavMenuGroupChildren | null = null;
          item.children?.forEach((subItem) => {
            switch (subItem.type) {
              case 'divider':
                currentGroup = subItem;
                subItems[currentGroup.text || ''] = [];
                break;
              case 'link':
                if (currentGroup) {
                  subItems[currentGroup.text || ''].push({
                    key: subItem.text,
                    text: subItem.text,
                    href: subItem.href,
                    target: subItem.target,
                  });
                }
                break;
            }
          });
          const subItemsArray: Array<StruturalTreeNode> = Object.keys(subItems).map((groupName) => {
            return { key: groupName, text: groupName, children: subItems[groupName] };
          });
          items.push({ key: item.text, text: item.text, children: subItemsArray });
        }
      }
    });
    return items;
  }, []);

  return treeItems.length === 0 ? null : (
    <div className={cx(styles.actionTree, responsiveStyle.showInPhone)}>
      <TreeView label="Navigation" selected={[]}>
        {renderTreeNode(treeItems)}
      </TreeView>
    </div>
  );
}

export const HeaderExtraActionsForMobile = React.memo(HeaderExtraActionsForMobile_);
