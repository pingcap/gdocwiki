import ky from 'ky';

const config = {
  REACT_APP_USE_CONFIG_FILE: process.env.REACT_APP_USE_CONFIG_FILE === '1',
  // The G Suite domain to which users must belong to sign in
  REACT_APP_GAPI_HOSTED_DOMAIN: process.env.REACT_APP_GAPI_HOSTED_DOMAIN ?? '',
  REACT_APP_GAPI_COOKIE_POLICY: process.env.REACT_APP_GAPI_COOKIE_POLICY ?? 'single_host_origin',
  REACT_APP_GAPI_KEY: process.env.REACT_APP_GAPI_KEY ?? '',
  REACT_APP_GAPI_CLIENT_ID: process.env.REACT_APP_GAPI_CLIENT_ID ?? '',
  REACT_APP_ROOT_ID: process.env.REACT_APP_ROOT_ID ?? '',
  // Ued to list all files in a fast way.
  REACT_APP_ROOT_DRIVE_ID: process.env.REACT_APP_ROOT_DRIVE_ID ?? '',

  DEFAULT_FILE_FIELDS:
    'nextPageToken, files(name, id, parents, mimeType, modifiedTime, createdTime, lastModifyingUser(displayName, photoLink), iconLink, webViewLink, shortcutDetails, capabilities(canAddChildren, canTrash, canRename, canMoveChildrenOutOfTeamDrive))',
};

if (!config.REACT_APP_USE_CONFIG_FILE) {
  for (const f of [
    'REACT_APP_GAPI_KEY',
    'REACT_APP_GAPI_CLIENT_ID',
    'REACT_APP_ROOT_ID',
    'REACT_APP_ROOT_DRIVE_ID',
  ]) {
    if (!config[f]) {
      throw new Error(`Environment variable ${f} is not configured`);
    }
  }
}

export async function overwriteConfig() {
  try {
    const url = `${process.env.PUBLIC_URL}/config.json?_=${Date.now()}`;
    const oc = (await ky(url).json()) as Record<string, string>;
    for (const key in oc) {
      if (oc[key]) {
        config[key] = oc[key];
      }
    }
  } catch (e) {
    if (config.REACT_APP_USE_CONFIG_FILE) {
      throw e;
    }
  }
}

export function getConfig() {
  return config;
}
