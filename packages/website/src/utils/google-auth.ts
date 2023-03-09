import { getConfig } from '../config';

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export let googleIdToken: google.accounts.id.CredentialResponse | null = null;
export let googleAccessToken: google.accounts.oauth2.TokenResponse | null = null;
export let userProfile: UserProfile | null = null;
export const isUserSignedIn = () => !!googleAccessToken?.access_token;

const parseJwt = (token: string) => {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
};

const getGoogleIdToken = () =>
  new Promise<google.accounts.id.CredentialResponse>((resolve) => {
    google.accounts.id.initialize({
      client_id: getConfig().REACT_APP_GAPI_CLIENT_ID,
      auto_select: true,
      callback: (response) => {
        google.accounts.id.cancel();
        googleIdToken = response;
        userProfile = parseJwt(response.credential);
        resolve(response);
      },
    });
    google.accounts.id.prompt();
  });

const getAccessToken = () =>
  new Promise<google.accounts.oauth2.TokenResponse>((resolve) => {
    const callback = (response: google.accounts.oauth2.TokenResponse) => {
      googleAccessToken = response;
      resolve(response);
    };
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: getConfig().REACT_APP_GAPI_CLIENT_ID,
      hint: userProfile?.email,
      scope:
        'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents.readonly',
      callback,
    });
    tokenClient.requestAccessToken();
  });

let refreshTimeoutHandle: number | undefined;

export async function setupGoogleAuth() {
  clearTimeout(refreshTimeoutHandle);
  if (!google) {
    throw new Error('google(gsi) is not defined');
  }
  try {
    await getGoogleIdToken();
    const tokenResponse = await getAccessToken();
    gapi.client.setToken(tokenResponse);
    // refresh accessToken after 55 minutes before it expires
    refreshTimeoutHandle = (setTimeout(setupGoogleAuth, 55 * 60 * 1000) as unknown) as number;
  } catch (error) {
    // error happened, probably we are not signed in anymore
    googleIdToken = null;
    googleAccessToken = null;
    userProfile = null;
    throw error;
  }
}

export const signOut = async () => {
  google.accounts.id.disableAutoSelect();
  googleIdToken = null;
  await setupGoogleAuth();
};

export const signIn = async (ev: any) => {
  await setupGoogleAuth();
};
