import { Edit16, Maximize16 } from '@carbon/icons-react';
import { Accordion, AccordionItem, InlineLoading } from 'carbon-components-react';
import { Stack, TooltipHost } from 'office-ui-fabric-react';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DriveFileName, DriveIcon, FileListTable } from '../../components';
import { useManagedRenderStack } from '../../context/RenderStack';
import { useFolderFilesMeta, IFolderFilesMeta  } from '../../hooks/useFolderFilesMeta';
import { selectMapIdToFile } from '../../reduxSlices/files';
import {
  DriveFile,
  FolderChildrenDisplayMode,
  canEdit,
  mdLink,
  parseFolderChildrenDisplaySettings,
} from '../../utils';
import styles from './FolderPage.module.scss';
import ContentPage from '.';

interface IFolderFilesProps {
  files: DriveFile[];
}

interface IFolderProps extends IFolderFilesProps {
  openInNewWindow: boolean;
}

interface IFolderDisplay extends IFolderFilesProps {
  display?: FolderChildrenDisplayMode;
  open?: boolean;
}

interface IFolderChildrenProps extends IFolderFilesProps {
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

function FolderChildrenList({ files, openInNewWindow }: IFolderProps) {
  return (
    <div className={styles.content}>
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

function FolderChildrenHide({ children, files, open }: IFolderChildrenProps) {
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
  const [expandReadmeList, setExpandReadmeList] = useState(false);
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

  const displaySettings = useMemo(() => parseFolderChildrenDisplaySettings(file), [file]);

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

  const props = {
    loading,
    error,
    files,
    openInNewWindow,
    display: displaySettings.displayInContent,
  };

  if (readMeFile) {
    let display = displaySettings.displayInContent ?? 'list';
    const stackProps = {};
    if (expandReadmeList) {
      display = 'hide';
    }
    if (display === 'list') {
      stackProps['horizontal'] = 'horizontal';
    } else if (display === 'table') {
      // Still renders as a table, but hidden
      display = 'hide';
    }
    props.display = display;
    console.log('expandReadmeList', expandReadmeList);

    let listToTable: React.ReactNode | null = null;
    if (display === 'list' && !expandReadmeList) {
      const clickExpand = (ev) => {
        ev.preventDefault();
        setExpandReadmeList(true);
      };
      listToTable = (
        <TooltipHost content="expand" styles={{ root: { alignSelf: 'center' } }}>
          <a href="#" title="expand" onClick={clickExpand} style={{ marginLeft: '0.3em' }}>
            <Maximize16 />
          </a>
        </TooltipHost>
      );
    }

    return (
      <div style={{ marginTop: '0.2rem' }}>
        {display === 'list' && <hr style={{ paddingTop: '0', marginBottom: '1rem' }} />}
        <Stack {...stackProps} tokens={{ childrenGap: 16 }}>
          <Stack grow={0}>
            <Stack>
              {listToTable}
              <FilesView {...props} open={expandReadmeList} />
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

function FilesView(props: IFolderFilesMeta & IFolderProps & IFolderDisplay) {
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

function ListForSettings(props: IFolderProps & IFolderDisplay) {
  const { display, files, open, openInNewWindow } = props;
  if (display === 'hide') {
    return (
      <div style={{ maxWidth: '50rem' }}>
        <FolderChildrenHide open={!!open} files={files}>
          <FileListTable openInNewWindow={openInNewWindow} files={files} />
        </FolderChildrenHide>
      </div>
    );
  }
  if (display === 'list') {
    return (
      <div style={{ maxWidth: '50rem' }}>
        <FolderChildrenList openInNewWindow={openInNewWindow} files={files} />
      </div>
    );
  }

  // table
  return <FileListTable openInNewWindow={openInNewWindow} files={files} />;
}

export default React.memo(FolderPage);
