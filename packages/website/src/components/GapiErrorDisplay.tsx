import googleIcon from '@iconify-icons/logos/google-icon';
import { InlineIcon } from '@iconify/react';
import { InlineNotification, NotificationActionButton } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { handleGapiError, signIn } from '../utils';

function GapiErrorDisplay_({ error, subtitle }: { error: any; subtitle?: string }) {
  const e = useMemo(() => handleGapiError(error), [error]);
  const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();

  if (false) {
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
        title={`Failed to load content: ${e.message}`}
        hideCloseButton
      />
    );
  } else {
    return (
      <InlineNotification
        kind="error"
        actions={
          isSignedIn ? null : (
            <NotificationActionButton onClick={signIn}>
              <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
                <InlineIcon icon={googleIcon} />
                <span>Sign In</span>
              </Stack>
            </NotificationActionButton>
          )
        }
        subtitle={
          subtitle ||
          (isSignedIn ? (
            ''
          ) : (
            <div style={{ marginTop: 8 }}>You may need to sign-in to view the content.</div>
          ))
        }
        title={`Failed to load content: ${e.message}`}
        hideCloseButton
      />
    );
  }
}

export const GapiErrorDisplay = React.memo(GapiErrorDisplay_);
