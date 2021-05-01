import React from 'react';

import styles from './Heading.module.scss';

export function H1(props: React.HTMLAttributes<HTMLHeadingElement>) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h1 className={styles.heading} {...props} />;
}

export function H2(props: React.HTMLAttributes<HTMLHeadingElement>) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h2 className={styles.heading} {...props} />;
}

export function H3(props: React.HTMLAttributes<HTMLHeadingElement>) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h3 className={styles.heading} {...props} />;
}

export function H4(props: React.HTMLAttributes<HTMLHeadingElement>) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h4 className={styles.heading} {...props} />;
}

export function H5(props: React.HTMLAttributes<HTMLHeadingElement>) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h5 className={styles.heading} {...props} />;
}
