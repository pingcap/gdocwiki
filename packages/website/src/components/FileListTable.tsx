import dayjs from 'dayjs';
import { IColumn } from 'office-ui-fabric-react';
import React, { useCallback, useMemo } from 'react';
import { DriveFile, mdLink } from '../utils';
import { DriveFileName, FileLink } from './DriveFileName';
import { DriveIcon } from './DriveIcon';
import { Table } from './Table';

export interface IFileListTableProps {
  files: DriveFile[];
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
        onRender: (item: DriveFile) => (
          <FileLink file={item} openInNewWindow={openInNewWindow}>
            <DriveFileName file={item} />
          </FileLink>
        ),
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
  }, [openInNewWindow]);

  let tableProps = {
    items: files ?? [],
    columns: columns,
    getKey: getKey,
  }
  if (openInNewWindow) {
    tableProps = Object.assign(tableProps, { onRowClicked: handleRowClick });
  }
  return (
    <>
      <Table {...tableProps} />
      {!files?.length && <div style={{ marginTop: 16 }}>Folder is empty.</div>}
    </>
  );
}
