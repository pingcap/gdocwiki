import { Token } from "client-oauth2";
import { useCallback, useEffect, useState } from "react";
import { GapiUserInfo } from "../gapi";
import { log } from "../log";
import {
  getStoredToken,
  getStoredTokenAndRefresh,
  StoredToken,
  StoreKeyOAuthToken,
  updateStoredProfile,
} from "../oauth";
import { useChromeStorageChangeListener } from "./storage";

// Load profile on-demand when token exists. This also updates the stored token and profile.
export function useLatestProfile(): [GapiUserInfo | undefined, boolean] {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<GapiUserInfo | undefined>(undefined);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setProfile(undefined);
      try {
        const profile = await updateStoredProfile();
        setProfile(profile);
      } catch (e) {
        log.info("Load profile failed");
        log.info(e);
      }
      setIsLoading(false);
    }
    init();
  }, [reloadToken]);

  const onChange = useCallback(
    (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const change = changes[StoreKeyOAuthToken];
      if (!change) {
        return;
      }
      const newValue = change.newValue as StoredToken | undefined;
      const oldValue = change.oldValue as StoredToken | undefined;
      // Only trigger reload when token changed from non-exist to exist or changed from exist to non-exist.
      if (Boolean(newValue) !== Boolean(oldValue)) {
        log.info("Token status is updated");
        setReloadToken((t) => t + 1);
      }
    },
    []
  );

  useChromeStorageChangeListener(onChange);

  return [profile, isLoading];
}

export function useToken(): [Token | undefined, boolean] {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<Token | undefined>(undefined);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setToken(undefined);
      try {
        const token = await getStoredTokenAndRefresh();
        setToken(token);
      } catch (e) {
        log.info("Load gdocwiki token failed");
        log.info(e);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const onChange = useCallback(
    async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const change = changes[StoreKeyOAuthToken];
      if (!change) {
        return;
      }
      try {
        const token = await getStoredToken();
        setToken(token);
      } catch (e) {
        setToken(undefined);
      }
    },
    []
  );

  useChromeStorageChangeListener(onChange);

  return [token, isLoading];
}
