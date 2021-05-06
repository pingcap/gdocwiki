import { Text } from 'office-ui-fabric-react';
import React from 'react';

export function Title({ children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Text variant="large">{children}</Text>
    </div>
  );
}

const Typography = {
  Title,
};

export default Typography;
