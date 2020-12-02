import { useMount } from 'ahooks';
import React, { useCallback, useContext, useState } from 'react';
import config from '../config';

// This context provides data about the loaded doc tree.
//
// This actually act as a cache. Maybe rename it is better?

export interface IDocTree {
  loading: boolean;
  // All items, in tree form
  data?: IDocTreeItem[];
  // All items, in flat form
  dataFlat?: Record<string, IDocTreeItem>;
}

export interface IDocTreeItem extends gapi.client.drive.File {
  children: IDocTreeItem[];
}

const Ctx = React.createContext<IDocTree>({ loading: true });

export function DocTreeProvider({ children }) {
  const [data, setData] = useState<IDocTree>({ loading: true });

  const loadTreeData = useCallback(async () => {
    setData((currentData) => ({ ...currentData, loading: true }));

    try {
      // FIXME: Support pagination
      const resp = await gapi.client.drive.files.list({
        corpora: 'drive',
        driveId: config.rootDriveId,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        pageSize: 500,
        q: 'trashed = false',
        fields:
          'nextPageToken, files(name, id, parents, mimeType, modifiedTime, createdTime, lastModifyingUser(displayName, photoLink), iconLink, webViewLink, shortcutDetails, capabilities/canAddChildren)',
      });
      console.log('files.list', config.rootDriveId, resp);

      const itemsWithChildren: IDocTreeItem[] =
        resp.result.files?.map((file) => {
          return {
            ...file,
            children: [],
          };
        }) ?? [];
      const itemsByParent: Record<string, IDocTreeItem[]> = {};
      const allItems: Record<string, IDocTreeItem> = {};

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

      itemsWithChildren?.forEach((file) => {
        allItems[file.id ?? ''] = file;
      });

      setData((currentData) => ({
        ...currentData,
        data: itemsByParent[config.rootId] ?? [],
        dataFlat: allItems,
      }));
    } catch (e) {
      console.log(e);
    } finally {
      setData((currentData) => ({ ...currentData, loading: false }));
    }
  }, []);

  useMount(() => {
    // Only load tree data once when webpage is loaded. There is no need to reload
    // in other scenarios.
    loadTreeData();
  });

  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useDocTree() {
  return useContext(Ctx);
}
