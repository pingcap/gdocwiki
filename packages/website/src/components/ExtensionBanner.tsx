import cx from 'classnames';
import { useExtInstallStatus } from '../context/ExtInstallStatus';
import styles from './ExtensionBanner.module.scss';
import image from './extension.png';

export interface IExtensionBannerProps {
  visible: boolean;
  onDismiss?: (ev: any) => void;
}

export function ExtensionBanner({ visible, onDismiss }: IExtensionBannerProps) {
  const { isDetecting, isDetectFailed, installInfo } = useExtInstallStatus();

  const isVisible = Boolean(!isDetecting && !isDetectFailed && !installInfo && visible);

  return (
    <div className={cx(styles.container, { [styles.visible]: isVisible })}>
      <div className={styles.bg}></div>
      <div className={styles.imgContainer}>
        <img src={image} width="900" alt="banner" />
        <div className={styles.buttonsGroup}>
          <a
            href="https://chrome.google.com/webstore/detail/gdocwiki-integration/pcnhielddaaanlfkifllbjahdbndndea"
            target="_blank"
            rel="noreferrer"
            className={styles.button}
          >
            Get in Chrome Web Store
          </a>
          <a href="#" className={styles.button} onClick={onDismiss}>
            Dismiss
          </a>
        </div>
      </div>
    </div>
  );
}
