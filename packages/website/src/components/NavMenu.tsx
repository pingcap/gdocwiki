// Modified from https://github.com/carbon-design-system/gatsby-theme-carbon/blob/ed2df93443b3aa9230e1162e6759c61fab90cca5/packages/gatsby-theme-carbon/src/components/Switcher/Switcher.js

import { Locked16 } from '@carbon/icons-react';
import { Overwrite, ReactAnchorAttr } from 'carbon-components-react/typings/shared';
import React from 'react';
import styles from './NavMenu.module.scss';

export interface INavMenuProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export function NavMenu({ children, ...restProps }: INavMenuProps) {
  return (
    <nav className={styles.nav} {...restProps}>
      <ul>{children}</ul>
    </nav>
  );
}

const Divider = (props: React.HTMLAttributes<HTMLSpanElement>) => (
  <li className={styles.divider}>
    <span {...props} />
  </li>
);

const Text = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={styles.text}>
    <div {...props} />
  </div>
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
NavMenu.Text = Text;
