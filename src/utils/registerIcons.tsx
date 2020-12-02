import {
  ChevronDown16,
  ChevronRight16,
  Launch16,
  Link16,
  OverflowMenuHorizontal16,
} from '@carbon/icons-react';
import googleDrive from '@iconify-icons/logos/google-drive';
import fileEdit from '@iconify-icons/mdi/file-edit';
import folderPlus from '@iconify-icons/mdi/folder-plus';
import { Icon } from '@iconify/react';
import { registerIcons as register } from 'office-ui-fabric-react';
import React from 'react';

export default function registerIcons() {
  register({
    icons: {
      More: <OverflowMenuHorizontal16 />,
      ChevronRight: <ChevronRight16 />,
      ChevronDown: <ChevronDown16 />,
      Launch: <Launch16 />,
      Link: <Link16 />,
      ColorGoogleDrive: <Icon icon={googleDrive} />,
      MdiFileEdit: <Icon icon={fileEdit} />,
      MdiFolderPlus: <Icon icon={folderPlus} />,
    },
  });
}
