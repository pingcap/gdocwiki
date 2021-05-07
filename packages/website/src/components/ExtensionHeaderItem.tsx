import chromeIcon from '@iconify-icons/logos/chrome';
import { Icon } from '@iconify/react';
import { HeaderMenuItem } from 'carbon-components-react';
import { useExtInstallStatus } from '../context/ExtInstallStatus';
import styles from './ExtensionHeaderItem.module.scss';

export interface IExtensionHeaderItemProps {
  onClick?: () => void;
}

export default function ExtensionHeaderItem({ onClick }: IExtensionHeaderItemProps) {
  const { isDetecting, isDetectFailed, installInfo } = useExtInstallStatus();
  const isVisible = Boolean(!isDetecting && !isDetectFailed && !installInfo);

  return (
    <>
      {isVisible && (
        <HeaderMenuItem onClick={onClick} className={styles.item}>
          <Icon icon={chromeIcon} /> Get Chrome Extension
        </HeaderMenuItem>
      )}
    </>
  );
}
