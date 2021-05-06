import { InlineNotification } from 'carbon-components-react';
import React from 'react';
import { handleGapiError, showPrompt } from '../utils';

export function promptError(e) {
  showPrompt({
    title: 'Error',
    content: <InlineNotification hideCloseButton title={handleGapiError(e).message} kind="error" />,
  });
}
