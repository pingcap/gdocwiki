import { InlineLoading } from 'carbon-components-react';
import React from 'react';
import { FileListTable, Typography } from '../../components';
import useTitle from '../../hooks/useTitle';
import RightContainer from '../RightContainer';
import { escapeSearchQuery, useSearch } from './utils';

export default function SearchResult() {
  const result = useSearch('keyword', (v) => {
    const key = escapeSearchQuery(v);
    return `trashed = false and (name contains '${key}' or fullText contains '${key}')`;
  });

  useTitle((searchKeyword) => {
    return `Search: ${searchKeyword}`;
  }, result.value);

  return (
    <RightContainer>
      <div style={{ paddingTop: '15px' }}>
        <Typography.Title>Search: {result.value}</Typography.Title>
      </div>
      {(!result.loading || result.files.length > 0) && (
        <FileListTable files={result.files} openInNewWindow />
      )}
      {result.loading && <InlineLoading description={`Searching...`} />}
    </RightContainer>
  );
}
