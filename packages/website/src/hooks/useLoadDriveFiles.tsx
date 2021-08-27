import { useMount } from 'ahooks';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConfig } from '../config';
import {
  selectDriveId,
  setDriveId,
  setLoading,
  updateFiles,
  setError,
  updateFile,
} from '../reduxSlices/files';
import { resetFiles } from '../reduxSlices/siderTree';
import { driveToFolder, handleGapiError, MimeTypes } from '../utils';

export default function useLoadDriveFiles() {
  const dispatch = useDispatch();
  const driveId = useSelector(selectDriveId);
  if (driveId === undefined) {
    const rootDriveId = getConfig().REACT_APP_ROOT_DRIVE_ID;
    if (rootDriveId) {
      dispatch(setDriveId(rootDriveId));
    }
  }

  const loadTreeData = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(undefined));
    if (driveId) {
      dispatch(resetFiles(driveId));
    }
    try {
      let pageToken = '';
      for (let i = 0; i < 10; i++) {
        const resp = await gapi.client.drive.files.list({
          pageToken,
          corpora: 'drive',
          driveId: driveId,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          pageSize: 500,
          q: `trashed = false and (mimeType = '${MimeTypes.GoogleFolder}')`,
          fields: getConfig().DEFAULT_FILE_FIELDS,
        });
        console.debug(
          `useLoadDriveFiles files.list (page #${i + 1})`,
          driveId,
          resp.result.files?.length
        );
        dispatch(updateFiles(resp.result.files ?? []));
        if (resp.result.nextPageToken) {
          pageToken = resp.result.nextPageToken;
        } else {
          break;
        }
      }
    } catch (e) {
      console.log(e);
      dispatch(setError(handleGapiError(e)));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, driveId]);

  const loadDriveRoot = useCallback(async () => {
    if (!driveId) {
      return;
    }
    const resp = await gapi.client.drive.drives.get({
      driveId,
      fields: '*',
    });
    dispatch(updateFile(driveToFolder(resp.result)));
  }, [dispatch, driveId]);

  useMount(() => {
    // Only load tree data once when webpage is loaded. There is no need to reload
    // in other scenarios.
    loadTreeData();
    if (driveId === getConfig().REACT_APP_ROOT_ID) {
      loadDriveRoot();
    }
  });
}
