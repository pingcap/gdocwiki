import { useMount } from 'ahooks';
import { useCallback, useState } from 'react';
import { dispatch } from 'use-bus';

export default function useGapi() {
  const [isLoaded, setIsLoaded] = useState(false);

  const initClient = useCallback(async () => {
    try {
      await gapi.client.init({
        apiKey: 'AIzaSyCr53G4OrNdOpjjejsM4wStjW_Uagudq8E',
        clientId: '814839399439-cm9t983r5374hk28v5lt5ne75i6eit6c.apps.googleusercontent.com',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
      });
    } catch (ex) {
      console.error(ex);
    }

    function dispatchSignedIn(signedIn) {
      dispatch({ type: 'gSignedInChange', payload: { signedIn } });
    }

    gapi.auth2.getAuthInstance().isSignedIn.listen(dispatchSignedIn);

    setIsLoaded(true);
  }, []);

  useMount(() => {
    gapi.load('client:auth2', initClient);
  });

  return {
    gapiLoaded: isLoaded,
  };
}
