import { ChevronRight16, Edit16, Launch16, OverflowMenuHorizontal16 } from '@carbon/icons-react';
import googleDrive from '@iconify-icons/logos/google-drive';
import { Icon } from '@iconify/react';
import { registerIcons as register } from 'office-ui-fabric-react';
import React from 'react';

export default function registerIcons() {
  register({
    icons: {
      More: <OverflowMenuHorizontal16 />,
      ChevronRight: <ChevronRight16 />,
      Edit: <Edit16 />,
      Launch: <Launch16 />,
      GoogleDrive: <Icon icon={googleDrive} />,
    },
  });
}
