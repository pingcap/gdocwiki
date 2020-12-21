import { useMount } from 'ahooks';
import { useCallback, useState } from 'react';
import { getConfig } from '../config';

export default function useGapi() {
  const [isLoaded, setIsLoaded] = useState(false);

  const initClient = useCallback(async () => {
    try {
      await gapi.client.init({
        apiKey: getConfig().REACT_APP_GAPI_KEY,
        clientId: getConfig().REACT_APP_GAPI_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents',
      });
    } catch (ex) {
      console.error(ex);
    }

    setIsLoaded(true);
  }, []);

  useMount(() => {
    gapi.load('client:auth2', initClient);
  });

  return {
    gapiLoaded: isLoaded,
  };
}
