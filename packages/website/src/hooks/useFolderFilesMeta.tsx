import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GapiErrorDisplay } from '../components';
import { updateFiles, selectMapIdToChildren } from '../reduxSlices/files';
import { DriveFile, compareFiles, MakeRequestQueue } from '../utils';

export interface IFolderFilesMeta {
  loading: boolean;
  files?: DriveFile[];
  error?: React.ReactNode;
}

const inProgressRequests: { [fileId: string]: boolean } = {};

const enqueueRequest = MakeRequestQueue();

export function useFolderFilesMeta(id?: string) {
  const dispatch = useDispatch();
  const [data, setData] = useState<IFolderFilesMeta>({ loading: true });
  const mapIdToChildren = useSelector(selectMapIdToChildren);
  if (id) {
    const files = mapIdToChildren[id] ?? [];
    if (
      data.loading &&
      (data.files === undefined || (data.files && files.length > data.files.length))
    ) {
      // We may already have the files
      // Still go ahead and do the API call to refresh the data
      // The caller can use the existing data in the mean time.
      setData((d) => ({ ...d, files }));
    }
  }

  useEffect(() => {
    if (!id) {
      console.log('useFolderFilesMeta no id');
      setData((v) => ({ ...v, loading: true }));
      return;
    }

    // Synchronize access when there are multiple callers.
    if (inProgressRequests[id]) {
      console.debug('second request, bailing', id);
      // TOD: This isn't correct, but the other will not cancel this one
      setData((v) => ({ ...v, loading: false }));
      return;
    }
    inProgressRequests[id!] = true;

    async function loadFolderFilesMetadata() {
      setData((d) => ({ ...d, loading: true }));

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
          const newFiles = resp.result.files ?? [];
          console.debug(`loadFolderFilesMetadata files.list (page #${i + 1})`, id, newFiles.length);

          for (const file of newFiles) {
            files[file.id ?? ''] = file;
          }
          dispatch(updateFiles(newFiles));
          if (resp.result.nextPageToken) {
            pageToken = resp.result.nextPageToken;
          } else {
            break;
          }
        }

        const filesArray = Object.values(files);
        filesArray.sort(compareFiles);
        setData({ loading: false, files: filesArray });
      } catch (e) {
        setData((d) => ({ ...d, loading: false, error: <GapiErrorDisplay error={e} /> }));
      } finally {
        delete inProgressRequests[id!];
      }
    }

    enqueueRequest(loadFolderFilesMetadata);
  }, [id, dispatch]);

  return data;
}
