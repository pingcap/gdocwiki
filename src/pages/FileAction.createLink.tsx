import { TextInput } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React from 'react';
import { updateFile } from '../reduxSlices/files';
import { reloadPage } from '../reduxSlices/pageReload';
import { history, MimeTypes, showFormModal, store } from '../utils';
import { promptError } from './FileAction.utils';

export function showCreateLink(parentFolderId: string) {
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
        store.dispatch(updateFile(resp.result));
        history.push(`/view/${parentFolderId}`);
        store.dispatch(reloadPage());
      } catch (e) {
        promptError(e);
        return false;
      }
    },
    RenderForm: ({ formProps, hasSubmitted }) => (
      <Stack tokens={{ childrenGap: 24 }}>
        <TextInput
          id="name"
          name="name"
          labelText="Name"
          value={formProps.values.name}
          invalidText={formProps.errors.name}
          invalid={Boolean(formProps.touched.name && formProps.errors.name)}
          disabled={hasSubmitted}
        />
        <TextInput
          id="link"
          name="link"
          labelText="Link"
          placeholder="https://example.com"
          value={formProps.values.link}
          invalidText={formProps.errors.link}
          invalid={Boolean(formProps.touched.link && formProps.errors.link)}
          disabled={hasSubmitted}
        />
      </Stack>
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
