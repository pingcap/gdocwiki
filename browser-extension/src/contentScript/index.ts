import { parseDriveLink } from '../utils/googleUrl';
import { runDocs } from './docs';
import { runDrive } from './drive';

export function run() {
  const id = parseDriveLink(window.location.href);
  if (!id) {
    return;
  }
  if (window.location.host === 'docs.google.com') {
    runDocs(id);
  } else if (window.location.host === 'drive.google.com') {
    runDrive(id);
  }
}

run();
