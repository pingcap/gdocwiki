import { useMount } from 'ahooks';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import config from '../config';
import { setLoading, resetFromFileList } from '../reduxSlices/files';

export default function useLoadDriveFiles() {
  const dispatch = useDispatch();

  const loadTreeData = useCallback(async () => {
    dispatch(setLoading(true));

    try {
      // TODO: Support pagination
      const resp = await gapi.client.drive.files.list({
        corpora: 'drive',
        driveId: config.rootDriveId,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        pageSize: 500,
        q: 'trashed = false',
        fields:
          'nextPageToken, files(name, id, parents, mimeType, modifiedTime, createdTime, lastModifyingUser(displayName, photoLink), iconLink, webViewLink, shortcutDetails, capabilities/canAddChildren)',
      });
      console.log('files.list', config.rootDriveId, resp);

      dispatch(resetFromFileList(resp.result.files ?? []));
    } catch (e) {
      console.log(e);
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
