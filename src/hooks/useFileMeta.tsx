import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { GapiErrorDisplay } from '../components';
import { selectMapIdToFile } from '../reduxSlices/files';

export interface IFileMeta {
  loading: boolean;
  file?: gapi.client.drive.File;
  error?: React.ReactNode;
}

export default function useFileMeta(id?: string) {
  const [data, setData] = useState<IFileMeta>({ loading: true });
  const mapIdToFile = useSelector(selectMapIdToFile);

  const reqRef = useRef(0);

  useEffect(() => {
    if (!id) {
      setData({ loading: true });
      return;
    }

    async function loadFileMetadata(checkpoint: number) {
      setData({ loading: true });

      try {
        const respFile = await gapi.client.drive.files.get({
          supportsAllDrives: true,
          fileId: id!,
          fields: '*',
        });
        console.trace('useFileMeta files.get', respFile);

        if (reqRef.current !== checkpoint) {
          return;
        }

        if (respFile.result.driveId === id) {
          const respDrive = await gapi.client.drive.drives.get({
            driveId: id!,
            fields: '*',
          });
          console.trace('useFileMeta drives.get', respDrive);
          respFile.result.name = respDrive.result.name;
        }

        // If another request is performed, simply ignore this result.
        // This may happen when id changes very frequently
        setData({ loading: false, file: respFile.result });
      } catch (e) {
        if (reqRef.current === checkpoint) {
          console.log(e);
          setData((d) => ({ ...d, error: <GapiErrorDisplay error={e} /> }));
        }
      } finally {
        if (reqRef.current === checkpoint) {
          setData((d) => ({ ...d, loading: false }));
        }
      }
    }

    // If data is available in the doc tree, use it directly.
    if (mapIdToFile?.[id] === undefined) {
      reqRef.current++;
      loadFileMetadata(reqRef.current);
    } else {
      setData({ loading: false, file: mapIdToFile[id] });
    }

    // Ignore mapIdToFile change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return data;
}
