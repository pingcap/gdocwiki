import { Launch16 } from '@carbon/icons-react';
import { InlineLoading } from 'carbon-components-react';
import dayjs from 'dayjs';
import { Stack, IColumn } from 'office-ui-fabric-react';
import React, { useCallback, useMemo } from 'react';
import { useHistory } from 'react-router';
import { DriveIcon, ShortcutIcon, Table } from '../../components';
import { useDocTree } from '../../context/DocTree';
import { useFolderFilesMeta } from '../../hooks/useFolderFilesMeta';
import { mdLink } from '../../utils';
import DocPage from './DocPage';

export interface IFolderPageProps {
  file: gapi.client.drive.File;
  shortCutFile?: gapi.client.drive.File;
}

export default function FolderPage({ file, shortCutFile }: IFolderPageProps) {
  const history = useHistory();
  const docTree = useDocTree();

  const { files, loading, error } = useFolderFilesMeta(file.id);
  const readMeFile = useMemo(() => {
    if (!files) {
      return undefined;
    }
    for (const item of files) {
      if (
        item.name?.toLowerCase() === 'readme' &&
        item.mimeType === 'application/vnd.google-apps.document'
      ) {
        return item;
      }
    }
  }, [files]);

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
                {item.mimeType === 'application/vnd.google-apps.shortcut' && <ShortcutIcon />}
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

  const handleRowClick = useCallback(
    (targetFile: gapi.client.drive.File) => {
      let openInNewWindow = false;
      // If current folder is not in the tree, open new window
      if (!docTree.dataFlat?.[file?.id ?? ''] && shortCutFile) {
        openInNewWindow = true;
      }

      mdLink.handleFileLinkClick(history, targetFile, openInNewWindow);
    },
    [history, docTree.dataFlat, file, shortCutFile]
  );

  return (
    <div>
      {loading && <InlineLoading description="Loading folder contents..." />}
      {readMeFile && <DocPage file={readMeFile} />}
      {!loading && !!error && error}
      {!loading && !error && (
        <>
          <Table
            items={files ?? []}
            columns={columns}
            onRowClicked={handleRowClick}
            getKey={getKey}
          />
          <div style={{ marginTop: 16 }}>{files?.length ?? 0} files in the folder.</div>
        </>
      )}
    </div>
  );
}
