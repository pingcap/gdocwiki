import {
  Button,
  ButtonSet,
  Checkbox,
  Form,
  FormLabel,
  InlineLoading,
  RadioTile,
  TileGroup,
} from 'carbon-components-react';
import { Formik, FormikHelpers } from 'formik';
import isEqual from 'lodash/isEqual';
import { Stack } from 'office-ui-fabric-react';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateFile } from '../../reduxSlices/files';
import { reloadPage } from '../../reduxSlices/pageReload';
import {
  DriveFile,
  FOLDER_CHILDREN_SETTINGS_PROPERTY,
  parseFolderChildrenDisplaySettings,
} from '../../utils';
import { promptError } from '../FileAction.utils';
import styles from './Settings.childrenDisplay.module.scss';
import { ReactComponent as HideSvg } from './childrenDisplay_hide.svg';
import { ReactComponent as ListSvg } from './childrenDisplay_list.svg';
import { ReactComponent as TableSvg } from './childrenDisplay_table.svg';
import { SettingsTitle } from '.';

export default function SettingsChildrenDisplay({ file }: { file: DriveFile }) {
  const initialValues = parseFolderChildrenDisplaySettings(file);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = useCallback(
    async (values: typeof initialValues, helpers: FormikHelpers<typeof initialValues>) => {
      try {
        const resp = await gapi.client.drive.files.update({
          supportsAllDrives: true,
          fileId: file.id!,
          fields: '*',
          resource: {
            appProperties: {
              [FOLDER_CHILDREN_SETTINGS_PROPERTY]: JSON.stringify(values),
            },
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
    [file, dispatch]
  );

  return (
    <div>
      <SettingsTitle>Folder Children Display</SettingsTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {(props) => (
          <Form
            onSubmit={props.handleSubmit}
            onChange={props.handleChange}
            onBlur={props.handleBlur}
          >
            <Stack tokens={{ childrenGap: 24 }}>
              <fieldset>
                <FormLabel>Display folder children in sidebar</FormLabel>
                <Checkbox
                  labelText={`Show in sidebar`}
                  id="displayInSidebar"
                  checked={props.values.displayInSidebar}
                />
              </fieldset>
              <TileGroup
                valueSelected={props.values.displayInContent}
                name="displayInContent"
                legend="Display folder children in content"
                className={styles.tileGroup}
              >
                <RadioTile value="list">
                  <Stack tokens={{ childrenGap: 16 }}>
                    <div>As List</div>
                    <ListSvg width="150" />
                  </Stack>
                </RadioTile>
                <RadioTile value="table">
                  <Stack tokens={{ childrenGap: 16 }}>
                    <div>As Table</div>
                    <TableSvg width="150" />
                  </Stack>
                </RadioTile>
                <RadioTile value="hide">
                  <Stack tokens={{ childrenGap: 16 }}>
                    <div>Hide</div>
                    <HideSvg width="150" />
                  </Stack>
                </RadioTile>
              </TileGroup>
              {(!isEqual(props.values, props.initialValues) || hasSubmitted) && (
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
                      description={hasSubmitted ? 'Settings saved!' : 'Saving...'}
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
