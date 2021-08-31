import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConfig } from '../config';
import {
  setDrive,
  setDriveId,
  selectDriveId,
  selectDrives,
  selectMapIdToFile,
  setLoading,
  setRootFolderId,
  updateFiles,
  setError,
  updateFile,
} from '../reduxSlices/files';
import { resetFiles, selectActiveId, activate, expand } from '../reduxSlices/siderTree';
import { driveToFolder, handleGapiError, MimeTypes } from '../utils';

export default function useLoadDriveFiles() {
  const dispatch = useDispatch();
  const driveId = useSelector(selectDriveId);
  const drives = useSelector(selectDrives);
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
            // TODO: need to point their parent to the user's drive
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
      async function loadDriveFromParents() {
        let parentId: string | undefined = activeId;
        while (parentId) {
          const respFile = await gapi.client.drive.files.get({
            supportsAllDrives: true,
            fileId: parentId,
            fields: '*',
          });
          const file = respFile.result;
          if (file.driveId === parentId) {
            console.log('found parent drive', file.name, file);
            dispatch(setDriveId(parentId));
            if (file.name === 'Drive') {
              dispatch(updateFile({ ...file, name: 'Loading Drive...' }));
            } else {
              dispatch(updateFile(file));
            }
            break;
          }
          dispatch(updateFile(file));
          if (file.name === 'My Drive') {
            console.log('found parent My Drive');
            dispatch(setDrive(file));
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
    // We may already have the drive from listing all the drives
    // We don't have to wait for doLoadDrive below
    function alreadyHaveDrive() {
      if (!driveId) {
        return;
      }
      const driveFileName = mapIdToFile[driveId]?.name;
      if (driveFileName === 'Drive' || driveFileName === 'Loading Drive...') {
        for (const drive of drives) {
          if (drive.id === driveId) {
            dispatch(setDrive(drive));
          }
        }
      }
    },
    [mapIdToFile, driveId, drives, dispatch]
  );

  useEffect(
    function doLoadDrive() {
      async function loadDrive() {
        if (!driveId) {
          return;
        }
        try {
          if (driveId === 'root') {
            console.log('get my drive folder');
            const resp = await gapi.client.drive.files.get({
              fileId: driveId,
              fields: '*',
            });
            dispatch(updateFile(resp.result));
            dispatch(setRootFolderId(resp.result.id!));
            dispatch(setDrive(resp.result));
          } else {
            console.log('get drive', driveId);
            const resp = await gapi.client.drive.drives.get({
              driveId: driveId,
              fields: '*',
            });
            dispatch(setDrive(resp.result));
            dispatch(updateFile(driveToFolder(resp.result)));
          }
        } catch (e) {
          console.error('load Drive', e);
        }
      }
      loadDrive();
    },
    [dispatch, driveId]
  );
}
