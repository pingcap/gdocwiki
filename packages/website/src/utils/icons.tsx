import {
  Add16,
  ArrowUp16,
  ChevronDown16,
  ChevronRight16,
  Edit16,
  Launch16,
  Link16,
  View16,
  Settings16,
  TrashCan16,
  WatsonHealthStackedMove16,
} from '@carbon/icons-react';
import googleDrive from '@iconify-icons/logos/google-drive';
import fileEdit from '@iconify-icons/mdi/file-edit';
import { Icon } from '@iconify/react';
import { registerIcons as register } from 'office-ui-fabric-react';

export function registerIcons() {
  register({
    icons: {
      ArrowUp: <ArrowUp16 />,
      ChevronRight: <ChevronRight16 />,
      ChevronDown: <ChevronDown16 />,
      Launch: <Launch16 />,
      Link: <Link16 />,
      Edit: <Edit16 />,
      Trash: <TrashCan16 />,
      View: <View16 />,
      Settings: <Settings16 />,
      Add: <Add16 />,
      StackedMove: <WatsonHealthStackedMove16 />,
      ColorGoogleDrive: <Icon icon={googleDrive} />,
      MdiFileEdit: <Icon icon={fileEdit} />,
    },
  });
}
