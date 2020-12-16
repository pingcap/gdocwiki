import { Dispatch } from '@reduxjs/toolkit';
import { TextInput } from 'carbon-components-react';
import React from 'react';
import { DriveFile, updateFile } from '../reduxSlices/files';
import { showFormModal } from '../utils';
import { promptError } from './FileAction.utils';

export function showRenameFile(
  fileTypeName: string,
  currentFile: DriveFile,
  dispatch: Dispatch<any>,
  reloadPage: () => void
) {
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
        dispatch(updateFile(resp.result));
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
          labelText={
            <span>
              Rename "<strong>{currentFile.name}</strong>" to
            </span>
          }
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
