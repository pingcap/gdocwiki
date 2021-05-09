import dayjs from 'dayjs';
import { IColumn } from 'office-ui-fabric-react';
import React, { useCallback, useMemo } from 'react';
import { DriveFile, mdLink } from '../utils';
import { DriveFileName, DriveIcon, Table } from '.';

export interface IFileListTableProps {
  files?: DriveFile[];
  openInNewWindow: boolean;
}

export function FileListTable({ files, openInNewWindow }: IFileListTableProps) {
  const getKey = useCallback((file: DriveFile) => {
    return file.id ?? '';
  }, []);

  const handleRowClick = useCallback(
    (targetFile: DriveFile) => {
      mdLink.handleFileLinkClick(targetFile, openInNewWindow);
    },
    [openInNewWindow]
  );

  const columns = useMemo(() => {
    const r: IColumn[] = [
      {
        key: 'type',
        name: '',
        minWidth: 16,
        maxWidth: 16,
        onRender: (item: DriveFile) => <DriveIcon file={item} />,
      },
      {
        key: 'name',
        name: 'Name',
        minWidth: 200,
        isRowHeader: true,
        onRender: (item: DriveFile) => <DriveFileName file={item} />,
      },
      {
        key: 'create',
        name: 'Created At',
        minWidth: 100,
        onRender: (item: DriveFile) => {
          return dayjs(item.createdTime).fromNow();
        },
      },
      {
        key: 'modify',
        name: 'Modified At',
        minWidth: 100,
        onRender: (item: DriveFile) => {
          return dayjs(item.modifiedTime).fromNow();
        },
      },
    ];
    return r;
  }, []);

  return (
    <>
      <Table items={files ?? []} columns={columns} onRowClicked={handleRowClick} getKey={getKey} />
      {!files?.length && <div style={{ marginTop: 16 }}>Folder is empty.</div>}
    </>
  );
}
