import { HeaderName } from 'carbon-components-react';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link, LinkProps } from 'react-router-dom';
import config from '../config';
import { selectMapIdToFile } from '../reduxSlices/files';

function HeaderTitle() {
  const mapIdToFile = useSelector(selectMapIdToFile);
  return (
    <HeaderName<LinkProps> prefix="Gdoc Wiki:" element={Link} to="/">
      {mapIdToFile?.[config.REACT_APP_ROOT_ID]?.name ?? ''}
    </HeaderName>
  );
}

export default React.memo(HeaderTitle);
