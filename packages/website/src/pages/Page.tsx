import { useMount } from 'ahooks';
import { InlineLoading } from 'carbon-components-react';
import dayjs from 'dayjs';
import { Stack, StackItem } from 'office-ui-fabric-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { browserExtensionUrl, getConfig } from '../config';
import useFileMeta from '../hooks/useFileMeta';
import useTitle from '../hooks/useTitle';
import useUpdateSiderFromPath from '../hooks/useUpdateSiderFromPath';
import { selectDocMode, setDocMode, resetDocMode } from '../reduxSlices/doc';
import { setDriveId, setRootFolderId } from '../reduxSlices/files';
import { selectPageReloadToken } from '../reduxSlices/pageReload';
import { selectSidebarOpen } from '../reduxSlices/siderTree';
import { DocMode, DriveFile, MimeTypes, canEdit, viewable, inlineEditable } from '../utils';
import ContentPage from './ContentPage';
import ShortcutPage from './ContentPage/ShortcutPage';
import FileAction from './FileAction';
import FileBreadcrumb from './FileBreadcrumb';
import RightContainer from './RightContainer';

interface PageProps {
  docMode?: DocMode;
  versions?: boolean;
  driveId?: string;
}

export function HomePage(props: {}) {
  const dispatch = useDispatch();
  useMount(() => {
    const conf = getConfig();
    if (conf.REACT_APP_ROOT_DRIVE_ID) {
      dispatch(setDriveId(conf.REACT_APP_ROOT_DRIVE_ID));
      if (conf.REACT_APP_ROOT_ID) {
        dispatch(setRootFolderId(conf.REACT_APP_ROOT_ID));
      }
    } else {
      dispatch(setDriveId('root'));
    }
  });
  return <Page />;
}

function Page(props: PageProps) {
  const id = useUpdateSiderFromPath('id') || 'root';
  return <PageId key={id} id={id} {...props} />;
}

function PageId(props: PageProps & { id: string }) {
  const id = props.id;
  const { file, loading, error } = useFileMeta(id);
  const dispatch = useDispatch();
  const docMode = useSelector(selectDocMode(file?.mimeType ?? ''));
  const sidebarOpen = useSelector(selectSidebarOpen);
  console.log('Page id', id);

  useTitle((file) => {
    if (file) {
      const rootId = getConfig().REACT_APP_ROOT_ID;
      if (rootId && file?.id !== rootId) {
        return file.name;
      }
    }
    return undefined;
  }, file);

  function fullScreenMode(file: DriveFile) {
    if (!file?.mimeType) {
      return false;
    }
    return (
      (!viewable(file.mimeType) && file.mimeType !== MimeTypes.GoogleFolder && !sidebarOpen) ||
      (viewable(file.mimeType) && docMode && docMode !== 'view')
    );
  }

  const view = (file?: DriveFile) => {
    if (file?.mimeType && props.docMode !== docMode) {
      if (!props.docMode) {
        dispatch(resetDocMode(file.mimeType));
      } else {
        const newModes = {};
        newModes[file.mimeType!] = props.docMode;
        dispatch(setDocMode(newModes));
      }
    }

    return (
      <RightContainer>
        {file && (
          <>
            {fullScreenMode(file) ? (
              <Stack horizontal>
                <StackItem key="fileaction" grow={1}>
                  <FileAction file={file} key={file.id} allOverflow={true} />
                </StackItem>
                <StackItem key="breadcrumb" grow={11} styles={{ root: { fontSize: '16px' }}}>
                  <FileBreadcrumb file={file} />
                </StackItem>
              </Stack>
            ) : (
              <>
                <div style={{ paddingTop: '0.2rem', fontSize: '16px' }}>
                  <FileBreadcrumb file={file} />
                </div>
                <FileAction file={file} key={file.id} />
                <RecentChanges file={file} docMode={docMode} />
              </>
            )}
          </>
        )}
        {!file && loading && <InlineLoading description="Loading file metadata..." />}
        {!!error && error}
        {!error && <ContentPage file={file || { id }} versions={props.versions} />}
      </RightContainer>
    );
  };

  if (file?.mimeType === MimeTypes.GoogleShortcut) {
    return <ShortcutPage file={file} child={view} />;
  } else {
    return view(file);
  }
}

function RecentChanges({ file, docMode }: { file: DriveFile, docMode: DocMode }) {
  if ((docMode && docMode !== 'view') || file.mimeType === MimeTypes.GoogleFolder) {
    return null;
  }

  const hasVersions = file.mimeType && inlineEditable(file.mimeType) && canEdit(file);
  const changesSinceLastView =
    !file.viewedByMeTime || !file.modifiedTime || file.modifiedTime > file.viewedByMeTime;

  return (
    <>
      <hr />
      <div style={{ marginLeft: '1rem' }}>
        {!file.viewedByMe ? (
          <p>This is your first time viewing this file.</p>
        ) : (
          <p>
            {hasVersions && changesSinceLastView ? (
              <>
                <Link to={`/view/${file.id}/versions`}>View changes since your last view</Link>
                &nbsp;
                {dayjs(file.viewedByMeTime).fromNow()}.&nbsp;
                <span style={{ fontSize: '10pt' }}>
                  Requires the&nbsp;
                  <a href={browserExtensionUrl} target="_blank" rel="noreferrer">
                    browser extension
                  </a>
                  .
                </span>
              </>
            ) : changesSinceLastView ? (
              <span>
                There have been changes since your last view&nbsp;
                {dayjs(file.viewedByMeTime).fromNow()}.
              </span>
            ) : (
              <span>
                There are no changes to this file since your last view&nbsp;
                {dayjs(file.viewedByMeTime).fromNow()}.
              </span>
            )}
          </p>
        )}
      </div>
      <hr />
    </>
  );
}

function Reloader(props: PageProps) {
  const token = useSelector(selectPageReloadToken);
  return <Page key={token} {...props} />;
}

export default React.memo(Reloader);
