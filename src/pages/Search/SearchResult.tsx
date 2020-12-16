import { Launch16 } from '@carbon/icons-react';
import dayjs from 'dayjs';
import { IColumn, Stack } from 'office-ui-fabric-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { DriveIcon, ShortcutIcon, Table } from '../../components';
import config from '../../config';
import { setLoading } from '../../reduxSlices/files';
import { mdLink, MimeTypes } from '../../utils';
import styles from './SearchResult.module.scss';

function escapeKeyword(keyword: string): string {
  return keyword.replace(/\\/g, `\\\\`).replace(/'/g, "\\'");
}

export default function SearchResult() {
  const param: { keyword: string } = useParams();
  const { keyword } = param;

  const dispatch = useDispatch();
  const [files, setFiles] = useState<gapi.client.drive.File[]>([]);

  const handleSearch = useCallback(
    async (keyword) => {
      const keywordEscaped = escapeKeyword(keyword);
      console.log(`search keyword: '${keyword}', escaped: '${keywordEscaped}'`);
      const fileList: gapi.client.drive.File[] = [];
      try {
        let pageToken = '';
        for (let i = 0; i < 10; i++) {
          const resp = await gapi.client.drive.files.list({
            pageToken,
            corpora: 'drive',
            driveId: config.REACT_APP_ROOT_DRIVE_ID,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            pageSize: 500,
            q: `trashed = false and (name contains '${keywordEscaped}' or fullText contains '${keywordEscaped}')`,
            fields: config.DEFAULT_FILE_FIELDS,
          });
          console.log(
            `search result: files.list (page #${i + 1})`,
            config.REACT_APP_ROOT_DRIVE_ID,
            resp
          );
          const filesTmp = resp?.result?.files ?? [];
          fileList.push(...filesTmp);
          if (resp.result.nextPageToken) {
            pageToken = resp.result.nextPageToken;
          } else {
            break;
          }
        }
        setFiles(fileList);
      } catch (e) {
        console.error(e);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    handleSearch(keyword);
  }, [handleSearch, keyword]);

  const columns = useMemo(() => {
    const r: IColumn[] = [
      {
        key: 'type',
        name: '',
        minWidth: 16,
        maxWidth: 16,
        onRender: (item: gapi.client.drive.File) => {
          const link = mdLink.parse(item.name);
          if (link) {
            return <Launch16 />;
          } else {
            return <DriveIcon file={item} />;
          }
        },
      },
      {
        key: 'name',
        name: 'Name',
        minWidth: 200,
        isRowHeader: true,
        onRender: (item: gapi.client.drive.File) => {
          const link = mdLink.parse(item.name);
          if (link) {
            return link.title;
          } else {
            return (
              <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
                <span>{item.name}</span>
                {item.mimeType === MimeTypes.GoogleShortcut && <ShortcutIcon />}
              </Stack>
            );
          }
        },
      },
      {
        key: 'create',
        name: 'Created At',
        minWidth: 100,
        onRender: (item: gapi.client.drive.File) => {
          return dayjs(item.createdTime).fromNow();
        },
      },
      {
        key: 'modify',
        name: 'Modified At',
        minWidth: 100,
        onRender: (item: gapi.client.drive.File) => {
          return dayjs(item.modifiedTime).fromNow();
        },
      },
    ];
    return r;
  }, []);

  const getKey = useCallback((file: gapi.client.drive.File) => {
    return file.id ?? '';
  }, []);

  const history = useHistory();

  const handleRowClick = useCallback(
    (targetFile: gapi.client.drive.File) => {
      const openInNewWindow = true;
      mdLink.handleFileLinkClick(history, targetFile, openInNewWindow);
    },
    [history]
  );

  return (
    <div className={styles.searchResultContainer}>
      <Table items={files ?? []} columns={columns} onRowClicked={handleRowClick} getKey={getKey} />
    </div>
  );
}
