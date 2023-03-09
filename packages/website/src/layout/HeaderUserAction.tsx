import { UserAvatar20 } from '@carbon/icons-react';
import { HeaderGlobalAction } from 'carbon-components-react';
import React, { useMemo } from 'react';
import Avatar from 'react-avatar';
import { isUserSignedIn, userProfile } from '../utils/google-auth';

function HeaderUserAction_() {
  // TODO: Respond to sign in state change
  const isSignedIn = isUserSignedIn();
  const profile = useMemo(() => {
    if (isSignedIn) {
      return userProfile;
    } else {
      return null;
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <HeaderGlobalAction aria-label="Sign In">
        <UserAvatar20 />
      </HeaderGlobalAction>
    );
  } else {
    return (
      <HeaderGlobalAction aria-label="Sign Out">
        <Avatar name={profile?.name} src={profile?.picture} size="30" round />
      </HeaderGlobalAction>
    );
  }
}

export const HeaderUserAction = React.memo(HeaderUserAction_);
