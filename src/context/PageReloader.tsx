import React, { useCallback, useContext } from 'react';
import { useState } from 'react';

const Ctx = React.createContext<any>({ token: 0, setToken: () => {} });

export function PageReloaderProvider({ children }) {
  const [token, setToken] = useState(0);
  return <Ctx.Provider value={{ token, setToken }}>{children}</Ctx.Provider>;
}

export function usePageReloadToken() {
  const { token } = useContext(Ctx);
  return token;
}

export function usePageReloader() {
  const { setToken } = useContext(Ctx);
  return useCallback(() => {
    setToken((v) => v + 1);
  }, [setToken]);
}
