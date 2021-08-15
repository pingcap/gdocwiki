import { StarFilled16 } from '@carbon/icons-react';
import dayjs from 'dayjs';
import { IColumn, Stack, StackItem } from 'office-ui-fabric-react';
import { useCallback, useMemo } from 'react';
import FileBreadcrumb from '../pages/FileBreadcrumb';
import { mdLink, DriveFile } from '../utils';
import { DriveFileName, FileLink } from './DriveFileName';
import { DriveIcon } from './DriveIcon';
import { Table } from './Table';
import { Tags } from './Tag';

export interface IFileListTableProps {
  files: DriveFile[];
  openInNewWindow: boolean;
  hierarchy?: boolean;
}

export function FileListTable(props: IFileListTableProps) {
  const { files, openInNewWindow } = props;
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
        key: 'name',
        name: 'Name',
        minWidth: 216,
        isRowHeader: true,
        onRender: (file: DriveFile) => (
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <DriveIcon file={file} />
            <FileLink file={file} openInNewWindow={openInNewWindow}>
              <DriveFileName file={file} />
            </FileLink>
            {file.starred && <StarFilled16 />}
            <Tags file={file} />
            {props.hierarchy && <FileBreadcrumb file={file} foldersOnly={true} />}
          </Stack>
        ),
      },
      {
        key: 'created',
        name: 'Created At',
        minWidth: 100,
        onRender: (item: DriveFile) => (
          <Stack horizontal verticalAlign="center" style={{ height: '100%', fontWeight: 600 }}>
            {dayjs(item.createdTime).fromNow()}
          </Stack>
        ),
      },
      {
        key: 'modify',
        name: 'Modified At',
        minWidth: 100,
        onRender: (item: DriveFile) => (
          <Stack horizontal verticalAlign="center" style={{ height: '100%', fontWeight: 600 }}>
            {dayjs(item.modifiedTime).fromNow()}
          </Stack>
        ),
      },
    ];
    return r;
  }, [openInNewWindow, props.hierarchy]);

  let tableProps = {
    items: files ?? [],
    columns: columns,
    getKey: getKey,
    cellStyleProps: {
      cellLeftPadding: 30,
      cellRightPadding: 0,
      cellExtraRightPadding: 0,
    },
  };
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
