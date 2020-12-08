// Modified from https://github.com/carbon-design-system/gatsby-theme-carbon/blob/ed2df93443b3aa9230e1162e6759c61fab90cca5/packages/gatsby-theme-carbon/src/components/Switcher/Switcher.js

import { Locked16 } from '@carbon/icons-react';
import { Overwrite, ReactAnchorAttr } from 'carbon-components-react/typings/shared';
import cx from 'classnames';
import React, { useLayoutEffect, useRef, useState } from 'react';
import styles from './NavMenu.module.scss';

export interface INavMenuProps {
  children?: React.ReactNode;
  open?: boolean;
}

export default function NavMenu({ open, children }: INavMenuProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!listRef.current) {
      return;
    }
    if (open) {
      setHeight(listRef.current.offsetHeight + 40);
    } else {
      setHeight(0);
    }
  }, [listRef, open]);

  return (
    <nav className={cx(styles.nav, { [styles.open]: open })} style={{ height }}>
      <ul ref={listRef}>{children}</ul>
    </nav>
  );
}

const Divider = (props: React.HTMLAttributes<HTMLSpanElement>) => (
  <li className={styles.divider}>
    <span {...props} />
  </li>
);

export interface ILinkPropsBase<P = ReactAnchorAttr> {
  disabled?: boolean;
  isInternal?: boolean;
  element?: string | React.JSXElementConstructor<P>;
}

export type ILinkProps<P extends object = ReactAnchorAttr, IP = P> = Overwrite<
  P,
  ILinkPropsBase<IP>
>;

const Link = ({ disabled, children, isInternal, element = 'a', ...rest }: ILinkProps) => {
  const className = disabled ? styles.linkDisabled : styles.link;
  const Element = element as any; // FIXME

  return (
    <li>
      <Element aria-disabled={disabled} role="button" tabIndex={-1} className={className} {...rest}>
        {children}
        {isInternal && <Locked16 />}
      </Element>
    </li>
  );
};

NavMenu.Divider = Divider;
NavMenu.Link = Link;
