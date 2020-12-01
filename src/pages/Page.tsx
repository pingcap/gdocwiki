import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DriveIcon, ShortcutIcon } from '../components';
import { useDocTree } from '../context/DocTree';
import { InlineLoading } from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { Breadcrumb, IBreadcrumbItem } from 'office-ui-fabric-react/lib/Breadcrumb';
import { useHistory } from 'react-router-dom';
import styles from './Page.module.scss';
import ContentPage from './ContentPage';
import useFileMeta from '../hooks/useFileMeta';

export default function Page() {
  const { id } = useParams<any>();
  const { file, loading, error } = useFileMeta(id);
  const history = useHistory();

  const docTree = useDocTree();

  // Build a breadcumb according to loaded tree data.
  const filePath = useMemo(() => {
    const paths: IBreadcrumbItem[] = [];

    if (!id) {
      return paths;
    }

    let iterateId = id;

    while (iterateId) {
      const currentItem = docTree.dataFlat?.[iterateId];
      if (!currentItem) {
        break;
      }
      if (!currentItem.name || !currentItem.id) {
        break;
      }

      let text: any = currentItem.name;
      if (iterateId === id) {
        text = (
          <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
            <span>{currentItem.name}</span>
            <DriveIcon file={currentItem} />
            {currentItem.mimeType === 'application/vnd.google-apps.shortcut' && <ShortcutIcon />}
          </Stack>
        );
      }

      // if (iterateId !== id) {
      paths.push({
        text,
        key: currentItem.id,
        onClick: () => history.push(`/view/${currentItem.id}`),
      });
      // }
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

    return paths.reverse();
  }, [docTree.dataFlat, history, id]);

  return (
    <div className={styles.contentContainer}>
      {filePath.length > 0 && <Breadcrumb items={filePath} />}
      {loading && <InlineLoading description="Loading..." />}
      {!loading && !!error && error}
      {!loading && !!file && <ContentPage file={file} />}
    </div>
  );
}
