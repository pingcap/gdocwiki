import ky from 'ky';

const config = {
  REACT_APP_USE_CONFIG_FILE: process.env.REACT_APP_USE_CONFIG_FILE === '1',
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
    const oc = (await ky(process.env.PUBLIC_URL + '/config.json').json()) as Record<string, string>;
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
