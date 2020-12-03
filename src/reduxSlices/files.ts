import { createSlice, createSelector } from '@reduxjs/toolkit';
import naturalCompare from 'natural-compare-lite';

export type DriveFile = gapi.client.drive.File;

export interface FilesState {
  isLoading: boolean;
  mapIdToFile: Record<string, DriveFile>;
}

const initialState: FilesState = {
  isLoading: true,
  mapIdToFile: {},
};

export const slice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setLoading: (state, { payload }: { payload: boolean }) => {
      state.isLoading = payload;
    },
    resetFromFileList: (state, { payload }: { payload: DriveFile[] }) => {
      const map: Record<string, DriveFile> = {};
      for (const file of payload) {
        map[file.id ?? ''] = file;
      }
      state.mapIdToFile = map;
    },
    updateFile: (state, { payload }: { payload: DriveFile }) => {
      state.mapIdToFile[payload.id ?? ''] = payload;
    },
    updateFiles: (state, { payload }: { payload: DriveFile[] }) => {
      for (const file of payload) {
        state.mapIdToFile[file.id ?? ''] = file;
      }
    },
  },
});

export const { setLoading, resetFromFileList, updateFile, updateFiles } = slice.actions;

export const selectLoading: (state: { files: FilesState }) => boolean = (state) =>
  state.files.isLoading;

export const selectMapIdToFile: (state: { files: FilesState }) => Record<string, DriveFile> = (
  state
) => state.files.mapIdToFile;

// A map to lookup all childrens for a file id.
export const selectMapIdToChildren: (state: any) => Record<string, DriveFile[]> = createSelector(
  [selectMapIdToFile],
  (mapIdToFile) => {
    const map: Record<string, Set<string>> = {};
    for (const id in mapIdToFile) {
      map[id] = new Set();
    }

    for (const id in mapIdToFile) {
      const file = mapIdToFile[id];
      const parentId = file.parents?.[0];
      if (!parentId) {
        continue;
      }
      if (map[parentId] === undefined) {
        // This may happen when parent is not in the tree.
        // We can still create a list for its children though.
        map[parentId] = new Set();
      }
      map[parentId].add(id);
    }

    const retMap: Record<string, DriveFile[]> = {};
    for (const id in map) {
      retMap[id] = [];
      for (const childId of map[id]) {
        retMap[id].push(mapIdToFile[childId]);
      }

      retMap[id].sort((a, b) => {
        return naturalCompare(a.name?.toLowerCase() ?? '', b.name?.toLowerCase() ?? '');
      });
    }

    return retMap;
  }
);

export default slice.reducer;
