import { Dispatch } from '@reduxjs/toolkit';
import { TextInput } from 'carbon-components-react';
import { History } from 'history';
import React from 'react';
import { updateFile } from '../reduxSlices/files';
import { showFormModal } from '../utils';
import { promptError } from './FileAction.utils';

export function showCreateFile(
  fileTypeName: string,
  mimeType: string,
  parentFolderId: string,
  dispatch: Dispatch<any>,
  history: History,
  reloadPage: () => void
) {
  showFormModal({
    modalHeading: `Create ${fileTypeName}`,
    selectorPrimaryFocus: `#name`,
    initialValues: {
      name: '',
    },
    submitButtonText: 'Create',
    submittingText: 'Creating...',
    submittedText: `${fileTypeName} created!`,
    submitFn: async ({ name }) => {
      try {
        const resp = await gapi.client.drive.files.create({
          supportsAllDrives: true,
          fields: '*',
          resource: {
            name,
            mimeType,
            parents: [parentFolderId],
          },
        });
        dispatch(updateFile(resp.result));
        history.push(`/view/${parentFolderId}`);
        reloadPage();
      } catch (e) {
        promptError(e);
        return false;
      }
    },
    renderForm: (state, hasSubmitted) => (
      <>
        <TextInput
          id="name"
          name="name"
          labelText="Name"
          value={state.values.name}
          invalidText={state.errors.name}
          invalid={Boolean(state.touched.name && state.errors.name)}
          disabled={hasSubmitted}
        />
      </>
    ),
    validateFn: ({ name }) => {
      let errors = {};
      if (!name) {
        errors['name'] = 'Required';
      }
      return errors;
    },
  });
}
