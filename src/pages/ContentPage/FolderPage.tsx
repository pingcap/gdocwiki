import { Launch16 } from '@carbon/icons-react';
import { InlineLoading } from 'carbon-components-react';
import dayjs from 'dayjs';
import { Stack, IColumn } from 'office-ui-fabric-react';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { DriveIcon, ShortcutIcon, Table } from '../../components';
import { useManagedRenderStack } from '../../context/RenderStack';
import { useFolderFilesMeta } from '../../hooks/useFolderFilesMeta';
import { selectMapIdToFile } from '../../reduxSlices/files';
import { mdLink, MimeTypes } from '../../utils';
import ContentPage from '.';

export interface IFolderPageProps {
  file: gapi.client.drive.File;
  shortCutFile?: gapi.client.drive.File;
  renderStackOffset?: number;
}

function FolderPage({ file, shortCutFile, renderStackOffset = 0 }: IFolderPageProps) {
  const history = useHistory();
  const mapIdToFile = useSelector(selectMapIdToFile);

  useManagedRenderStack({
    depth: renderStackOffset,
    id: 'FolderPage',
    file,
  });

  const { files, loading, error } = useFolderFilesMeta(file.id);
  const readMeFile = useMemo(() => {
    if (!files) {
      return undefined;
    }
    for (const item of files) {
      if (item.name?.toLowerCase() === 'readme') {
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

  const handleRowClick = useCallback(
    (targetFile: gapi.client.drive.File) => {
      let openInNewWindow = false;
      // If current folder is not in the tree, open new window
      if (!mapIdToFile?.[file?.id ?? ''] && shortCutFile) {
        openInNewWindow = true;
      }

      mdLink.handleFileLinkClick(history, targetFile, openInNewWindow);
    },
    [history, mapIdToFile, file, shortCutFile]
  );

  return (
    <div>
      {loading && <InlineLoading description="Loading folder contents..." />}
      {readMeFile && <ContentPage file={readMeFile} renderStackOffset={renderStackOffset + 1} />}
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

export default React.memo(FolderPage);
