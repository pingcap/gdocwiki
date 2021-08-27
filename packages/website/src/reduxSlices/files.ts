import { createSlice, createSelector } from '@reduxjs/toolkit';
import naturalCompare from 'natural-compare-lite';
import { getConfig } from '../config';
import { DriveFile, getFileSortKey, driveToFolder, extractTagsIntoSet } from '../utils';

export interface FilesState {
  isLoading: boolean;
  error: Error | undefined;
  mapIdToFile: Record<string, DriveFile>;
  driveId: string | undefined;
  drive: DriveFile | undefined;
  drives: gapi.client.drive.Drive[];
}

const topConf = getConfig();

const initialState: FilesState = {
  isLoading: false,
  error: undefined,
  mapIdToFile: {},
  driveId: topConf.REACT_APP_ROOT_ID || topConf.REACT_APP_ROOT_DRIVE_ID,
  drive: undefined,
  drives: [],
};

function addFileToMap(state: FilesState, file: DriveFile) {
  state.mapIdToFile[file.id ?? ''] = file;
}

function setDriveId_(state: FilesState, driveId: string | undefined): boolean {
  if (driveId === state.driveId) {
    return false;
  }
  const conf = getConfig();
  const rootDriveId = conf.REACT_APP_ROOT_DRIVE_ID;
  if (rootDriveId && driveId === rootDriveId) {
    driveId = conf.REACT_APP_ROOT_ID || rootDriveId;
  }
  state.mapIdToFile = {};
  state.drive = undefined;
  state.driveId = driveId;
  return true;
}

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
    setDrives: (state, { payload }: { payload: DriveFile[] }) => {
      state.drives = payload.map(driveToFolder);
    },
    setDrive: (state, { payload }: { payload: DriveFile | undefined }) => {
      setDriveId_(state, payload?.id);
      state.drive = payload;
      if (payload) {
        addFileToMap(state, payload);
      }
    },
    setDriveId: (state, { payload }: { payload: string | undefined }) => {
      setDriveId_(state, payload);
    },
    updateFile: (state, { payload }: { payload: DriveFile }) => {
      addFileToMap(state, payload);
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
  setDrive,
  setDrives,
  setDriveId,
  setError,
  updateFile,
  updateFiles,
  removeFile,
} = slice.actions;

export const selectLoading = (state: { files: FilesState }) => state.files.isLoading;
export const selectDrive = (state: { files: FilesState }) => state.files.drive;
export const selectDrives = (state: { files: FilesState }) => state.files.drives;
export const selectDriveId = (state: { files: FilesState }) => state.files.driveId;
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
export const selectMapIdToChildren: (state: {
  files: FilesState;
}) => Record<string, DriveFile[]> = createSelector([selectMapIdToFile], (mapIdToFile) => {
  const map: Record<string, Set<string>> = {};

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
      const sortKeyA = getFileSortKey(a);
      const sortKeyB = getFileSortKey(b);
      if (sortKeyA !== sortKeyB) {
        return sortKeyA - sortKeyB;
      }
      return naturalCompare(a.name?.toLowerCase() ?? '', b.name?.toLowerCase() ?? '');
    });
  }

  return retMap;
});

export default slice.reducer;
