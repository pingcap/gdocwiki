import { useMount } from 'ahooks';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import config from '../config';
import { setLoading, clearFileList, updateFiles, setError } from '../reduxSlices/files';
import { handleGapiError } from '../utils';

const { fields } = config;

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
          driveId: config.REACT_APP_ROOT_DRIVE_ID,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          pageSize: 500,
          q: 'trashed = false',
          fields,
        });
        console.log(`files.list (page #${i + 1})`, config.REACT_APP_ROOT_DRIVE_ID, resp);
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

  useMount(() => {
    // Only load tree data once when webpage is loaded. There is no need to reload
    // in other scenarios.
    loadTreeData();
  });
}
