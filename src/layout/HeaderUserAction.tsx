import { UserAvatar20 } from '@carbon/icons-react';
import { HeaderGlobalAction } from 'carbon-components-react';
import React, { useMemo } from 'react';
import Avatar from 'react-avatar';
import { signIn, signOut } from '../utils';

function HeaderUserAction() {
  // TODO: Respond to sign in state change
  const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
  const profile = useMemo(() => {
    if (isSignedIn) {
      return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
    } else {
      return null;
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <HeaderGlobalAction aria-label="Sign In" onClick={signIn}>
        <UserAvatar20 />
      </HeaderGlobalAction>
    );
  } else {
    return (
      <HeaderGlobalAction aria-label="Sign Out" onClick={signOut}>
        <Avatar name={profile!.getName()} src={profile!.getImageUrl()} size="30" round />
      </HeaderGlobalAction>
    );
  }
}

export default React.memo(HeaderUserAction);
