import { removeFile } from '../reduxSlices/files';
import { history, DriveFile, showConfirm, store } from '../utils';
import { promptError } from './FileAction.utils';

export function showTrashFile(fileTypeName: string, currentFile: DriveFile) {
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
        store.dispatch(removeFile(currentFile.id!));
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
