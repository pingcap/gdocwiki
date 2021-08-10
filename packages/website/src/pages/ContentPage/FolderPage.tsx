import { Edit16, Maximize16, Minimize16 } from '@carbon/icons-react';
import { Accordion, AccordionItem, InlineLoading } from 'carbon-components-react';
import { Stack, TooltipHost } from 'office-ui-fabric-react';
import React, { useMemo, useState, MouseEventHandler } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DriveFileName, DriveIcon, FileListTable, IFileListTableProps } from '../../components';
import { useManagedRenderStack } from '../../context/RenderStack';
import { useFolderFilesMeta, IFolderFilesMeta  } from '../../hooks/useFolderFilesMeta';
import { selectMapIdToFile } from '../../reduxSlices/files';
import { DriveFile, FolderChildrenDisplayMode, canEdit, mdLink, } from '../../utils';
import styles from './FolderPage.module.scss';
import ContentPage from '.';

interface IFolderFilesProps {
  files: DriveFile[];
}

interface IFolderListProps extends IFolderFilesProps {
  openInNewWindow: boolean;
  clickExpandToTable: MouseEventHandler;
}

interface IFolderDisplay extends IFolderFilesProps {
  display?: FolderChildrenDisplayMode;
  open?: boolean;
}

interface ITableShrinkToList extends IFileListTableProps {
  clickShrinkToList?: MouseEventHandler;
}

type AllFolderViewProps = IFolderListProps & IFolderDisplay & ITableShrinkToList;

interface IFolderAccordionProps extends IFolderFilesProps {
  children: any;
  open: boolean;
}

interface IFileInList {
  file: DriveFile;
  openInNewWindow: boolean;
}

function FileLink({ file, openInNewWindow }: IFileInList) {
  const link = mdLink.parse(file.name);
  const target = openInNewWindow ? '_blank' : undefined;
  const inner = (
    <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
      <DriveIcon file={file} />
      <DriveFileName file={file} />
    </Stack>
  );
  return link ? (
    <a href={link.url} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <Link to={`/view/${file.id}`} target={target}>
      {inner}
    </Link>
  );
}

function FolderChildrenList({ files, openInNewWindow, clickExpandToTable }: IFolderListProps) {
  return (
    <div className={styles.content}>
      <TooltipHost content="expand to table view" styles={{ root: { alignSelf: 'center' } }}>
        <a href="#" title="expand" onClick={clickExpandToTable} style={{ marginLeft: '0.3em' }}>
          <Maximize16 />
        </a>
      </TooltipHost>
      <ul>
        {files.map((file: gapi.client.drive.File) => {
          return (
            <li key={file.id}>
              <FileLink file={file} openInNewWindow={openInNewWindow} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FolderChildrenHide({ children, files, open }: IFolderAccordionProps) {
  return (
    <Accordion align="start">
      <AccordionItem
        className={styles.accordion}
        open={open}
        title={`Folder Contents (${files.length})`}
      >
        {children}
      </AccordionItem>
    </Accordion>
  );
}

export interface IFolderPageProps {
  file: DriveFile;
  shortCutFile?: DriveFile;
  renderStackOffset?: number;
}

export const folderPageId = 'FolderPage';

function FolderPage({ file, shortCutFile, renderStackOffset = 0 }: IFolderPageProps) {
  useManagedRenderStack({
    depth: renderStackOffset,
    id: folderPageId,
    file,
  });

  const mapIdToFile = useSelector(selectMapIdToFile);
  const openInNewWindow = useMemo(() => {
    // If current folder is not in the tree, open new window
    return !mapIdToFile?.[file?.id ?? ''] && shortCutFile;
  }, [mapIdToFile, file, shortCutFile]);

  const display = 
    (localStorage.getItem('preferredFolderDisplay') as FolderChildrenDisplayMode) || 'list';
  const [preferredDisplay, setpreferredDisplay] = useState(display);

  const filesMeta = useFolderFilesMeta(file.id);
  const { loading, error } = filesMeta;
  const files = useMemo(() => filesMeta.files ?? [], [filesMeta]);

  const readMeFile = useMemo(() => {
    for (const item of files) {
      if (item.name?.toLowerCase() === 'readme') {
        return item;
      }
    }
  }, [files]);

  const clickExpandToTable = (ev) => {
    ev.preventDefault();
    setpreferredDisplay('table');
    localStorage.setItem('preferredFolderDisplay', 'table');
  };

  const clickShrinkToList = (ev) => {
    ev.preventDefault();
    setpreferredDisplay('list');
    localStorage.setItem('preferredFolderDisplay', 'list');
  };

  const props = {
    loading,
    error,
    files,
    openInNewWindow,
    display: preferredDisplay,
    clickExpandToTable,
    clickShrinkToList,
  };

  if (readMeFile) {
    const stackProps = {};
    if (preferredDisplay === 'table') {
      // Still renders as a table, but hidden
      props.display = 'hide';
    }
    if (preferredDisplay === 'list') {
      stackProps['horizontal'] = 'horizontal';
    }

    return (
      <div style={{ marginTop: '0.2rem' }}>
        {display === 'list' && <hr style={{ paddingTop: '0', marginBottom: '1rem' }} />}
        <Stack {...stackProps} tokens={{ childrenGap: 16 }}>
          <Stack grow={0}>
            <Stack>
              <FilesView {...props} open={true} />
            </Stack>
          </Stack>
          <Stack grow={10}>
            <Stack horizontal style={{ marginLeft: '1rem' }} tokens={{ childrenGap: 8 }}>
              <Link to={`/view/${readMeFile.id}`}>{readMeFile.name}</Link>
              {canEdit(readMeFile) && (
                <TooltipHost content="edit">
                  <Link to={`/view/${readMeFile.id}/edit`}>
                    <Edit16 />
                  </Link>
                </TooltipHost>
              )}
            </Stack>
            <ContentPage
              loading={null}
              splitWithFileListing={display === 'list'}
              file={readMeFile}
              renderStackOffset={renderStackOffset + 1}
            />
          </Stack>
        </Stack>
      </div>
    );
  }

  return <FilesView {...props} />;
}

function FilesView(props: IFolderFilesMeta & AllFolderViewProps) {
  const { error, loading } = props;
  const hasFiles = props.files.length > 0;
  return (
    <div>
      {error}
      {!error && loading && !hasFiles && <InlineLoading description="Loading folder contents..." />}
      {(!loading || hasFiles) && <ListForSettings {...props} />}
      {!error && loading && hasFiles && (
        <InlineLoading description="Refreshing folder contents..." />
      )}
    </div>
  );
}

function ListForSettings(props: AllFolderViewProps) {
  const { display, files, open, openInNewWindow, clickExpandToTable } = props;
  const listProps = { files, openInNewWindow };
  if (display === 'hide') {
    return (
      <div style={{ maxWidth: '50rem' }}>
        <FolderChildrenHide open={!!open} files={files}>
          <FileListTable {...listProps} />
        </FolderChildrenHide>
      </div>
    );
  }

  if (display === 'table') {
    return <FileListTableShrinkable {...listProps} clickShrinkToList={props.clickShrinkToList} />;
  }

  // default to list
  return (
    <div style={{ maxWidth: '50rem' }}>
      <FolderChildrenList {...listProps} clickExpandToTable={clickExpandToTable} />
    </div>
  );
}

function FileListTableShrinkable(props: ITableShrinkToList & IFileListTableProps) {
  const { clickShrinkToList } = props;
  return (
    <div className={styles.tableView}>
      {clickShrinkToList && (
        <TooltipHost content="shrink to list view" styles={{ root: { alignSelf: 'center' } }}>
          <a href="#" title="expand" onClick={clickShrinkToList} style={{ marginLeft: '0.3em' }}>
            <Minimize16 />
          </a>
        </TooltipHost>
      )}
      <FileListTable {...props} />
    </div>
  );
}

export default React.memo(FolderPage);
