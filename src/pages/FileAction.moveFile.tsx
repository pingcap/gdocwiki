import googleDrive from '@iconify-icons/logos/google-drive';
import { Icon } from '@iconify/react';
import { Dispatch } from '@reduxjs/toolkit';
import { Button, TextInput } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React from 'react';
import { DriveFile, updateFile } from '../reduxSlices/files';
import { MimeTypes, parseDriveLink, showConfirm, showFormModal, showPrompt } from '../utils';
import { promptError } from './FileAction.utils';

export function showMoveFile(
  parentFolder: DriveFile,
  dispatch: Dispatch<any>,
  reloadPage: () => void
) {
  showFormModal({
    size: 'sm',
    modalHeading: 'Import by Move',
    selectorPrimaryFocus: `#url`,
    initialValues: {
      url: '',
    },
    submitButtonText: 'Move',
    submittingText: 'Moving...',
    submittedText: `Move completed!`,
    submitFn: async ({ url }, helpers) => {
      if (!url) {
        helpers.setErrors({
          url: 'Required',
        });
        return false;
      }
      const id = parseDriveLink(url);
      if (!id) {
        // Unreachable?
        return false;
      }
      try {
        const respFile = await gapi.client.drive.files.get({
          supportsAllDrives: true,
          fileId: id,
          fields: '*',
        });
        console.log('files.get', respFile);

        const file = respFile.result;
        const fileKind = file.mimeType === MimeTypes.GoogleFolder ? 'Folder' : 'File';
        const confirm = await showConfirm({
          modalHeading: `Confirm Move ${fileKind}`,
          content: (
            <span>
              Are you sure want to move "<strong>{file.name}</strong>" into folder "
              <strong>{parentFolder.name}</strong>"?
            </span>
          ),
          submittedResult: true,
        });
        if (!confirm) {
          return false;
        }

        const movedFile = await gapi.client.drive.files.update({
          supportsAllDrives: true,
          fileId: file.id!,
          fields: '*',
          removeParents: file.parents?.[0],
          addParents: parentFolder.id,
          resource: {},
        });
        console.log('files.update', movedFile);

        dispatch(updateFile(movedFile.result));
        reloadPage();
      } catch (e) {
        promptError(e);
        return false;
      }
    },
    renderForm: (state, hasSubmitted, close) => (
      <>
        {/* <div style={{ marginBottom: '2rem' }}> */}
        <TextInput
          id="url"
          name="url"
          labelText="Paste Google Doc / Drive URL"
          placeholder="Example: https://docs.google.com/document/d/xxxxxxx/edit"
          value={state.values.url}
          invalidText={state.errors.url}
          invalid={Boolean(state.touched.url && state.errors.url)}
          disabled={hasSubmitted}
        />
        {/* </div>
        <div>
          <Button
            kind="tertiary"
            onClick={() => {
              close();
              // showPickFile();
            }}
            disabled={hasSubmitted}
          >
            <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
              <Icon icon={googleDrive} />
              <span>Pick a File</span>
            </Stack>
          </Button>
        </div> */}
      </>
    ),
    validateFn: ({ url }) => {
      let errors = {};
      if (url && !parseDriveLink(url)) {
        errors['url'] = 'Not a valid Google Drive or Google Doc URL';
      }
      return errors;
    },
  });
}
