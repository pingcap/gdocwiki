import { HeaderName } from 'carbon-components-react';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link, LinkProps } from 'react-router-dom';
import { getConfig } from '../config';
import { selectMapIdToFile } from '../reduxSlices/files';

function HeaderTitle() {
  const mapIdToFile = useSelector(selectMapIdToFile);

  const appName = (() => {
    if (getConfig().REACT_APP_NAME) {
      return getConfig().REACT_APP_NAME;
    }
    return mapIdToFile?.[getConfig().REACT_APP_ROOT_ID]?.name ?? '';
  })();

  return (
    <HeaderName<LinkProps> prefix="Gdoc Wiki:" element={Link} to="/">
      {appName}
    </HeaderName>
  );
}

export default React.memo(HeaderTitle);
