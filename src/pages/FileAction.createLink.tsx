import { TextInput } from 'carbon-components-react';
import { History } from 'history';
import React, { Dispatch } from 'react';
import { updateFile } from '../reduxSlices/files';
import { MimeTypes, showFormModal } from '../utils';
import { promptError } from './FileAction.utils';

export function showCreateLink(
  parentFolderId: string,
  dispatch: Dispatch<any>,
  history: History,
  reloadPage: () => void
) {
  showFormModal({
    modalHeading: `Create Link`,
    selectorPrimaryFocus: `#name`,
    initialValues: {
      name: '',
      link: '',
    },
    submitButtonText: 'Create',
    submittingText: 'Creating link...',
    submittedText: `Link created!`,
    submitFn: async ({ name, link }) => {
      try {
        const resp = await gapi.client.drive.files.create({
          supportsAllDrives: true,
          fields: '*',
          resource: {
            name: `[${name}](${link})`,
            mimeType: MimeTypes.GoogleDocument,
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
        <TextInput
          id="link"
          name="link"
          labelText="Link"
          placeholder="https://example.com"
          value={state.values.link}
          invalidText={state.errors.link}
          invalid={Boolean(state.touched.link && state.errors.link)}
          disabled={hasSubmitted}
        />
      </>
    ),
    validateFn: ({ name, link }) => {
      let errors = {};
      if (!name) {
        errors['name'] = 'Required';
      }
      if (!link) {
        errors['link'] = 'Required';
      }
      return errors;
    },
  });
}
