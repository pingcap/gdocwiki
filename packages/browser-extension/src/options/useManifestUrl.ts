import { connectToChild } from 'penpal';
import { useEffect, useState } from 'react';
import { log } from '../utils/log';

const iframe = document.createElement('iframe');
iframe.src = 'https://gdocwiki-api.web.app/api';
iframe.style.position = 'absolute';
iframe.width = '0px';
iframe.height = '0px';

const connection = connectToChild<GdocWiki.APIPortal.Methods>({
  iframe,
  debug: true,
  timeout: 5000,
});
const extConn = connection.promise;

document.body.appendChild(iframe);

type ManifestProbeStatus = {
  isDetecting: boolean;
  manifestUrl?: string;
};

export function useManifestUrl() {
  const [value, setValue] = useState<ManifestProbeStatus>({ isDetecting: true });

  useEffect(() => {
    async function run() {
      setValue({ isDetecting: true });
      try {
        const sender = await extConn;
        const url = await sender.getManifestProbeUrl();
        setValue({ isDetecting: false, manifestUrl: url ? url : undefined });
        log.info('Detected manifest url', url);
      } catch (e) {
        setValue({ isDetecting: false });
      }
    }

    run();
  }, []);

  return value;
}
