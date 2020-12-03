import { Breadcrumb, IBreadcrumbItem, Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { DriveIcon, ShortcutIcon } from '../components';
import { selectMapIdToFile } from '../reduxSlices/files';
import { MimeTypes } from '../utils';

function LastBreadcrumbItem({ file }: { file: gapi.client.drive.File }) {
  return (
    <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
      <span>{file.name}</span>
      <DriveIcon file={file} />
      {file.mimeType === MimeTypes.GoogleShortcut && <ShortcutIcon />}
    </Stack>
  );
}

function useFilePathBreadcrumb(file?: gapi.client.drive.File) {
  const mapIdToFile = useSelector(selectMapIdToFile);
  const history = useHistory();

  return useMemo<IBreadcrumbItem[] | undefined>(() => {
    if (!file) {
      return undefined;
    }
    let paths: IBreadcrumbItem[] = [];

    if (!mapIdToFile?.[file.id ?? '']) {
      // File is not in the doc tree
      paths = [
        {
          text: (<LastBreadcrumbItem file={file} />) as any,
          key: file.id ?? '',
        },
      ];
      return paths;
    }

    let iterateId = file.id;

    while (iterateId) {
      const currentItem = mapIdToFile?.[iterateId];
      if (!currentItem) {
        break;
      }
      if (!currentItem.name || !currentItem.id) {
        break;
      }

      let text: any = currentItem.name;
      let onClick: any = () => history.push(`/view/${currentItem.id}`);
      if (iterateId === file.id) {
        text = (<LastBreadcrumbItem file={currentItem} />) as any;
        onClick = null;
      }
      paths.push({
        text,
        key: currentItem.id,
        onClick,
      });

      if (!currentItem.parents) {
        break;
      }
      iterateId = currentItem.parents[0];
    }

    // Only needed when rootId is a drive.
    // Another way is to get rootId and add into mapIdToFile. Then this is no longer needed.
    //
    // paths.push({
    //   text: 'Wiki Root',
    //   key: 'root',
    //   onClick: () => history.push(`/`),
    // });

    return paths.reverse();
  }, [file, mapIdToFile, history]);
}

function FileBreadcrumb({ file }: { file?: gapi.client.drive.File }) {
  const paths = useFilePathBreadcrumb(file);
  if ((paths?.length ?? 0) > 0) {
    return <Breadcrumb items={paths!} />;
  } else {
    return null;
  }
}

export default React.memo(FileBreadcrumb);
