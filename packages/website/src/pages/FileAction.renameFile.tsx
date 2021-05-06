import { TextInput } from 'carbon-components-react';
import React from 'react';
import { updateFile } from '../reduxSlices/files';
import { reloadPage } from '../reduxSlices/pageReload';
import { DriveFile, showFormModal, store } from '../utils';
import { promptError } from './FileAction.utils';

export function showRenameFile(fileTypeName: string, currentFile: DriveFile) {
  showFormModal({
    modalHeading: `Rename ${fileTypeName}`,
    selectorPrimaryFocus: `#name`,
    initialValues: {
      name: currentFile.name ?? '',
    },
    submitButtonText: 'Rename',
    submittingText: 'Renaming...',
    submittedText: `${fileTypeName} renamed!`,
    submitFn: async ({ name }) => {
      try {
        const resp = await gapi.client.drive.files.update({
          supportsAllDrives: true,
          fileId: currentFile.id!,
          fields: '*',
          resource: {
            name,
          },
        });
        store.dispatch(updateFile(resp.result));
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
          labelText={
            <span>
              Rename "<strong>{currentFile.name}</strong>" to
            </span>
          }
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
