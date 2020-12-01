import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MultiLineSkeleton } from '../components';
import { useDocTree } from '../context/DocTree';
import DocPage from './DocPage';
import { InlineNotification, NotificationActionButton } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import {
  Breadcrumb,
  IBreadcrumbItem,
  IDividerAsProps,
} from 'office-ui-fabric-react/lib/Breadcrumb';
import { ChevronRight20, OverflowMenuHorizontal20 } from '@carbon/icons-react';
import { useHistory } from 'react-router-dom';

import styles from './Page.module.scss';

function ErrorDisplay({ error }) {
  const handleSignIn = useCallback(() => {
    gapi.auth2.getAuthInstance().signIn();
  }, []);

  if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
    return (
      <InlineNotification
        kind="error"
        subtitle={
          <Stack tokens={{ childrenGap: 8 }} style={{ marginTop: 8 }}>
            <div>
              You are signed in with{' '}
              {gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail()}.
            </div>
            <div>Are you using the incorrect Google account, or typing a wrong URL?</div>
          </Stack>
        }
        title={`Failed to load content: ${error.message}`}
        hideCloseButton
      />
    );
  } else {
    return (
      <InlineNotification
        kind="error"
        actions={
          <NotificationActionButton onClick={handleSignIn}>Sign In</NotificationActionButton>
        }
        subtitle={<div style={{ marginTop: 8 }}>You may need to sign-in to view the content.</div>}
        title={`Failed to load content: ${error.message}`}
        hideCloseButton
      />
    );
  }
}

function _getCustomDivider(dividerProps: IDividerAsProps): JSX.Element {
  return <ChevronRight20 />;
}

function _getCustomOverflowIcon(): JSX.Element {
  return (
    <div>
      <OverflowMenuHorizontal20 />
    </div>
  );
}

export default function Page() {
  const { id } = useParams();
  const [file, setFile] = useState<gapi.client.drive.File | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const history = useHistory();

  const docTree = useDocTree();

  useEffect(() => {
    async function loadFileMetadata() {
      setIsLoading(true);
      setError(null);
      setFile(undefined);

      try {
        const respFile = await gapi.client.drive.files.get({
          supportsAllDrives: true,
          fileId: id,
          fields: '*',
        });
        console.log('files.get', id, respFile);
        setFile(respFile.result);
      } catch (e) {
        if (e?.result?.error) {
          setError(e.result.error);
        } else if (e.message) {
          setError(e);
        } else {
          console.log(e);
          setError(new Error('Unknown error'));
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (docTree.dataFlat?.[id] === undefined) {
      // This may happen when:
      // 1. User refresh the page, so that tree has not been loaded
      // 2. User clicks a doc which is out of the tree
      loadFileMetadata();
    } else {
      // If file is in the tree, and tree is already loaded, use that data directly.
      setIsLoading(false);
      setError(null);
      setFile(docTree.dataFlat[id]);
    }
  }, [id]);

  // Build a breadcumb according to loaded tree data.
  const filePath = useMemo(() => {
    const paths: IBreadcrumbItem[] = [];

    if (!file?.id) {
      return paths;
    }

    let iterateId = file.id;

    while (iterateId) {
      const currentItem = docTree.dataFlat?.[iterateId];
      if (!currentItem) {
        break;
      }
      if (!currentItem.name || !currentItem.id) {
        break;
      }
      // if (iterateId !== id) {
      paths.push({
        text: currentItem.name,
        key: currentItem.id,
        onClick: () => history.push(`/view/${currentItem.id}`),
      });
      // }
      if (!currentItem.parents) {
        break;
      }
      iterateId = currentItem.parents[0];
    }

    paths.push({
      text: 'Wiki Root',
      key: 'root',
      onClick: () => history.push(`/`),
    });

    return paths.reverse();
  }, [docTree.data, docTree.dataFlat, file]);

  let contentNode: React.ReactNode = null;
  if (!isLoading) {
    switch (file?.mimeType ?? '') {
      case 'application/vnd.google-apps.document':
        contentNode = <DocPage file={file!} />;
        break;
    }
  }

  return (
    <div className={styles.contentContainer}>
      {filePath.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Breadcrumb
            items={filePath}
            dividerAs={_getCustomDivider}
            onRenderOverflowIcon={_getCustomOverflowIcon}
          />
        </div>
      )}
      {isLoading && <MultiLineSkeleton />}
      {!isLoading && error && <ErrorDisplay error={error} />}
      {!isLoading && contentNode}
    </div>
  );
}
