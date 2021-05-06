import ClientOAuth2, { Data, Token } from 'client-oauth2';
import { GapiClient, GapiUserInfo } from './gapi';
import { log } from './log';
import { mustGetManifestInfo } from './manifest';
import { popupChromeWindow } from './popup';
import { chromeStorage } from './storage';

export type StoredToken = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  data: Data;
  profile: GapiUserInfo;
};

export const StoreKeyOAuthToken = 'oauthToken';

export async function getOAuthClient() {
  const { data } = await mustGetManifestInfo();
  const client = new ClientOAuth2({
    clientId: data.gapiClientID,
    clientSecret: data.gapiClientSecret,
    accessTokenUri: 'https://accounts.google.com/o/oauth2/token',
    authorizationUri: 'https://accounts.google.com/o/oauth2/v2/auth',
    redirectUri: 'https://gdocwiki-api.web.app/oauth/redirect',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
    ],
  });
  return client;
}

async function getAuthUrl() {
  const { data } = await mustGetManifestInfo();
  const client = await getOAuthClient();
  return client.code.getUri({
    query: {
      access_type: 'offline',
      hd: data.gapiHostedDomain,
      prompt: 'consent',
      include_granted_scopes: 'true',
    },
  });
}

export async function requestOAuth() {
  await clearStoredToken();
  const url = await getAuthUrl();
  log.info('OAuthAuth URL', url);
  await popupChromeWindow(url, 600, 800);
  try {
    log.info('OAuth finished, loading user profile...');
    return await getStoredToken();
  } catch (e) {
    throw new Error('Authentication is canelled or failed');
  }
}

export async function storeTokenFromOAuthRedirection(redirectUrl: string): Promise<Token> {
  log.info('Redirection URL', redirectUrl);
  const client = await getOAuthClient();
  const token = await client.code.getToken(redirectUrl);
  log.info('Exchanged Token', token);
  await setStoredTokenAndProfile(token);
  return token;
}

async function setStoredTokenAndProfile(token: Token): Promise<StoredToken> {
  const profile = await new GapiClient(token).getUserInfoProfile();
  log.info('Read Profile', profile);
  const storedToken: StoredToken = {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    tokenType: token.tokenType,
    data: token.data,
    profile,
  };
  await chromeStorage.set(StoreKeyOAuthToken, storedToken);
  return storedToken;
}

export async function clearStoredToken() {
  await chromeStorage.remove(StoreKeyOAuthToken);
}

export async function getStoredToken(): Promise<Token> {
  const storedToken: StoredToken | undefined = await chromeStorage.get(StoreKeyOAuthToken);
  if (storedToken === undefined) {
    throw new Error('OAuth token does not exist');
  }
  const client = await getOAuthClient();
  return client.createToken(
    storedToken.accessToken,
    storedToken.refreshToken,
    storedToken.tokenType,
    storedToken.data
  );
}

export async function getStoredTokenAndRefresh(): Promise<Token> {
  const token = await getStoredToken();
  return await token.refresh();
}

export async function getStoredProfile(): Promise<GapiUserInfo> {
  const storedToken: StoredToken | undefined = await chromeStorage.get(StoreKeyOAuthToken);
  if (storedToken === undefined) {
    throw new Error('OAuth token does not exist');
  }
  return storedToken.profile;
}

export async function updateStoredProfile(token?: Token): Promise<GapiUserInfo> {
  if (!token) {
    token = await getStoredTokenAndRefresh();
  }
  const { profile } = await setStoredTokenAndProfile(token);
  return profile;
}
