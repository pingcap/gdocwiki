import { useCallback, useEffect, useState } from 'react';
import { log } from '../log';
import { getManifestInfo, StoredManifestInfo, StoreManifestInfo } from '../manifest';
import { useChromeStorageChangeListener } from './storage';

export function useManifest() {
  const [data, setData] = useState<StoredManifestInfo | undefined>(undefined);
  useEffect(() => {
    async function init() {
      const m = await getManifestInfo();
      log.info('Initially read StoreManifestInfo', m);
      setData(m);
    }
    init();
  }, []);

  const onChange = useCallback((changes: { [key: string]: chrome.storage.StorageChange }) => {
    log.info('Received storage change');
    if (changes[StoreManifestInfo]) {
      log.info('StoreManifestInfo is changed to', changes[StoreManifestInfo].newValue);
      setData(changes[StoreManifestInfo].newValue as StoredManifestInfo);
    }
  }, []);

  useChromeStorageChangeListener(onChange);

  return data;
}
