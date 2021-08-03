import cx from 'classnames';
import { Breadcrumb, IBreadcrumbItem, Stack } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { DriveIcon, ShortcutIcon } from '../components';
import responsiveStyle from '../layout/responsive.module.scss';
import { selectMapIdToFile } from '../reduxSlices/files';
import { DriveFile, MimeTypes } from '../utils';
import styles from './FileBreadcrumb.module.scss';

export function CurrentFileBreadcrumbItem({ file }: { file: DriveFile }) {
  return (
    <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
      <span>{file.name}</span>
      <DriveIcon file={file} />
      {file.mimeType === MimeTypes.GoogleShortcut && <ShortcutIcon />}
    </Stack>
  );
}

function useFilePathBreadcrumb(file?: DriveFile) {
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
          text: (<CurrentFileBreadcrumbItem file={file} />) as any,
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
        text = (<CurrentFileBreadcrumbItem file={currentItem} />) as any;
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

export interface IFileBreadcrumbProps {
  file?: DriveFile;
  extraItems?: IBreadcrumbItem[];
}

function FileBreadcrumb({ file, extraItems }: IFileBreadcrumbProps) {
  const paths = useFilePathBreadcrumb(file);
  const items = useMemo(() => {
    const r = [...(paths ?? []), ...(extraItems ?? [])];
    if (r.length > 0) {
      delete r[r.length - 1].onClick;
    }
    return r;
  }, [paths, extraItems]);
  if ((items.length ?? 0) > 0) {
    return (
      <div style={{ marginLeft: '1rem' }}>
        <div className={responsiveStyle.hideInPhone}>
          <Breadcrumb items={items} style={{ marginTop: '2px', marginBottom: '0px' }} />
        </div>
        {Boolean(file) && (
          <div className={cx(responsiveStyle.showInPhone, styles.fileName)}>
            <CurrentFileBreadcrumbItem file={file!} />
          </div>
        )}
      </div>
    );
  } else {
    return null;
  }
}

export default React.memo(FileBreadcrumb);
