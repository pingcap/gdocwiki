import { FormLabel, TextInput } from 'carbon-components-react';
import difference from 'lodash/difference';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Tag } from '../components';
import { selectAllTags, updateFile } from '../reduxSlices/files';
import { reloadPage } from '../reduxSlices/pageReload';
import { DriveFile, extractTags, showFormModal, store, TAG_PROPERTY_PREFIX } from '../utils';
import { promptError } from './FileAction.utils';

function parseTags(tagInput: string): string[] {
  return tagInput
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
}

export function showUpdateTags(currentFile: DriveFile) {
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
      const newTags = parseTags(tags);
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
        store.dispatch(updateFile(resp.result));
        store.dispatch(reloadPage());
      } catch (e) {
        promptError(e);
        return false;
      }
    },
    RenderForm: ({ formProps, hasSubmitted }) => {
      const inputRef = useRef<HTMLInputElement>(null);
      const existingTags = useSelector(selectAllTags);
      const appendTag = useCallback(
        (tag: string) => {
          const tags = new Set(parseTags(formProps.values.tags));
          tags.add(tag);
          const r = Array.from(tags);
          r.sort();
          formProps.setFieldValue('tags', r.join(', '));
          inputRef.current?.focus();
        },
        [formProps]
      );

      return (
        <Stack tokens={{ childrenGap: 24 }}>
          <TextInput
            id="tags"
            name="tags"
            labelText={
              <span>
                Set tags for "<strong>{currentFile.name}</strong>"
              </span>
            }
            placeholder="Example: Tag1, Tag2"
            value={formProps.values.tags}
            disabled={hasSubmitted}
            helperText="Use `,` to separate multiple tags."
            ref={inputRef}
          />
          {existingTags.length > 0 && (
            <div>
              <FormLabel>Click to add existing tags</FormLabel>
              <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 4 }}>
                {existingTags.map((tag) => (
                  <Tag key={tag} text={tag} onClick={() => appendTag(tag)} />
                ))}
              </Stack>
            </div>
          )}
        </Stack>
      );
    },
  });
}
