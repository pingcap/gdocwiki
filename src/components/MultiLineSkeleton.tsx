import { SkeletonText } from 'carbon-components-react';
import React from 'react';

export default function MultiLineSkeleton() {
  return (
    <div>
      <SkeletonText heading />
      <SkeletonText paragraph lineCount={10} />
    </div>
  );
}
