import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConfig } from '../config';
import {
  setDrive,
  setDrives,
  setDriveId,
  selectDrive,
  selectDriveId,
  selectMapIdToFile,
  setLoading,
  setRootFolderId,
  updateFiles,
  setError,
  updateFile,
} from '../reduxSlices/files';
import { resetFiles, selectActiveId, activate, expand } from '../reduxSlices/siderTree';
import { handleGapiError, MimeTypes } from '../utils';

export default function useLoadDriveFiles() {
  const dispatch = useDispatch();
  const drive = useSelector(selectDrive);
  const driveId = useSelector(selectDriveId);
  const activeId = useSelector(selectActiveId);
  const mapIdToFile = useSelector(selectMapIdToFile);
  const [loadedDriveFiles, setLoadedDriveFiles] = useState(false);
  const [loadFromParentsCache, setLoadedFromParentsCache] = useState('');

  useEffect(
    function doLoadDriveFiles() {
      async function loadDriveFiles() {
        if (!driveId) {
          return;
        }
        setLoadedDriveFiles(false);
        dispatch(setLoading(true));
        dispatch(setError(undefined));
        dispatch(resetFiles());
        try {
          let pageToken = '';
          for (let i = 0; i < 10; i++) {
            const resp = await gapi.client.drive.files.list({
              pageToken,
              corpora: driveId === 'root' ? 'user' : 'drive',
              driveId: driveId === 'root' ? undefined : driveId,
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
            let files = resp.result.files || [];
            if (driveId === 'root') {
              files = files.map((file) => {
                return { driveId: 'root', ...file };
              });
            }
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
    if (!loadedDriveFiles) {
      return;
    }
    if (activeId) {
      dispatch(activate({ arg: activeId, mapIdToFile }));
      dispatch(expand({ arg: [activeId], mapIdToFile }));
    }
  }, [activeId, loadedDriveFiles, dispatch, mapIdToFile]);

  useEffect(
    function doLoadDriveFromParents() {
      async function loadDriveFromParent(id: string) {
        let file = mapIdToFile[id];
        if (!file) {
          try {
            const respFile = await gapi.client.drive.files.get({
              supportsAllDrives: true,
              fileId: id,
              fields: '*',
            });
            file = respFile.result;
            dispatch(updateFile(file));
          } catch (e) {
            console.log('error getting file from id', id, e);
            throw e;
          }
        }
        if (file.name === 'My Drive') {
          console.log('found parent My Drive');
          dispatch(setDrive(file));
        }
        if (file.driveId) {
          console.log('found drive id from file', file.name);
          dispatch(setDriveId(file.driveId));
        }
        const parentId = file.parents?.[0];
        if (parentId) {
          loadDriveFromParent(parentId)
        }
      }

      // The dependency checking was not working
      // we only want activeId and driveId as dependencies
      if (!driveId && activeId && driveId + activeId !== loadFromParentsCache) {
        loadDriveFromParent(activeId);
        setLoadedFromParentsCache(driveId + activeId);
      }
    },
    [activeId, driveId, dispatch, mapIdToFile, loadFromParentsCache]
  );

  useEffect(
    function doLoadDrive() {
      async function loadDrive() {
        if (!driveId || (drive && drive.id !== 'root')) {
          return;
        }
        try {
          if (driveId === 'root') {
            console.log('get my drive folder');
            const resp = await gapi.client.drive.files.get({
              fileId: driveId,
              fields: '*',
            });
            dispatch(setRootFolderId(resp.result.id!));
            dispatch(setDrive(resp.result));
          } else {
            console.log('get drive', driveId);
            const resp = await gapi.client.drive.drives.get({
              driveId: driveId,
              fields: '*',
            });
            dispatch(setDrive(resp.result));
          }
        } catch (e) {
          console.error('load Drive', e);
        }
      }

      loadDrive();
    },
    [dispatch, driveId, drive]
  );

  useEffect(
    function doGetDrives() {
      async function getDrives() {
        try {
          const rsp = await gapi.client.drive.drives.list({
            pageSize: 100,
          });
          dispatch(setDrives(rsp.result.drives ?? []));
        } catch (e) {
          console.error('getDrives', e);
        }
      }
      getDrives();
    },
    [dispatch]
  );
}
