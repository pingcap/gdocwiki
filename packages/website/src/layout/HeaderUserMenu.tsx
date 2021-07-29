import { Logout16 } from '@carbon/icons-react';
import googleIcon from '@iconify-icons/logos/google-icon';
import { Icon } from '@iconify/react';
import { Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import Avatar from 'react-avatar';
import { NavMenu } from '../components';
import { signIn, signOut } from '../utils';

export function HeaderUserMenu() {
  const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
  const profile = useMemo(() => {
    if (isSignedIn) {
      return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
    } else {
      return null;
    }
  }, [isSignedIn]);

  return (
    <NavMenu style={{ width: '16rem' }}>
      <NavMenu.Divider>Google Profile</NavMenu.Divider>
      {!isSignedIn && (
        <NavMenu.Link href="/auth/signin" onClick={signIn}>
          <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
            <Icon icon={googleIcon} />
            <span>Sign In with Google</span>
          </Stack>
        </NavMenu.Link>
      )}
      {isSignedIn && (
        <>
          <NavMenu.Link href="https://myaccount.google.com/profile">
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
              <Avatar name={profile!.getName()} src={profile!.getImageUrl()} size="30" round />
              <Stack tokens={{ childrenGap: 8 }}>
                <div>{profile!.getEmail()}</div>
                <div>{profile!.getName()}</div>
              </Stack>
            </Stack>
          </NavMenu.Link>
          <NavMenu.Link href="/auth/signout" onClick={signOut}>
            <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
              <Logout16 />
              <span>Sign Out</span>
            </Stack>
          </NavMenu.Link>
        </>
      )}
      <NavMenu.Divider>About Wiki</NavMenu.Divider>
      <NavMenu.Link href="https://github.com/pingcap/gdocwiki" target="_blank" rel="noreferrer">
        Powered by GdocWiki
      </NavMenu.Link>
      <NavMenu.Link
        href="https://github.com/pingcap/gdocwiki/graphs/contributors"
        target="_blank"
        rel="noreferrer"
      >
        Maintained by @breeswish, @gregwebs
      </NavMenu.Link>
    </NavMenu>
  );
}
