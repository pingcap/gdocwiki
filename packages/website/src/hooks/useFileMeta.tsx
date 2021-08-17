import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GapiErrorDisplay } from '../components';
import { selectMapIdToFile, updateFile } from '../reduxSlices/files';
import { DriveFile } from '../utils';

export interface IFileMeta {
  loading: boolean;
  file?: DriveFile;
  error?: React.ReactNode;
}

const inProgressRequests: { [fileId: string]: boolean } = {};

export default function useFileMeta(id?: string) {
  const dispatch = useDispatch();
  const [data, setData] = useState<IFileMeta>({ loading: true });
  const mapIdToFile = useSelector(selectMapIdToFile);
  if (id && data.loading && data.file === undefined) {
    const file = mapIdToFile[id];
    if (file) {
      // We may already have the file
      // Still go ahead and do the API call to refresh the data
      // The caller can use the existing data in the mean time.
      setData({ loading: data.loading, file });
    }
  }

  useEffect(() => {
    if (!id) {
      setData({ loading: true });
      return;
    }

    // Synchronize access when there are multiple callers.
    if (inProgressRequests[id]) {
      console.debug('second request, bailing', id);
      return;
    }
    inProgressRequests[id!] = true;

    async function loadFileMetadata() {
      setData({ loading: true });

      try {
        const respFile = await gapi.client.drive.files.get({
          supportsAllDrives: true,
          fileId: id!,
          fields: '*',
        });
        console.debug('useFileMeta files.get', respFile);

        if (respFile.result.driveId === id) {
          const respDrive = await gapi.client.drive.drives.get({
            driveId: id!,
            fields: '*',
          });
          console.debug('useFileMeta drives.get', respDrive.result);
          respFile.result.name = respDrive.result.name;
        } else {
          dispatch(updateFile(respFile.result));
        }

        setData({ loading: false, file: respFile.result });
      } catch (e) {
        console.log(e);
        setData((d) => ({ ...d, error: <GapiErrorDisplay error={e} /> }));
      } finally {
        delete inProgressRequests[id!];
        setData((d) => ({ ...d, loading: false }));
      }
    }

    loadFileMetadata();

    // Ignore mapIdToFile change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return data;
}
