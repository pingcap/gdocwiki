import { Stack } from 'office-ui-fabric-react';
import React from 'react';
import { useSelector } from 'react-redux';
import { Tag, Typography } from '../../components';
import { selectAllTags } from '../../reduxSlices/files';
import RightContainer from '../RightContainer';

export function AllTagsList() {
  const existingTags = useSelector(selectAllTags);
  return (
    <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 4 }}>
      {existingTags.map((tag) => (
        <Tag.Link key={tag} text={tag} />
      ))}
    </Stack>
  );
}

export default function SearchAllTags() {
  return (
    <RightContainer>
      <Typography.Title>All Tags</Typography.Title>
      <AllTagsList />
    </RightContainer>
  );
}
