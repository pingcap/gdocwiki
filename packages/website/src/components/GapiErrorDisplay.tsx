import googleIcon from '@iconify-icons/logos/google-icon';
import { InlineIcon } from '@iconify/react';
import { InlineNotification, NotificationActionButton } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { handleGapiError } from '../utils';
import { isUserSignedIn, signIn, userProfile } from '../utils/google-auth';

function GapiErrorDisplay_({ error, subtitle }: { error: any; subtitle?: string }) {
  const e = useMemo(() => handleGapiError(error), [error]);
  const isSignedIn = isUserSignedIn();

  if (false) {
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
