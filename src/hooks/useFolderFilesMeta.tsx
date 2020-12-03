import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { GapiErrorDisplay } from '../components';
import { selectMapIdToChildren } from '../reduxSlices/files';

export interface IFolderFilesMeta {
  loading: boolean;
  files?: gapi.client.drive.File[];
  error?: React.ReactNode;
}

export function useFolderFilesMeta(id?: string) {
  const [data, setData] = useState<IFolderFilesMeta>({ loading: true });
  const mapIdToChildren = useSelector(selectMapIdToChildren);

  console.log('useFolderFilesMeta', id, mapIdToChildren[id ?? '']);

  const reqRef = useRef(0);

  useEffect(() => {
    if (!id) {
      setData({ loading: true });
      return;
    }

    async function loadFolderFilesMetadata(checkpoint: number) {
      setData({ loading: true });

      try {
        // FIXME: Handle pagination
        const resp = await gapi.client.drive.files.list({
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          q: `'${id}' in parents and trashed = false`,
          fields: '*',
          pageSize: 1000,
        });
        if (reqRef.current === checkpoint) {
          setData({ loading: false, files: resp.result.files });
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

    if (mapIdToChildren?.[id] === undefined) {
      reqRef.current++;
      loadFolderFilesMetadata(reqRef.current);
    } else {
      setData({ loading: false, files: mapIdToChildren[id] });
    }

    // Ignore mapIdToChildren change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return data;
}
