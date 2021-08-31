import { createSlice, createSelector } from '@reduxjs/toolkit';
import naturalCompare from 'natural-compare-lite';
import { getConfig } from '../config';
import { DriveFile, getFileSortKey, driveToFolder, extractTagsIntoSet } from '../utils';

export interface FilesState {
  isLoading: boolean;
  error: Error | undefined;
  mapIdToFile: Record<string, DriveFile>;
  driveId: string | undefined;
  rootFolderId: string | undefined;
  drive: DriveFile | undefined;
  drives: gapi.client.drive.Drive[];
}

const initialState: FilesState = {
  isLoading: false,
  error: undefined,
  mapIdToFile: {},
  driveId: undefined,
  rootFolderId: undefined,
  drive: undefined,
  drives: [],
};

function addFileToMap(state: FilesState, file: DriveFile) {
  if (file.id) {
    state.mapIdToFile[file.id] = file;
  } else {
    console.warn('file has no id', file)
  }
}

let myDriveRootId = 'root';

function setDriveId_(state: FilesState, driveId: string | undefined): boolean {
  if (driveId === state.driveId) {
    return false;
  }
  const conf = getConfig();
  const rootDriveId = conf.REACT_APP_ROOT_DRIVE_ID;
  if (rootDriveId && driveId === rootDriveId) {
    state.rootFolderId = conf.REACT_APP_ROOT_ID;
  } else {
    state.rootFolderId = driveId;
  }

  state.drive = undefined;
  if (driveId === undefined) {
    state.driveId = myDriveRootId;
  } else {
    state.driveId = driveId;
  }

  return true;
}

const myDriveName = 'My Drive';

export const slice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setActiveFileId: (state, { payload }: { payload: string }) => {
      const file = state.mapIdToFile[payload];
      if (file) {
        setDriveId_(state, file.driveId);
      }
    },
    setLoading: (state, { payload }: { payload: boolean }) => {
      state.isLoading = payload;
    },
    setError: (state, { payload }: { payload: Error | undefined }) => {
      state.error = payload;
    },
    setDrives: (state, { payload }: { payload: DriveFile[] }) => {
      const myDrive1 = state.drives[0];
      state.drives = payload.map(driveToFolder);
      const myDrive2 = state.drives[0];
      if (myDrive1?.name === myDriveName && myDrive2?.name !== myDriveName) {
        state.drives.unshift(myDrive1);
      } else if (myDrive1?.name !== 'My Drive' && myDrive2?.name !== myDriveName) {
        console.debug('adding fake my drive', state.drives);
        // This will end up getting replaced with the real file in setDrive
        state.drives.unshift({
          id: 'root',
          name: 'My Drive',
        });
      }
    },
    setDrive: (state, { payload }: { payload: DriveFile | undefined }) => {
      if (payload && payload.name === myDriveName) {
        // update to the id from 'root' to the actual
        if (payload.id !== 'root' && state.drives[0]?.id !== 'root') {
          myDriveRootId = payload.id!;
          console.debug('adding real my drive', payload);
          if (state.drives[0]?.name === myDriveName) {
            state.drives[0] = payload;
          } else {
            state.drives.unshift(payload);
          }
        }
      }
      setDriveId_(state, payload?.id);
      if (state.drive?.id !== payload?.id || state.drive?.name !== payload?.name) {
        state.drive = payload;
      }
      if (payload) {
        addFileToMap(state, payload);
      }
    },
    setDriveId: (state, { payload }: { payload: string | undefined }) => {
      setDriveId_(state, payload);
    },
    setRootFolderId: (state, { payload }: { payload: string }) => {
      state.rootFolderId = payload;
    },
    updateFile: (state, { payload }: { payload: DriveFile }) => {
      if (payload.id && payload.parents === undefined && payload.name === 'Drive') {
        const drive = state.mapIdToFile[payload.id];
        if (!drive || drive.name === 'Drive') {
          addFileToMap(state, { ...payload, name: 'Loading Drive...' });
          return;
        }
        if (drive && drive.name !== 'Drive' && drive.name !== 'Loading Drive...') {
          return;
        }
      }
      addFileToMap(state, payload);
    },
    updateFiles: (state, { payload }: { payload: DriveFile[] }) => {
      for (const file of payload) {
        addFileToMap(state, file);
      }
    },
    removeFile: (state, { payload }: { payload: string }) => {
      delete state.mapIdToFile[payload];
    },
  },
});

export const {
  setActiveFileId,
  setLoading,
  setDrive,
  setDrives,
  setDriveId,
  setRootFolderId,
  setError,
  updateFile,
  updateFiles,
  removeFile,
} = slice.actions;

export const selectLoading = (state: { files: FilesState }) => state.files.isLoading;
export const selectDrive = (state: { files: FilesState }) => state.files.drive;
export const selectDrives = (state: { files: FilesState }) => state.files.drives;
export const selectDriveId = (state: { files: FilesState }) => state.files.driveId;
export const selectRootFolderId = (state: { files: FilesState }) => state.files.rootFolderId;
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
