import { useMount } from 'ahooks';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getConfig } from '../config';
import { setLoading, clearFileList, updateFiles, setError, updateFile } from '../reduxSlices/files';
import { handleGapiError, MimeTypes } from '../utils';

export default function useLoadDriveFiles() {
  const dispatch = useDispatch();

  const loadTreeData = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(undefined));

    try {
      dispatch(clearFileList());

      let pageToken = '';
      for (let i = 0; i < 10; i++) {
        const resp = await gapi.client.drive.files.list({
          pageToken,
          corpora: 'drive',
          driveId: getConfig().REACT_APP_ROOT_DRIVE_ID,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          pageSize: 500,
          q: 'trashed = false',
          fields: getConfig().DEFAULT_FILE_FIELDS,
        });
        console.log(`files.list (page #${i + 1})`, getConfig().REACT_APP_ROOT_DRIVE_ID, resp);
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
  }, [dispatch]);

  const loadDriveRoot = useCallback(async () => {
    const resp = await gapi.client.drive.drives.get({
      driveId: getConfig().REACT_APP_ROOT_DRIVE_ID,
      fields: '*',
    });
    dispatch(
      updateFile({
        mimeType: MimeTypes.GoogleFolder,
        webViewLink: `https://drive.google.com/drive/folders/${resp.result.id}`,
        ...resp.result,
      })
    );
  }, [dispatch]);

  useMount(() => {
    // Only load tree data once when webpage is loaded. There is no need to reload
    // in other scenarios.
    loadTreeData();
    loadDriveRoot();
  });
}
