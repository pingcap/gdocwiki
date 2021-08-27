import { HeaderName } from 'carbon-components-react';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link, LinkProps } from 'react-router-dom';
import { getConfig } from '../config';
import { selectMapIdToFile } from '../reduxSlices/files';
import { selectDriveId } from '../reduxSlices/files';

function HeaderTitle_() {
  const mapIdToFile = useSelector(selectMapIdToFile);
  const driveId = useSelector(selectDriveId);

  const appName = (() => {
    if (getConfig().REACT_APP_NAME) {
      return getConfig().REACT_APP_NAME;
    }
    return (
      mapIdToFile?.[driveId ?? '']?.name ?? mapIdToFile?.[getConfig().REACT_APP_ROOT_ID]?.name ?? ''
    );
  })();

  return (
    <HeaderName<LinkProps> prefix="Gdoc Wiki:" element={Link} to="/">
      {appName}
    </HeaderName>
  );
}

export const HeaderTitle = React.memo(HeaderTitle_);
