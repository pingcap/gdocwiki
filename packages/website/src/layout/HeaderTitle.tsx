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

  const appName = (() => {
    if (getConfig().REACT_APP_NAME) {
      return getConfig().REACT_APP_NAME;
    }
    return !rootId ? '' : mapIdToFile?.[rootId]?.name ?? '';
  })();

  return (
    <HeaderName<LinkProps> prefix="Gdoc Wiki:" element={Link} to="/">
      {appName}
    </HeaderName>
  );
}

export const HeaderTitle = React.memo(HeaderTitle_);
