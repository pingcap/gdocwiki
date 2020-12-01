import dayjs from 'dayjs';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import React from 'react';
import Avatar from 'react-avatar';

import styles from './LastModificationNote.module.scss';

export default function LastModificatioNote({ file }: { file: gapi.client.drive.File }) {
  return (
    <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }} className={styles.note}>
      <Avatar
        name={file.lastModifyingUser?.displayName}
        src={file.lastModifyingUser?.photoLink}
        size="20"
        round
      />
      <span>
        Last modified by {file.lastModifyingUser?.displayName} {dayjs(file.modifiedTime).fromNow()}
      </span>
    </Stack>
  );
}
