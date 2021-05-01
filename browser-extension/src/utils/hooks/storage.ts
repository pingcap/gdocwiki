import { useEffect } from 'react';

export function useChromeStorageChangeListener(
  fn: (changes: { [key: string]: chrome.storage.StorageChange }) => void
) {
  useEffect(() => {
    function onChange(
      changes: { [key: string]: chrome.storage.StorageChange },
      namespace: chrome.storage.AreaName
    ) {
      if (namespace !== 'local') {
        return;
      }
      fn(changes);
    }
    chrome.storage.onChanged.addListener(onChange);
    return () => {
      chrome.storage.onChanged.removeListener(onChange);
    };
  }, [fn]);
}
