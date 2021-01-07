import { Dispatch } from '@reduxjs/toolkit';
import { History } from 'history';
import { removeFile } from '../reduxSlices/files';
import { DriveFile, showConfirm } from '../utils';
import { promptError } from './FileAction.utils';

export function showTrashFile(
  fileTypeName: string,
  currentFile: DriveFile,
  dispatch: Dispatch<any>,
  history: History
) {
  showConfirm({
    modalHeading: `Trash ${fileTypeName}`,
    yesButtonKind: 'danger',
    submittingText: 'Trashing...',
    submittedText: `${fileTypeName} trashed!`,
    content: (
      <span>
        Are you sure want to move "<strong>{currentFile.name}</strong>" to trash?
      </span>
    ),
    submitFn: async () => {
      try {
        await gapi.client.drive.files.update({
          fileId: currentFile.id!,
          supportsAllDrives: true,
          resource: {
            trashed: true,
          },
        });
        dispatch(removeFile(currentFile.id!));
        if (currentFile.parents?.[0]) {
          history.push(`/view/${currentFile.parents[0]}`);
        } else {
          history.push(`/`);
        }
      } catch (e) {
        promptError(e);
        return false;
      }
    },
  });
}
