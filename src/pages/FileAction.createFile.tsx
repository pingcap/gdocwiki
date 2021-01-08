import { TextInput } from 'carbon-components-react';
import React from 'react';
import { updateFile } from '../reduxSlices/files';
import { reloadPage } from '../reduxSlices/pageReload';
import { history, showFormModal, store } from '../utils';
import { promptError } from './FileAction.utils';

export function showCreateFile(fileTypeName: string, mimeType: string, parentFolderId: string) {
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
        store.dispatch(updateFile(resp.result));
        history.push(`/view/${parentFolderId}`);
        store.dispatch(reloadPage());
      } catch (e) {
        promptError(e);
        return false;
      }
    },
    RenderForm: ({ formProps, hasSubmitted }) => (
      <>
        <TextInput
          id="name"
          name="name"
          labelText="Name"
          value={formProps.values.name}
          invalidText={formProps.errors.name}
          invalid={Boolean(formProps.touched.name && formProps.errors.name)}
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
