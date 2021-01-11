import { usePersistFn } from 'ahooks';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getConfig } from '../../config';
import { DriveFile } from '../../utils';

export function escapeSearchQuery(keyword: string): string {
  return keyword.replace(/\\/g, `\\\\`).replace(/'/g, "\\'");
}

export function useSearch(fieldName: string, queryBuilder: (value: string) => string) {
  const param = useParams<any>();
  const fieldValue = param[fieldName];

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const reqRef = useRef(0);
  const queryBuilderMemo = usePersistFn(queryBuilder);

  useEffect(() => {
    async function doSearch(checkpoint: number) {
      setLoading(true);
      const fileList: DriveFile[] = [];
      try {
        let pageToken = '';
        for (let i = 0; i < 10; i++) {
          const resp = await gapi.client.drive.files.list({
            pageToken,
            corpora: 'drive',
            driveId: getConfig().REACT_APP_ROOT_DRIVE_ID,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            pageSize: 500,
            q: queryBuilderMemo(fieldValue),
            fields: getConfig().DEFAULT_FILE_FIELDS,
          });
          console.trace(
            `SearchByQuery files.list (page #${i + 1})`,
            fieldValue,
            getConfig().REACT_APP_ROOT_DRIVE_ID,
            resp
          );
          if (reqRef.current !== checkpoint) {
            return;
          }

          const filesTmp = resp?.result?.files ?? [];
          fileList.push(...filesTmp);
          // Update file list each search
          setFiles(fileList);
          if (resp.result.nextPageToken) {
            pageToken = resp.result.nextPageToken;
          } else {
            break;
          }
        }
      } catch (e) {
        if (reqRef.current !== checkpoint) {
          return;
        }
        console.error(e);
      } finally {
        console.log(reqRef.current, checkpoint);
        if (reqRef.current !== checkpoint) {
          return;
        }
        console.log('set not loading');
        setLoading(false);
      }
    }
    reqRef.current++;
    doSearch(reqRef.current);
  }, [fieldValue, queryBuilderMemo]);

  return { loading, files, value: fieldValue };
}
