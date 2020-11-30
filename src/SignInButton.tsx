import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Stack } from 'office-ui-fabric-react/lib/components/Stack';
import {
  Dialog,
  DialogType,
  DialogFooter,
  IDialogContentProps,
} from 'office-ui-fabric-react/lib/Dialog';
import { IModalProps } from 'office-ui-fabric-react/lib/Modal';
import React from 'react';
import GoogleButton from 'react-google-button';

const dialogContentProps: IDialogContentProps = {
  type: DialogType.close,
  title: 'Sign-in with Google',
};

const modalProps: IModalProps = {
  isBlocking: false,
};

export default function SignInDialog({ hidden }) {
  return (
    <Dialog hidden={hidden} dialogContentProps={dialogContentProps} modalProps={modalProps}>
      <Stack tokens={{ childrenGap: 32 }}>
        <div>Sign in with your Google account to access protected contents.</div>
        <div>
          <GoogleButton
            onClick={() => {
              console.log('Google button clicked');
            }}
          />
        </div>
        <DialogFooter>
          <DefaultButton text="Close" />
        </DialogFooter>
      </Stack>
    </Dialog>
  );
}
