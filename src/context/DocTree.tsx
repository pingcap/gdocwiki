import { useMount } from 'ahooks';
import React, { useCallback, useContext, useMemo, useState } from 'react';

const RootDriveId = '0AIURj86T5hpoUk9PVA';

export interface IDocTree {
  loading: boolean;
  data?: IDocTreeItem[];
}

export interface IDocTreeItem extends gapi.client.drive.File {
  children: IDocTreeItem[];
}

const Ctx = React.createContext<IDocTree>({ loading: true });

export function DocTreeProvider({ children }) {
  const [docTreeIsLoading, setDocTreeIsLoading] = useState(true);
  const [docTreeData, setDocTreeData] = useState<IDocTreeItem[] | undefined>(undefined);

  const loadTreeData = useCallback(async () => {
    setDocTreeIsLoading(true);

    try {
      // FIXME: Support pagination
      const resp = await gapi.client.drive.files.list({
        corpora: 'drive',
        driveId: RootDriveId,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        pageSize: 500,
        q: 'trashed = false',
        fields: 'nextPageToken, files(name, id, parents, mimeType)',
      });

      console.log(resp);

      const itemsWithChildren: IDocTreeItem[] =
        resp.result.files?.map((file) => {
          return {
            ...file,
            children: [],
          };
        }) ?? [];
      const itemsByParent: Record<string, IDocTreeItem[]> = {};

      itemsWithChildren.forEach((file) => {
        if ((file.parents?.length ?? 0) === 0) {
          console.log('File does not have parents', file);
          return;
        }
        if (itemsByParent[file.parents![0]] === undefined) {
          itemsByParent[file.parents![0]] = [];
        }
        itemsByParent[file.parents![0]].push(file);
      });

      itemsWithChildren?.forEach((file) => {
        file.children = itemsByParent[file.id ?? ''] ?? [];
      });

      setDocTreeData(itemsByParent[RootDriveId] ?? []);
    } finally {
      setDocTreeIsLoading(false);
    }
  }, []);

  const docTree = useMemo(() => {
    return { data: docTreeData, loading: docTreeIsLoading } as IDocTree;
  }, [docTreeIsLoading, docTreeData]);

  useMount(() => {
    loadTreeData();
  });

  return <Ctx.Provider value={docTree}>{children}</Ctx.Provider>;
}

export function useDocTree() {
  return useContext(Ctx);
}
