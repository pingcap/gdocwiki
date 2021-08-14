import { Edit16, Minimize16 } from '@carbon/icons-react';
import { Accordion, AccordionItem, InlineLoading } from 'carbon-components-react';
import { Stack, TooltipHost } from 'office-ui-fabric-react';
import React, { useMemo, useState, MouseEventHandler } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FileListTable,
  FolderChildrenList,
  IFileListTableProps,
  IFolderFilesProps,
  IFolderListProps,
} from '../../components';
import { useManagedRenderStack } from '../../context/RenderStack';
import { useFolderFilesMeta, IFolderFilesMeta  } from '../../hooks/useFolderFilesMeta';
import { selectMapIdToFile } from '../../reduxSlices/files';
import { DriveFile, FolderChildrenDisplayMode, canEdit } from '../../utils';
import styles from './FolderPage.module.scss';
import ContentPage from '.';

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
const folderDisplayStorageKey = 'preferredFolderDisplay';

function FolderPage({ file, shortCutFile, renderStackOffset = 0 }: IFolderPageProps) {
  useManagedRenderStack({
    depth: renderStackOffset,
    id: folderPageId,
    file,
  });

  const mapIdToFile = useSelector(selectMapIdToFile);
  const openInNewWindow = useMemo(() => {
    // If current folder is not in the tree, open new window
    return !mapIdToFile?.[file?.id!] && shortCutFile;
  }, [mapIdToFile, file, shortCutFile]);

  const filesMeta = useFolderFilesMeta(file.id!);
  const { loading, error } = filesMeta;
  const files = useMemo(() => filesMeta.files ?? [], [filesMeta]);

  const defaultDisplay =
    (localStorage.getItem(folderDisplayStorageKey) as FolderChildrenDisplayMode) || 'list';
  const [preferredDisplay, setpreferredDisplay] = useState(defaultDisplay);

  const readMeFile = useMemo(() => {
    for (const item of files) {
      if (item.name?.toLowerCase() === 'readme') {
        setpreferredDisplay('list');
        return item;
      }
    }
  }, [files]);

  const clickExpandToTable = (ev) => {
    ev.preventDefault();
    setpreferredDisplay('table');
    if (!readMeFile) {
      localStorage.setItem(folderDisplayStorageKey, 'table');
    }
  };

  const clickShrinkToList = (ev) => {
    ev.preventDefault();
    setpreferredDisplay('list');
    if (!readMeFile) {
      localStorage.setItem(folderDisplayStorageKey, 'list');
    }
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
    props.display = 'list';
    if (preferredDisplay === 'table') {
      // Still renders as a table, but hidden
      props.display = 'hide';
    }
    if (preferredDisplay === 'list') {
      stackProps['horizontal'] = 'horizontal';
    }

    return (
      <div style={{ marginTop: '0.2rem' }}>
        {props.display === 'list' && <hr style={{ paddingTop: '0', marginBottom: '1rem' }} />}
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
              splitWithFileListing={props.display === 'list'}
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
