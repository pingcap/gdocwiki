export type DriveFile = gapi.client.drive.File;

export function driveToFolder(drive: gapi.client.drive.Drive): gapi.client.drive.File {
  return {
    id: drive.id,
    driveId: drive.id,
    name: drive.name,
    capabilities: drive.capabilities,
    createdTime: drive.createdTime,
    kind: drive.kind,
    mimeType: MimeTypes.GoogleFolder,
    webViewLink: `https://drive.google.com/drive/folders/${drive.id}`,
  };
}

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
  let m = url.match(
    /^https:\/\/docs\.google\.com\/[^/]+(\/u\/\d+)?\/d\/([^/]+)(\/)?(edit|preview)?/
  );
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
  MSOpenPPT: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  MSExcel: 'application/vnd.ms-excel',
  MSWord: 'application/msword',
  PDF: 'application/pdf',
  VideoMP4: 'video/mp4',
  VideoMKV: 'video/x-matroska',
};

// Support a view mode (html) in addition to preview
const ViewableMimeTypes = [MimeTypes.GoogleDocument, MimeTypes.GoogleSpreadsheet]
export function viewable(mimeType: string) {
  return ViewableMimeTypes.indexOf(mimeType) > -1;
}

const EditableMimeTypes = [MimeTypes.GoogleDocument, MimeTypes.GoogleSpreadsheet]
export function inlineEditable(mimeType: string) {
  return EditableMimeTypes.indexOf(mimeType) > -1;
}

export function previewable(mimeType: string) {
  return PreviewableMimeTypes.indexOf(mimeType) > -1;
}

export const PreviewableMimeTypes = [
  MimeTypes.GoogleSpreadsheet,
  MimeTypes.GoogleDocument,
  MimeTypes.GooglePresentation,
  MimeTypes.GoogleDrawing,
  MimeTypes.MSOpenWord,
  MimeTypes.MSOpenExcel,
  MimeTypes.MSOpenPPT,
  MimeTypes.MSWord,
  MimeTypes.MSExcel,
  MimeTypes.PDF,
  MimeTypes.VideoMP4,
  MimeTypes.VideoMKV,
];

export const HalfViewPreviewMimeTypes = [MimeTypes.MSOpenWord, MimeTypes.MSWord, MimeTypes.PDF];

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
  return canEdit(file);
}

export function canEdit(file?: DriveFile): boolean {
  return !!file?.capabilities?.canEdit;
}

export function canChangeSettings(file?: DriveFile): boolean {
  return canEdit(file);
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
  const value = file.appProperties?.[FOLDER_CHILDREN_SETTINGS_PROPERTY] ?? '';
  if (value) {
    const placeHolder: FolderChildrenDisplaySettings = {
      displayInSidebar: true,
      displayInContent: 'list',
    };
    const parsed = JSON.parse(value);
    for (const key of Object.keys(placeHolder)) {
      if (typeof parsed[key] === typeof placeHolder[key]) {
        placeHolder[key] = parsed[key];
      } else {
        delete placeHolder[key];
      }
    }
    return placeHolder;
  } else {
    return {
      displayInSidebar: true,
    };
  }
}

export function fileIsFolderOrFolderShortcut(file: DriveFile) {
  return (
    file.mimeType === MimeTypes.GoogleFolder ||
    (file.mimeType === MimeTypes.GoogleShortcut &&
      file.shortcutDetails?.targetMimeType === MimeTypes.GoogleFolder)
  );
}
