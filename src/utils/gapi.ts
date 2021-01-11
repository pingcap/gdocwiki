export type DriveFile = gapi.client.drive.File;

export function handleGapiError(e: any): Error {
  if (e?.result?.error) {
    return e.result.error;
  } else if (e.message) {
    return e;
  } else {
    return new Error('Unknown error');
  }
}

export function parseDriveLink(url: string) {
  let m = url.match(/^https:\/\/docs\.google\.com\/[^/]+(\/u\/\d+)?\/d\/([^/]+)\/edit/);
  if (!m) {
    m = url.match(/^https:\/\/drive\.google\.com\/[^/]+(\/u\/\d+)?\/[^/]+\/([^/]+)$/);
  }
  if (m) {
    return m[2];
  } else {
    return null;
  }
}

export const MimeTypes = {
  GoogleFolder: 'application/vnd.google-apps.folder',
  GoogleShortcut: 'application/vnd.google-apps.shortcut',
  GoogleDocument: 'application/vnd.google-apps.document',
  GoogleSpreadsheet: 'application/vnd.google-apps.spreadsheet',
  GooglePresentation: 'application/vnd.google-apps.presentation',
  GoogleDrawing: 'application/vnd.google-apps.drawing',
  MSOpenExcel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  MSOpenWord: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  MSExcel: 'application/vnd.ms-excel',
  MSWord: 'application/msword',
  PDF: 'application/pdf',
};

export const TAG_PROPERTY_PREFIX = 'tags/';

export function extractTagsIntoSet(file: DriveFile, target: Set<string>) {
  for (const key in file.properties ?? {}) {
    if (key.startsWith(TAG_PROPERTY_PREFIX)) {
      const actualTag = key.slice(TAG_PROPERTY_PREFIX.length);
      if (actualTag.length > 0) {
        target.add(actualTag);
      }
    }
  }
}

export function extractTags(file: DriveFile): string[] {
  const s = new Set<string>();
  extractTagsIntoSet(file, s);
  const tags = Array.from(s.keys());
  tags.sort();
  return tags;
}

export function shouldShowTagSettings(file?: DriveFile): boolean {
  return !!file?.capabilities?.canEdit;
}

export function shouldShowFolderChildrenSettings(file?: DriveFile): boolean {
  return !!(file?.capabilities?.canEdit && file?.mimeType === MimeTypes.GoogleFolder);
}

export type FolderChildrenDisplayMode = 'list' | 'table' | 'hide';

export interface FolderChildrenDisplaySettings {
  displayInSidebar?: boolean;
  displayInContent?: FolderChildrenDisplayMode;
}

export const FOLDER_CHILDREN_SETTINGS_PROPERTY = 'folderChildrenSettings';

export function parseFolderChildrenDisplaySettings(file: DriveFile): FolderChildrenDisplaySettings {
  const def: FolderChildrenDisplaySettings = {
    displayInSidebar: true,
    displayInContent: 'list',
  };
  let parsed = {};
  const value = file.appProperties?.[FOLDER_CHILDREN_SETTINGS_PROPERTY] ?? '';
  if (value) {
    parsed = JSON.parse(value);
  }
  return {
    ...def,
    ...parsed,
  };
}
