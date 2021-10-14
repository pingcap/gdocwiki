import { useMount } from 'ahooks';
import { useState } from 'react';
import { getConfig } from '../config';

export default function useGapi() {
  const [isLoaded, setIsLoaded] = useState(false);

  useMount(() => {
    const initConfig = {
      apiKey: getConfig().REACT_APP_GAPI_KEY,
      clientId: getConfig().REACT_APP_GAPI_CLIENT_ID,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      scope:
        'https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents.readonly',
      hosted_domain: getConfig().REACT_APP_GAPI_HOSTED_DOMAIN,
      cookie_policy: getConfig().REACT_APP_GAPI_COOKIE_POLICY,
    };

    gapi.load('client:auth2', () => {
      gapi.client.load('drive', 'v3', async () => {
        try {
          await gapi.client.init(initConfig);
        } catch (ex) {
          console.error(ex);
        }
        setIsLoaded(true);
      });
    });
  });

  return {
    gapiLoaded: isLoaded,
  };
}
