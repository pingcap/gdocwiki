import { createSlice, createSelector } from '@reduxjs/toolkit';
import naturalCompare from 'natural-compare-lite';
import { DriveFile, extractTagsIntoSet } from '../utils';

export interface FilesState {
  isLoading: boolean;
  error: Error | undefined;
  mapIdToFile: Record<string, DriveFile>;
}

const initialState: FilesState = {
  isLoading: true,
  error: undefined,
  mapIdToFile: {},
};

export const slice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setLoading: (state, { payload }: { payload: boolean }) => {
      state.isLoading = payload;
    },
    setError: (state, { payload }: { payload: Error | undefined }) => {
      state.error = payload;
    },
    clearFileList: (state) => {
      state.mapIdToFile = {};
    },
    updateFile: (state, { payload }: { payload: DriveFile }) => {
      state.mapIdToFile[payload.id ?? ''] = payload;
    },
    updateFiles: (state, { payload }: { payload: DriveFile[] }) => {
      for (const file of payload) {
        state.mapIdToFile[file.id ?? ''] = file;
      }
    },
    removeFile: (state, { payload }: { payload: string }) => {
      delete state.mapIdToFile[payload];
    },
  },
});

export const {
  setLoading,
  setError,
  clearFileList,
  updateFile,
  updateFiles,
  removeFile,
} = slice.actions;

export const selectLoading = (state: { files: FilesState }) => state.files.isLoading;
export const selectError = (state: { files: FilesState }) => state.files.error;
export const selectMapIdToFile = (state: { files: FilesState }) => state.files.mapIdToFile;
export const selectAllTags = (state: { files: FilesState }) => {
  const tags = new Set<string>();
  for (const id in state.files.mapIdToFile) {
    const file = state.files.mapIdToFile[id];
    extractTagsIntoSet(file, tags);
  }
  const r = Array.from(tags.keys());
  r.sort();
  return r;
};

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
        const aLower = a.name?.toLowerCase() ?? '';
        const bLower = b.name?.toLowerCase() ?? '';

        // Show the readme file first
        const aReadme = aLower === 'readme';
        const bReadme = bLower === 'readme';
        if (aReadme && !bReadme) { return -1 }
        if (bReadme && !aReadme) { return 1 }

        // If a name begins with "." show it last
        const ahidden = (a.name?.[0] ?? '') == "."
        const bhidden = (b.name?.[0] ?? '') == "."
        if (ahidden && !bhidden) { return 1 }
        if (bhidden && !ahidden) { return -1 }

        // Compare as lower case
        return naturalCompare(aLower, bLower);
      });
    }

    return retMap;
  }
);

export default slice.reducer;
