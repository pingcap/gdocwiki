import { IBreadcrumbItem, Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { DriveIcon, ShortcutIcon } from '../components';
import { useDocTree } from '../context/DocTree';

export interface IFilePathBreadcrumb {
  loading: boolean;
  paths?: IBreadcrumbItem[];
}

function LastBreadcrumbItem({ file }: { file: gapi.client.drive.File }) {
  return (
    <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
      <span>{file.name}</span>
      <DriveIcon file={file} />
      {file.mimeType === 'application/vnd.google-apps.shortcut' && <ShortcutIcon />}
    </Stack>
  );
}

export default function useFilePathBreadcrumb(
  file?: gapi.client.drive.File,
  fileIsLoading?: boolean
) {
  const docTree = useDocTree();
  const history = useHistory();

  return useMemo<IFilePathBreadcrumb>(() => {
    if (docTree.loading || fileIsLoading) {
      return { loading: true };
    }
    if (!file) {
      return { loading: false };
    }
    let paths: IBreadcrumbItem[] = [];

    if (!docTree.dataFlat?.[file.id ?? '']) {
      // File is not in the doc tree
      paths = [
        {
          text: (<LastBreadcrumbItem file={file} />) as any,
          key: file.id ?? '',
        },
      ];
      return { loading: false, paths };
    }

    let iterateId = file.id;

    while (iterateId) {
      const currentItem = docTree.dataFlat?.[iterateId];
      if (!currentItem) {
        break;
      }
      if (!currentItem.name || !currentItem.id) {
        break;
      }

      let text: any = currentItem.name;
      if (iterateId === file.id) {
        text = (<LastBreadcrumbItem file={currentItem} />) as any;
      }
      paths.push({
        text,
        key: currentItem.id,
        onClick: () => history.push(`/view/${currentItem.id}`),
      });

      if (!currentItem.parents) {
        break;
      }
      iterateId = currentItem.parents[0];
    }

    paths.push({
      text: 'Wiki Root',
      key: 'root',
      onClick: () => history.push(`/`),
    });

    return { loading: false, paths: paths.reverse() };
  }, [file, fileIsLoading, docTree.loading, docTree.dataFlat, history]);
}
