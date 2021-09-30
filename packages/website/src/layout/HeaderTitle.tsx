import { HeaderName } from 'carbon-components-react';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link, LinkProps } from 'react-router-dom';
import { getConfig } from '../config';
import { selectDriveId, selectMapIdToFile, selectRootFolderId } from '../reduxSlices/files';

function HeaderTitle_() {
  const mapIdToFile = useSelector(selectMapIdToFile);
  const rootId = useSelector(selectRootFolderId);
  const driveId = useSelector(selectDriveId);
  const driveName = !rootId ? '' : mapIdToFile?.[rootId]?.name ?? '';
  const conf = getConfig();
  const appName = conf.APP_NAME;
  const confDriveId = conf.REACT_APP_ROOT_DRIVE_ID;
  const isConfiguredDrive = confDriveId && confDriveId === driveId;

  if (isConfiguredDrive) {
    const locationName = conf.REACT_APP_NAME || driveName;

    return (
      <>
        <HeaderName<LinkProps> prefix={appName + ':'} element={Link} to="/">
          {locationName}
        </HeaderName>
      </>
    );
  } else {
    const isMyDrive = driveId === 'root' || driveName === 'My Drive';
    const linkTo = driveId === undefined || isMyDrive ? '/' : `/view/${rootId ?? driveId}`;
    return (
      <>
        <HeaderName<LinkProps> prefix="" key="app-name" element={Link} to="/">
          {appName}
        </HeaderName>
        {driveName && (
          <HeaderName<LinkProps> prefix="" key="location-name" element={Link} to={linkTo}>
            {driveName}
          </HeaderName>
        )}
      </>
    );
  }
}

export const HeaderTitle = React.memo(HeaderTitle_);
