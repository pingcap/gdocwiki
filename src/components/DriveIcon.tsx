export interface IDriveIconProps {
  src?: string;
  alt?: string;
}

export default function DriveIcon({ src, alt = 'File icon' }: IDriveIconProps) {
  if (!src) {
    return null;
  }
  let newSrc = src;
  if (newSrc.indexOf('/16/type/application') > -1) {
    newSrc = newSrc.replace('/16/type/application', '/32/type/application');
  }
  return <img src={newSrc} width={16} alt={alt} />;
}
