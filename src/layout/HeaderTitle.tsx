import { HeaderName } from 'carbon-components-react';
import React from 'react';
import config from '../config';
import { useDocTree } from '../context/DocTree';

function HeaderTitle() {
  const docTree = useDocTree();
  return (
    <HeaderName href="#" prefix="Gdoc Wiki:">
      {docTree.dataFlat?.[config.rootId].name ?? ''}
    </HeaderName>
  );
}

export default React.memo(HeaderTitle);
