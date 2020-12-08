import { UserAvatar20 } from '@carbon/icons-react';
import { HeaderGlobalAction } from 'carbon-components-react';
import React, { useMemo } from 'react';
import Avatar from 'react-avatar';

function HeaderUserAction({ toggleMenu }: { toggleMenu: () => void }) {
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
      <HeaderGlobalAction aria-label="Sign In" onClick={toggleMenu}>
        <UserAvatar20 />
      </HeaderGlobalAction>
    );
  } else {
    return (
      <HeaderGlobalAction aria-label="Sign Out" onClick={toggleMenu}>
        <Avatar name={profile!.getName()} src={profile!.getImageUrl()} size="30" round />
      </HeaderGlobalAction>
    );
  }
}

export default React.memo(HeaderUserAction);
