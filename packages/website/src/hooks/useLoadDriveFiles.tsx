import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConfig } from '../config';
import {
  setDrive,
  setDriveId,
  selectDriveId,
  selectMapIdToFile,
  setLoading,
  updateFiles,
  setError,
  updateFile,
} from '../reduxSlices/files';
import { resetFiles, selectActiveId, activate, expand } from '../reduxSlices/siderTree';
import { driveToFolder, handleGapiError, MimeTypes } from '../utils';

export default function useLoadDriveFiles() {
  const dispatch = useDispatch();
  const driveId = useSelector(selectDriveId);
  const activeId = useSelector(selectActiveId);
  const mapIdToFile = useSelector(selectMapIdToFile);
  const [loadedDriveFiles, setLoadedDriveFiles] = useState(false);

  useEffect(
    function doLoadDriveFiles() {
      async function loadDriveFiles() {
        if (!driveId) {
          return;
        }
        dispatch(setLoading(true));
        dispatch(setError(undefined));
        dispatch(resetFiles());
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
            setLoadedDriveFiles(true);
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
      }
      loadDriveFiles();
    },
    [dispatch, driveId]
  );

  useEffect(() => {
    if (!loadedDriveFiles || !driveId) {
      return;
    }
    if (activeId) {
      dispatch(activate({ arg: activeId, mapIdToFile }));
      dispatch(expand({ arg: [activeId], mapIdToFile }));
    }
    dispatch(expand({ arg: [driveId], mapIdToFile }));
  }, [activeId, loadedDriveFiles, dispatch, mapIdToFile, driveId]);

  useEffect(
    function doLoadDriveFromParents() {
      async function loadDriveFromParents() {
        let parentId: string | undefined = activeId;
        while (parentId) {
          const respFile = await gapi.client.drive.files.get({
            supportsAllDrives: true,
            fileId: parentId,
            fields: '*',
          });
          dispatch(updateFile(respFile.result));
          if (respFile.result.driveId === parentId) {
            console.log('found parent drive', respFile.result.name);
            dispatch(setDriveId(parentId));
            break;
          }
          parentId = respFile.result.parents?.[0];
        }
      }

      if (!driveId && activeId) {
        loadDriveFromParents();
      }
    },
    [activeId, driveId, dispatch]
  );

  useEffect(
    function doLoadDrive() {
      async function loadDrive() {
        if (!driveId) {
          return;
        }
        console.log('get drive');
        const resp = await gapi.client.drive.drives.get({
          driveId: driveId,
          fields: '*',
        });
        dispatch(setDrive(resp.result));
        dispatch(updateFile(driveToFolder(resp.result)));
      }
      loadDrive();
    },
    [dispatch, driveId]
  );
}
