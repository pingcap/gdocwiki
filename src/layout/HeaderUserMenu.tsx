import { Logout16 } from '@carbon/icons-react';
import googleIcon from '@iconify-icons/logos/google-icon';
import { Icon } from '@iconify/react';
import { Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import Avatar from 'react-avatar';
import { NavMenu } from '../components';
import { signIn, signOut } from '../utils';

export default function HeaderUserMenu() {
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
      <NavMenu.Divider>{isSignedIn ? profile!.getEmail() : 'Account'}</NavMenu.Divider>
      {!isSignedIn && (
        <NavMenu.Link href="javascript:;" onClick={signIn}>
          <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
            <Icon icon={googleIcon} />
            <span>Sign In with Google</span>
          </Stack>
        </NavMenu.Link>
      )}
      {isSignedIn && (
        <>
          <div style={{ paddingTop: 8, paddingBottom: 16 }}>
            <Stack
              verticalAlign="center"
              horizontalAlign="center"
              horizontal
              tokens={{ childrenGap: 8 }}
            >
              <Avatar name={profile!.getName()} src={profile!.getImageUrl()} size="30" round />
              <div>{profile!.getName()}</div>
            </Stack>
          </div>
          <NavMenu.Link href="javascript:;" onClick={signOut}>
            <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
              <Logout16 />
              <span>Sign Out</span>
            </Stack>
          </NavMenu.Link>
        </>
      )}
      <NavMenu.Divider>About Wiki</NavMenu.Divider>
      <NavMenu.Link href="https://github.com/pingcap/gdocwiki" target="_blank">
        Powered by GdocWiki
      </NavMenu.Link>
      <NavMenu.Link href="https://github.com/pingcap/gdocwiki/graphs/contributors" target="_blank">
        Made by @breeswish, @Hexilee
      </NavMenu.Link>
    </NavMenu>
  );
}
