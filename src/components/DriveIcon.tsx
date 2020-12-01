export default function DriveIcon({ file }: { file?: gapi.client.drive.File }) {
  if (!file) {
    return null;
  }
  let src = file.iconLink ?? '';
  if (
    file.mimeType === 'application/vnd.google-apps.shortcut' &&
    file.shortcutDetails?.targetMimeType
  ) {
    src = `https://drive-thirdparty.googleusercontent.com/16/type/${file.shortcutDetails?.targetMimeType}`;
  }
  if (src.indexOf('/16/type/application') > -1) {
    src = src.replace('/16/type/application', '/32/type/application');
  }
  if (!src) {
    return null;
  }
  return <img src={src} width={16} alt="File Icon" />;
}
