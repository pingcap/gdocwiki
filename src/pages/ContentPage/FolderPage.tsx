import { Launch16 } from '@carbon/icons-react';
import { Accordion, AccordionItem, InlineLoading } from 'carbon-components-react';
import dayjs from 'dayjs';
import { Stack, IColumn } from 'office-ui-fabric-react';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DriveIcon, ShortcutIcon, Table } from '../../components';
import { useManagedRenderStack } from '../../context/RenderStack';
import { useFolderFilesMeta } from '../../hooks/useFolderFilesMeta';
import { selectMapIdToFile } from '../../reduxSlices/files';
import { DriveFile, mdLink, MimeTypes, parseFolderChildrenDisplaySettings } from '../../utils';
import styles from './FolderPage.module.scss';
import ContentPage from '.';

interface IFolderChildrenProps {
  files?: DriveFile[];
  openInNewWindow: boolean;
}

function FileName({ file }: { file: DriveFile }) {
  const link = mdLink.parse(file.name);
  if (link) {
    return <span>{link.title}</span>;
  } else {
    return (
      <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
        <span>{file.name}</span>
        {file.mimeType === MimeTypes.GoogleShortcut && <ShortcutIcon />}
      </Stack>
    );
  }
}

function FileIcon({ file }: { file: DriveFile }) {
  const link = mdLink.parse(file.name);
  if (link) {
    return <Launch16 />;
  } else {
    return <DriveIcon file={file} />;
  }
}

function FolderChildrenTable({ files, openInNewWindow }: IFolderChildrenProps) {
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
        onRender: (item: DriveFile) => <FileIcon file={item} />,
      },
      {
        key: 'name',
        name: 'Name',
        minWidth: 200,
        isRowHeader: true,
        onRender: (item: DriveFile) => <FileName file={item} />,
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

function FolderChildrenList({ files, openInNewWindow }: IFolderChildrenProps) {
  return (
    <div className={styles.content}>
      <ul>
        {(files ?? []).map((file) => {
          const link = mdLink.parse(file.name);
          const target = openInNewWindow ? '_blank' : undefined;
          const inner = (
            <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
              <FileIcon file={file} />
              <FileName file={file} />
            </Stack>
          );
          return (
            <li key={file.id}>
              <p>
                {link ? (
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  <Link to={`/view/${file.id}`} target={target}>
                    {inner}
                  </Link>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FolderChildrenHide({ files, openInNewWindow }: IFolderChildrenProps) {
  return (
    <Accordion align="start">
      <AccordionItem title={`Sub pages (${files?.length ?? 0})`}>
        <FolderChildrenList files={files} openInNewWindow={openInNewWindow} />
      </AccordionItem>
    </Accordion>
  );
}

export interface IFolderPageProps {
  file: DriveFile;
  shortCutFile?: DriveFile;
  renderStackOffset?: number;
}

function FolderPage({ file, shortCutFile, renderStackOffset = 0 }: IFolderPageProps) {
  useManagedRenderStack({
    depth: renderStackOffset,
    id: 'FolderPage',
    file,
  });

  const mapIdToFile = useSelector(selectMapIdToFile);
  const openInNewWindow = useMemo(() => {
    // If current folder is not in the tree, open new window
    return !mapIdToFile?.[file?.id ?? ''] && shortCutFile;
  }, [mapIdToFile, file, shortCutFile]);

  const displaySettings = useMemo(() => parseFolderChildrenDisplaySettings(file), [file]);

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

  return (
    <div>
      {loading && <InlineLoading description="Loading folder contents..." />}
      {readMeFile && <ContentPage file={readMeFile} renderStackOffset={renderStackOffset + 1} />}
      {!loading && !!error && error}
      {!loading && !error && (
        <div style={{ marginTop: 32 }}>
          {displaySettings.displayInContent === 'table' && (
            <FolderChildrenTable openInNewWindow={openInNewWindow} files={files} />
          )}
          {displaySettings.displayInContent === 'list' && (
            <div style={{ maxWidth: '50rem' }}>
              <FolderChildrenList openInNewWindow={openInNewWindow} files={files} />
            </div>
          )}
          {displaySettings.displayInContent === 'hide' && (
            <div style={{ maxWidth: '50rem' }}>
              <FolderChildrenHide openInNewWindow={openInNewWindow} files={files} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(FolderPage);
