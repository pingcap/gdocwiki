import React, { useEffect, useRef, useState } from 'react';
import { GapiErrorDisplay } from '../components';
import { useDocTree } from '../context/DocTree';

export interface IFileMeta {
  loading: boolean;
  file?: gapi.client.drive.File;
  error?: React.ReactNode;
}

export default function useFileMeta(id?: string) {
  const [data, setData] = useState<IFileMeta>({ loading: true });

  const docTree = useDocTree();

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
        console.log('files.get', respFile);

        if (reqRef.current === checkpoint) {
          // If another request is performed, simply ignore this result.
          // This may happen when id changes very frequently
          setData({ loading: false, file: respFile.result });
        }
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
    if (docTree.dataFlat?.[id] === undefined) {
      reqRef.current++;
      loadFileMetadata(reqRef.current);
    } else {
      setData({ loading: false, file: docTree.dataFlat[id] });
    }

    // Ignore docTree.dataFlat change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return data;
}
