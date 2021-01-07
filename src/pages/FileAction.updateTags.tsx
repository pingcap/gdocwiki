import { Dispatch } from '@reduxjs/toolkit';
import { TextInput } from 'carbon-components-react';
import difference from 'lodash/difference';
import React from 'react';
import { updateFile } from '../reduxSlices/files';
import { DriveFile, extractTags, showFormModal, TAG_PROPERTY_PREFIX } from '../utils';
import { promptError } from './FileAction.utils';

export function showUpdateTags(
  currentFile: DriveFile,
  dispatch: Dispatch<any>,
  reloadPage: () => void
) {
  const currentTags = extractTags(currentFile);
  showFormModal({
    size: 'sm',
    modalHeading: `Update Tags`,
    selectorPrimaryFocus: `#tags`,
    initialValues: {
      tags: currentTags.join(', '),
    },
    submitButtonText: 'Update',
    submittingText: 'Updating tags...',
    submittedText: `Tags updated!`,
    submitFn: async ({ tags }) => {
      const newTags = tags.split(',').map((r) => r.trim());
      const tagsToAdd = difference(newTags, currentTags);
      const tagsToRemove = difference(currentTags, newTags);
      const properties = {};
      for (const tag of tagsToAdd) {
        properties[`${TAG_PROPERTY_PREFIX}${tag}`] = '';
      }
      for (const tag of tagsToRemove) {
        properties[`${TAG_PROPERTY_PREFIX}${tag}`] = null;
      }

      try {
        const resp = await gapi.client.drive.files.update({
          supportsAllDrives: true,
          fileId: currentFile.id!,
          fields: '*',
          resource: {
            properties,
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
          id="tags"
          name="tags"
          labelText={
            <span>
              Set tags for "<strong>{currentFile.name}</strong>"
            </span>
          }
          value={state.values.tags}
          disabled={hasSubmitted}
        />
        <div style={{ marginTop: 8 }}>
          <i>Use `,` to separate multiple tags.</i>
        </div>
      </>
    ),
  });
}
