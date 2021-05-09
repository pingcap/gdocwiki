import styles from './RightContainer.module.scss';

export default function RightContainer({ children }) {
  return <div className={styles.container}>{children}</div>;
}
