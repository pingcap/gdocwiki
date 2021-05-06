import React, { useContext, useEffect, useState } from 'react';
import { extConn } from '../utils/extensionApi';

export type ExtInstallStatus = {
  isDetecting: boolean;
  isDetectFailed?: boolean;
  installInfo?: GdocWiki.Extension.DetectInstallResponse;
};

const Ctx = React.createContext<ExtInstallStatus>({
  isDetecting: true,
});

export function ExtInstallStatusProvider({ children }) {
  const [value, setValue] = useState<ExtInstallStatus>({
    isDetecting: true,
  });

  useEffect(() => {
    async function run() {
      setValue({ isDetecting: true });
      try {
        const sender = await extConn;
        const info = await sender.probeExtensionInfo();
        setValue({ isDetecting: false, installInfo: info ? info : undefined });
        console.log('Detect extension completed, info =', info);
      } catch (e) {
        setValue({ isDetecting: false, isDetectFailed: true });
      }
    }

    run();
  }, []);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExtInstallStatus() {
  return useContext(Ctx);
}
