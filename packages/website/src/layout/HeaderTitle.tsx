import { HeaderName } from 'carbon-components-react';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link, LinkProps } from 'react-router-dom';
import { getConfig } from '../config';
import { selectMapIdToFile } from '../reduxSlices/files';
import { selectRootFolderId } from '../reduxSlices/files';

function HeaderTitle_() {
  const mapIdToFile = useSelector(selectMapIdToFile);
  const rootId = useSelector(selectRootFolderId);
  const driveName = !rootId ? '' : mapIdToFile?.[rootId]?.name ?? '';
  const isMyDrive = rootId === 'root' || driveName === 'My Drive';
  const headerName = !driveName || isMyDrive ? '' : driveName;
  const prefix = getConfig().REACT_APP_NAME || 'Gdoc Wiki';
  const headerPrefix = headerName ? prefix + ': ' : prefix;
  const linkTo = rootId === undefined || isMyDrive ? '/' : `/view/${rootId}`;

  return (
    <HeaderName<LinkProps> prefix={headerPrefix} element={Link} to={linkTo}>
      {headerName}
    </HeaderName>
  );
}

export const HeaderTitle = React.memo(HeaderTitle_);
