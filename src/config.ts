const config = {
  REACT_APP_GAPI_KEY: process.env.REACT_APP_GAPI_KEY ?? '',
  REACT_APP_GAPI_CLIENT_ID: process.env.REACT_APP_GAPI_CLIENT_ID ?? '',
  REACT_APP_ROOT_ID: process.env.REACT_APP_ROOT_ID ?? '',
  // Ued to list all files in a fast way.
  REACT_APP_ROOT_DRIVE_ID: process.env.REACT_APP_ROOT_DRIVE_ID ?? '',

  DEFAULT_FILE_FIELDS:
    'nextPageToken, files(name, id, parents, mimeType, modifiedTime, createdTime, lastModifyingUser(displayName, photoLink), iconLink, webViewLink, shortcutDetails, capabilities(canAddChildren, canTrash, canRename, canMoveChildrenOutOfTeamDrive))',
};

for (const envVar in config) {
  if (!config[envVar]) {
    throw new Error(`Environment variable ${envVar} is not configured`);
  }
}

export default config;
