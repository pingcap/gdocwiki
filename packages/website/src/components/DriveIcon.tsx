import { Launch16 } from '@carbon/icons-react';
import { DriveFile, mdLink, MimeTypes } from '../utils';

export function DriveIcon({ file }: { file?: DriveFile }) {
  if (!file) {
    return null;
  }
  const link = mdLink.parse(file.name);
  if (link) {
    return <Launch16 />;
  }

  let src = file.iconLink ?? '';
  if (file.mimeType === MimeTypes.GoogleShortcut && file.shortcutDetails?.targetMimeType) {
    src = DriveIcon.getIconSrc(file.shortcutDetails?.targetMimeType);
  }
  src = src.replace('/16/type/', '/32/type/');
  if (!src) {
    return null;
  }
  return <img src={src} width={16} alt="File Icon" />;
}

DriveIcon.getIconSrc = (mimeType: string, size = 32) => {
  return `https://drive-thirdparty.googleusercontent.com/${size}/type/${mimeType}`;
};
