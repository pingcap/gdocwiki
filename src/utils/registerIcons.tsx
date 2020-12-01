import { ChevronRight16, Edit16, Launch16, OverflowMenuHorizontal16 } from '@carbon/icons-react';
import { registerIcons as register } from 'office-ui-fabric-react/lib/Styling';
import React from 'react';

export default function registerIcons() {
  register({
    icons: {
      More: <OverflowMenuHorizontal16 />,
      ChevronRight: <ChevronRight16 />,
      Edit: <Edit16 />,
      Launch: <Launch16 />,
    },
  });
}
