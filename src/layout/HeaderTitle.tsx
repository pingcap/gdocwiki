import { HeaderName } from 'carbon-components-react';
import React from 'react';
import { useSelector } from 'react-redux';
import config from '../config';
import { selectMapIdToFile } from '../reduxSlices/files';

function HeaderTitle() {
  const mapIdToFile = useSelector(selectMapIdToFile);
  return (
    <HeaderName href="#" prefix="Gdoc Wiki:">
      {mapIdToFile?.[config.rootId]?.name ?? ''}
    </HeaderName>
  );
}

export default React.memo(HeaderTitle);
