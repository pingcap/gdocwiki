import { InlineLoading } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React from 'react';
import { FileListTable, Typography } from '../../components';
import useTitle from '../../hooks/useTitle';
import { TAG_PROPERTY_PREFIX } from '../../utils';
import RightContainer from '../RightContainer';
import { AllTagsList } from './AllTags';
import { escapeSearchQuery, useSearch } from './utils';

export default function SearchTag() {
  const result = useSearch('tag', (tag) => {
    const key = `${TAG_PROPERTY_PREFIX}${escapeSearchQuery(tag)}`;
    console.log(key);
    return `trashed = false and properties has { key='${key}' and value='' }`;
  });

  useTitle(
    (tag) => {
      return `Tag: ${tag}`;
    },
    [result.value]
  );

  return (
    <RightContainer>
      <Stack tokens={{ childrenGap: 24 }}>
        <div>
          <Typography.Title>All Tags</Typography.Title>
          <AllTagsList />
        </div>
        <div>
          <Typography.Title>Tag: {result.value}</Typography.Title>
          {(!result.loading || result.files.length > 0) && (
            <FileListTable files={result.files} openInNewWindow />
          )}
          {result.loading && <InlineLoading description={`Searching...`} />}
        </div>
      </Stack>
    </RightContainer>
  );
}
