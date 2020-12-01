import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDocTree } from '../context/DocTree';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { SkeletonText } from 'carbon-components-react';
import { DriveIcon, Table } from '../components';
import { mdLink } from '../utils';
import { Launch16 } from '@carbon/icons-react';
import { useHistory } from 'react-router';

export interface IFolderPageProps {
  file: gapi.client.drive.File;
}

export default function FolderPage({ file }: IFolderPageProps) {
  // The content of the folder is simply loaded from the tree list.
  // TODO: A folder outside the tree is supplied?
  const docTree = useDocTree();

  const history = useHistory();

  const [subItems, setSubItems] = useState<gapi.client.drive.File[]>([]);

  useEffect(() => {
    const fileInTree = docTree.dataFlat?.[file.id ?? ''];
    if (!fileInTree) {
      return;
    }
    setSubItems([...fileInTree.children]);
  }, [file.id, docTree.dataFlat]);

  const columns = useMemo(() => {
    const r: IColumn[] = [
      {
        key: 'type',
        name: '',
        minWidth: 16,
        maxWidth: 16,
        onRender: (item: gapi.client.drive.File) => {
          const link = mdLink.parse(item.name);
          if (link) {
            return <Launch16 />;
          } else {
            return <DriveIcon src={item.iconLink} />;
          }
        },
      },
      {
        key: 'type',
        name: 'Name',
        minWidth: 200,
        isRowHeader: true,
        onRender: (item: gapi.client.drive.File) => {
          const link = mdLink.parse(item.name);
          if (link) {
            return link.title;
          } else {
            return item.name;
          }
        },
      },
      {
        key: 'create',
        name: 'Created At',
        minWidth: 100,
        onRender: (item: gapi.client.drive.File) => {
          return dayjs(item.createdTime).fromNow();
        },
      },
      {
        key: 'modify',
        name: 'Modified At',
        minWidth: 100,
        onRender: (item: gapi.client.drive.File) => {
          return dayjs(item.modifiedTime).fromNow();
        },
      },
    ];
    return r;
  }, []);

  const getKey = useCallback((file: gapi.client.drive.File) => {
    return file.id ?? '';
  }, []);

  const handleRowClick = useCallback(
    (file: gapi.client.drive.File) => {
      mdLink.handleFileLinkClick(history, file);
    },
    [history]
  );

  return (
    <div>
      {docTree.loading && <SkeletonText paragraph lineCount={10} />}
      {!docTree.loading && (
        <Table items={subItems} columns={columns} onRowClicked={handleRowClick} getKey={getKey} />
      )}
    </div>
  );
}
