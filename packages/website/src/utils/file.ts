import naturalCompare from 'natural-compare-lite';
import { DriveFile, fileIsFolderOrFolderShortcut } from '../utils/gapi';

export function compareFiles(a: DriveFile, b: DriveFile): number {
  const sortKeyA = getFileSortKey(a);
  const sortKeyB = getFileSortKey(b);
  if (sortKeyA !== sortKeyB) {
    return sortKeyA - sortKeyB;
  }
  return naturalCompare(a.name?.toLowerCase() ?? '', b.name?.toLowerCase() ?? '');
}

export function getFileSortKey(file: DriveFile) {
  let dot = false;
  if (file?.name?.startsWith('.')) {
    dot = true;
  }
  if (fileIsFolderOrFolderShortcut(file)) {
    return dot ? 2 : 1;
  }
  if (file?.name?.toLowerCase() === 'readme') {
    return 10;
  }
  return dot ? 99 : 20;
}
