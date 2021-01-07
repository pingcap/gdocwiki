import naturalCompare from 'natural-compare-lite';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { GapiErrorDisplay } from '../components';
import { updateFiles } from '../reduxSlices/files';
import { DriveFile } from '../utils';

export interface IFolderFilesMeta {
  loading: boolean;
  files?: DriveFile[];
  error?: React.ReactNode;
}

export function useFolderFilesMeta(id?: string) {
  const dispatch = useDispatch();
  const [data, setData] = useState<IFolderFilesMeta>({ loading: true });
  const reqRef = useRef(0);

  useEffect(() => {
    if (!id) {
      setData({ loading: true });
      return;
    }

    async function loadFolderFilesMetadata(checkpoint: number) {
      setData({ loading: true });

      try {
        let pageToken = '';
        const files: Record<string, DriveFile> = {};

        for (let i = 0; i < 10; i++) {
          const resp = await gapi.client.drive.files.list({
            pageToken,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            q: `'${id}' in parents and trashed = false`,
            fields: '*',
            pageSize: 1000,
          });
          console.trace(`loadFolderFilesMetadata files.list (page #${i + 1})`, id, resp);

          if (reqRef.current !== checkpoint) {
            break;
          }
          for (const file of resp.result.files ?? []) {
            files[file.id ?? ''] = file;
          }
          dispatch(updateFiles(resp.result.files ?? []));
          if (resp.result.nextPageToken) {
            pageToken = resp.result.nextPageToken;
          } else {
            break;
          }
        }

        const filesArray = Object.values(files);
        filesArray.sort((a, b) => {
          return naturalCompare(a.name?.toLowerCase() ?? '', b.name?.toLowerCase() ?? '');
        });
        setData({ loading: false, files: filesArray });
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

    // if (mapIdToChildren?.[id] === undefined) {
    reqRef.current++;
    loadFolderFilesMetadata(reqRef.current);
    // } else {
    //   setData({ loading: false, files: mapIdToChildren[id] });
    // }
  }, [id, dispatch]);

  return data;
}
