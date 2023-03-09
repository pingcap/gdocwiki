import googleDrive from '@iconify-icons/logos/google-drive';
import { Icon } from '@iconify/react';
import { useMount, useUnmount } from 'ahooks';
import { Button, InlineLoading, InlineNotification, TextInput } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getConfig } from '../config';
import { updateFile } from '../reduxSlices/files';
import { reloadPage } from '../reduxSlices/pageReload';
import {
  DriveFile,
  MimeTypes,
  ModalBody,
  ModalFooter,
  parseDriveLink,
  showConfirm,
  showFormModal,
  showModal,
  store,
} from '../utils';
import { googleAccessToken } from '../utils/google-auth';
import { promptError } from './FileAction.utils';

interface IMoveFileModalBodyProps {
  files: any[];
  targetFolderId: string;
  closeFn: () => void;
}

function MoveFileModalBody({ files, targetFolderId, closeFn }: IMoveFileModalBodyProps) {
  const [finished, setFinished] = useState(0);
  const isCancelled = useRef(false);
  const dispatch = useDispatch();

  useMount(async () => {
    let succeeded = 0;
    const errors: Error[] = [];

    for (const file of files) {
      try {
        let fileResponse: gapi.client.Response<DriveFile>;
        try {
          if (isCancelled.current) {
            return;
          }
          fileResponse = await gapi.client.drive.files.update({
            supportsAllDrives: true,
            fileId: file[google.picker.Document.ID],
            fields: '*',
            removeParents: file[google.picker.Document.PARENT_ID],
            addParents: targetFolderId,
            resource: {},
          });
          console.log('MoveFileModalBody files.update', fileResponse);
        } catch (firstError) {
          // If move is not possible, create shortcut instead.
          try {
            if (isCancelled.current) {
              return;
            }
            fileResponse = await gapi.client.drive.files.create({
              supportsAllDrives: true,
              fields: '*',
              resource: {
                name: file[google.picker.Document.NAME],
                mimeType: MimeTypes.GoogleShortcut,
                shortcutDetails: {
                  targetId: file[google.picker.Document.ID],
                },
                parents: [targetFolderId],
              },
            });
            console.log('MoveFileModalBody files.create', fileResponse);
          } catch (secondError) {
            // If shortcut creation failed, throw original error.
            throw firstError;
          }
        }

        succeeded++;
        dispatch(updateFile(fileResponse.result));
      } catch (e) {
        errors.push(e as Error);
      } finally {
        setFinished((f) => f + 1);
      }
    }

    // When everything is finished, reload current content to update the file list.
    if (succeeded > 0) {
      dispatch(reloadPage());
    }

    if (errors.length > 0) {
      // If there are errors during moving, display first error.
      closeFn();
      promptError(errors[0]);
      return;
    }

    // If there is no error, hold a while to display finished message.
    setTimeout(() => closeFn(), 1000);
  });

  useUnmount(() => {
    isCancelled.current = true;
  });

  let progress;

  if (finished < files.length) {
    progress = (
      <InlineLoading
        description={`Moving ${finished + 1} of ${files.length}: ${
          files[finished][google.picker.Document.NAME]
        }`}
        status="active"
      />
    );
  } else {
    progress = <InlineLoading description={`Move completed!`} status="finished" />;
  }

  return (
    <>
      <ModalBody>{progress}</ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={() => closeFn()} disabled={finished >= files.length}>
          Stop & Cancel
        </Button>
      </ModalFooter>
    </>
  );
}

export function showMoveFile(parentFolder: DriveFile) {
  function showPickFile() {
    gapi.load('picker', () => {
      const myDocsView = new google.picker.DocsView()
        .setParent('root')
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);
      myDocsView['setLabel']('My drive'); // Undocumented

      const sharedDocsView = new google.picker.DocsView()
        .setParent('sharedWithMe')
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);
      sharedDocsView['setLabel']('Shared with me'); // Undocumented

      const teamDocsView = new google.picker.DocsView()
        .setIncludeFolders(true)
        .setEnableTeamDrives(true)
        .setSelectFolderEnabled(true);

      const picker = new google.picker.PickerBuilder()
        .addView(myDocsView)
        .addView(sharedDocsView)
        .addView(teamDocsView)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .enableFeature(google.picker.Feature.SUPPORT_TEAM_DRIVES)
        .setOAuthToken(
          googleAccessToken?.access_token ?? ''
        )
        .setDeveloperKey(getConfig().REACT_APP_GAPI_KEY)
        .setCallback(async (data) => {
          if (data.action === google.picker.Action.PICKED && (data?.docs?.length ?? 0) > 0) {
            showModal({
              modalHeading: 'Moving Files In Progress',
              preventCloseOnClickOutside: true,
              danger: true,
              RenderBodyFooter: ({ close }) => (
                <MoveFileModalBody
                  files={data.docs}
                  targetFolderId={parentFolder.id!}
                  closeFn={close}
                />
              ),
            });
          }
          if (
            data.action === google.picker.Action.CANCEL ||
            data.action === google.picker.Action.PICKED
          ) {
            picker.dispose();
          }
        })
        .build();

      picker.setVisible(true);
    });
  }

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
        console.log('MoveFileModalBody files.get', respFile);

        const file = respFile.result;
        const fileKind = file.mimeType === MimeTypes.GoogleFolder ? 'Folder' : 'File';
        const confirm = await showConfirm({
          modalHeading: `Confirm Move ${fileKind}`,
          content: (
            <>
              <span>
                Are you sure want to move "<strong>{file.name}</strong>" into folder "
                <strong>{parentFolder.name}</strong>"?
                <br />
                <br />
                If you don't have the permission to move, a shortcut will be created.
              </span>
            </>
          ),
          submittedResult: true,
        });
        if (!confirm) {
          return false;
        }

        try {
          const movedFile = await gapi.client.drive.files.update({
            supportsAllDrives: true,
            fileId: file.id!,
            fields: '*',
            removeParents: file.parents?.[0],
            addParents: parentFolder.id,
            resource: {},
          });
          console.log('MoveFileModalBody files.update', movedFile);
          store.dispatch(updateFile(movedFile.result));
        } catch (eFirst) {
          // If move failed, create shortcut.
          try {
            const newShortcut = await gapi.client.drive.files.create({
              supportsAllDrives: true,
              fields: '*',
              resource: {
                name: file.name!,
                mimeType: MimeTypes.GoogleShortcut,
                shortcutDetails: {
                  targetId: file.id,
                },
                parents: [parentFolder.id!],
              },
            });
            console.log('MoveFileModalBody files.create', newShortcut);
            store.dispatch(updateFile(newShortcut.result));
          } catch (eSecond) {
            // If shortcut creation failed, display error for move file.
            throw eFirst;
          }
        }

        store.dispatch(reloadPage());
      } catch (e) {
        promptError(e);
        return false;
      }
    },
    RenderForm: ({ formProps, hasSubmitted, close }) => (
      <>
        {!parentFolder.capabilities?.canMoveChildrenOutOfTeamDrive && (
          <div style={{ marginBottom: '2rem' }}>
            <InlineNotification
              kind="warning"
              subtitle={
                <span>
                  Files moved into this folder cannot be moved out later due to administrator
                  settings.
                </span>
              }
              title="Note"
            />
          </div>
        )}
        <div style={{ marginBottom: '2rem' }}>
          <TextInput
            id="url"
            name="url"
            labelText="Paste Google Doc / Drive URL"
            placeholder="Example: https://docs.google.com/document/d/xxxxxxx/edit"
            value={formProps.values.url}
            invalidText={formProps.errors.url}
            invalid={Boolean(formProps.touched.url && formProps.errors.url)}
            disabled={hasSubmitted}
          />
        </div>
        <div>
          <Button
            kind="tertiary"
            onClick={() => {
              close();
              showPickFile();
            }}
            disabled={hasSubmitted}
          >
            <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
              <Icon icon={googleDrive} />
              <span>Pick a File</span>
            </Stack>
          </Button>
        </div>
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
