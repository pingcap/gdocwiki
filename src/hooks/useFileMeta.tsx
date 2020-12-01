import { InlineNotification, NotificationActionButton } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import React, { useEffect, useRef, useState } from 'react';
import { useDocTree } from '../context/DocTree';
import { signIn } from '../utils';

export interface IFileMeta {
  loading: boolean;
  file?: gapi.client.drive.File;
  error?: React.ReactNode;
}

function ErrorDisplay({ error }) {
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
        actions={<NotificationActionButton onClick={signIn}>Sign In</NotificationActionButton>}
        subtitle={<div style={{ marginTop: 8 }}>You may need to sign-in to view the content.</div>}
        title={`Failed to load content: ${error.message}`}
        hideCloseButton
      />
    );
  }
}

export default function useFileMeta(id?: string) {
  const [data, setData] = useState<IFileMeta>({ loading: true });

  const docTree = useDocTree();

  const reqRef = useRef(0);

  useEffect(() => {
    if (!id) {
      setData({ loading: true });
      return;
    }

    async function loadFileMetadata(checkpoint: number) {
      setData({ loading: true });

      try {
        const respFile = await gapi.client.drive.files.get({
          supportsAllDrives: true,
          fileId: id!,
          fields: '*',
        });
        if (reqRef.current === checkpoint) {
          // If another request is performed, simply ignore this result.
          // This may happen when id changes very frequently
          setData({ loading: false, file: respFile.result });
        }
      } catch (e) {
        if (reqRef.current === checkpoint) {
          if (e?.result?.error) {
            setData((d) => ({ ...d, error: <ErrorDisplay error={e.result.error} /> }));
          } else if (e.message) {
            setData((d) => ({ ...d, error: <ErrorDisplay error={e} /> }));
          } else {
            console.log(e);
            setData((d) => ({ ...d, error: <ErrorDisplay error={new Error('Unknown error')} /> }));
          }
        }
      } finally {
        if (reqRef.current === checkpoint) {
          setData((d) => ({ ...d, loading: false }));
        }
      }
    }

    // If data is available in the doc tree, use it directly.
    if (docTree.dataFlat?.[id] === undefined) {
      reqRef.current++;
      loadFileMetadata(reqRef.current);
    } else {
      setData({ loading: false, file: docTree.dataFlat[id] });
    }

    // Ignore docTree.dataFlat change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return data;
}
