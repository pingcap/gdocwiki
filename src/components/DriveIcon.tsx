import { MimeTypes } from '../utils';

export default function DriveIcon({ file }: { file?: gapi.client.drive.File }) {
  if (!file) {
    return null;
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

DriveIcon.getIconSrc = (mimeType, size = 32) => {
  return `https://drive-thirdparty.googleusercontent.com/${size}/type/${mimeType}`;
};
