import {
  Button,
  ButtonSet,
  Form,
  FormLabel,
  InlineLoading,
  TextInput,
} from 'carbon-components-react';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import difference from 'lodash/difference';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tag, Typography } from '../../components';
import { selectAllTags, updateFile } from '../../reduxSlices/files';
import { reloadPage } from '../../reduxSlices/pageReload';
import { DriveFile, extractTags, TAG_PROPERTY_PREFIX } from '../../utils';
import { promptError } from '../FileAction.utils';

function parseTags(tagInput: string): string[] {
  return tagInput
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
}

export default function SettingsTag({ file }: { file: DriveFile }) {
  const currentTags = useMemo(() => extractTags(file), [file]);
  const initialValues = useMemo(() => ({ tags: currentTags.join(', ') }), [currentTags]);
  const dispatch = useDispatch();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = useCallback(
    async (values: typeof initialValues, helpers: FormikHelpers<typeof initialValues>) => {
      const newTags = parseTags(values.tags);
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
          fileId: file.id!,
          fields: '*',
          resource: {
            properties,
          },
        });
        dispatch(updateFile(resp.result));
        setHasSubmitted(true);
        setTimeout(() => {
          setHasSubmitted(false);
          dispatch(reloadPage());
        }, 1000);
      } catch (e) {
        promptError(e);
        return;
      } finally {
        helpers.setSubmitting(false);
      }
    },
    [currentTags, file, dispatch]
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const existingTags = useSelector(selectAllTags);
  const appendTag = useCallback((props: FormikProps<typeof initialValues>, tag: string) => {
    const tags = new Set(parseTags(props.values.tags));
    tags.add(tag);
    const r = Array.from(tags);
    r.sort();
    props.setFieldValue('tags', r.join(', '));
    inputRef.current?.focus();
  }, []);

  return (
    <div>
      <Typography.Title>Tags</Typography.Title>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {(props) => (
          <Form
            onSubmit={props.handleSubmit}
            onChange={props.handleChange}
            onBlur={props.handleBlur}
          >
            <Stack tokens={{ childrenGap: 24 }}>
              <TextInput
                id="tags"
                name="tags"
                labelText={
                  <span>
                    Set tags for "<strong>{file.name}</strong>"
                  </span>
                }
                placeholder="Example: Tag1, Tag2"
                value={props.values.tags}
                disabled={props.isSubmitting || hasSubmitted}
                helperText="Use `,` to separate multiple tags."
                ref={inputRef}
              />
              {existingTags.length > 0 && (
                <div>
                  <FormLabel>Click to add existing tags</FormLabel>
                  <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 4 }}>
                    {existingTags.map((tag) => (
                      <Tag key={tag} text={tag} onClick={() => appendTag(props, tag)} />
                    ))}
                  </Stack>
                </div>
              )}
              {(props.values.tags !== props.initialValues.tags || hasSubmitted) && (
                <ButtonSet>
                  <Button
                    size="small"
                    kind="secondary"
                    onClick={() => {
                      props.handleReset();
                      setHasSubmitted(false);
                    }}
                    disabled={props.isSubmitting || hasSubmitted}
                  >
                    Cancel
                  </Button>
                  {props.isSubmitting || hasSubmitted ? (
                    <InlineLoading
                      status={hasSubmitted ? 'finished' : 'active'}
                      description={hasSubmitted ? 'Updated!' : 'Updating tags...'}
                    />
                  ) : (
                    <Button size="small" kind="primary" type="submit" disabled={props.isSubmitting}>
                      Save
                    </Button>
                  )}
                </ButtonSet>
              )}
            </Stack>
          </Form>
        )}
      </Formik>
    </div>
  );
}
