import { createSlice, createSelector } from '@reduxjs/toolkit';
import naturalCompare from 'natural-compare-lite';
import { getConfig } from '../config';
import { DriveFile, getFileSortKey, driveToFolder, extractTagsIntoSet } from '../utils';

export interface FilesState {
  isLoading: boolean;
  error: Error | undefined;
  driveId: string | undefined;
  rootFolderId: string | undefined;
  drive: DriveFile | undefined;
  // above is application state
  // below is data storage
  mapIdToFile: Record<string, DriveFile>;
  myDriveId: string | undefined;
  myDrive: DriveFile | undefined;
  drives?: DriveFile[];
}

const initialState: FilesState = {
  isLoading: false,
  error: undefined,
  mapIdToFile: {},
  driveId: undefined,
  rootFolderId: undefined,
  drive: undefined,
  myDriveId: undefined,
  myDrive: undefined,
  drives: undefined,
};

function addFileToMap(state: FilesState, file: DriveFile) {
  if (file.id) {
    state.mapIdToFile[file.id] = file;
  } else {
    console.warn('file has no id', file);
  }
}

function setDrive_(state: FilesState, drive: DriveFile | undefined) {
  if (drive) {
    addFileToMap(state, drive);
  }

  if (drive && drive.name === myDriveName) {
    console.log('setDrive MyDrive', drive);
    if (!state.myDrive) {
      state.myDrive = drive;
    }
    setDriveId_(state, 'root');
    // This lets us know that My drive is being used
    // The actual drive id is stored below as myDriveId
    if (drive.id !== 'root') {
      // update to the id from 'root' to the actual
      state.myDriveId = drive.id!;
    }
  } else {
    console.log('setDrive', drive);
    setDriveId_(state, drive?.id);
    if (state.drive?.id !== drive?.id) {
      state.drive = drive;
    }
  }
}

function setDriveId_(state: FilesState, driveId: string | undefined): boolean {
  if (driveId === state.driveId) {
    console.log('setDriveId_ unchanged', driveId);
    return false;
  }
  console.log('setDriveId_', driveId);

  state.driveId = driveId;
  state.rootFolderId = undefined;
  state.drive = driveFromId(state);

  const conf = getConfig();
  const rootDriveId = conf.REACT_APP_ROOT_DRIVE_ID;
  if (rootDriveId && state.driveId === rootDriveId) {
    state.rootFolderId = conf.REACT_APP_ROOT_ID;
  } else if (state.driveId === 'root') {
    state.rootFolderId = state.myDriveId;
  } else {
    state.rootFolderId = state.driveId;
  }

  return true;
}

function driveFromId(state: FilesState): DriveFile | undefined {
  if (!state.driveId) {
    return undefined;
  }

  for (const drive of state.drives ?? []) {
    if (drive.id === state.driveId) {
      return drive;
    }
  }

  if (state.driveId === state.myDriveId || state.driveId === 'root') {
    return getMyDrive(state);
  }
}

function getMyDrive(state: FilesState): DriveFile {
  return (
    state.myDrive ?? {
      id: 'root',
      name: 'My Drive',
    }
  );
}

function getDrives(state: FilesState): DriveFile[] {
  return [getMyDrive(state), ...(state.drives ?? [])];
}

const myDriveName = 'My Drive';

export const slice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setActiveFileId: (state, { payload }: { payload: string }) => {
      let file = state.mapIdToFile[payload];
      if (file) {
        while (file && !file.driveId) {
          if (file.name === 'My Drive') {
            console.log('setActiveFileId: found parent My Drive');
            setDrive_(state, file);
            return;
          }
          const parentId = file.parents?.[0];
          if (!parentId) {
            break;
          }
          file = state.mapIdToFile[parentId];
        }
      }
      if (file?.driveId) {
        console.log('setActiveFileId', file);
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
      state.drives = payload.map(driveToFolder);
      for (const drive of state.drives) {
        addFileToMap(state, drive);
      }
      if (state.driveId) {
        console.log('setDrives', state);
        setDrive_(state, driveFromId(state));
      }
    },

    setDrive: (state, { payload }: { payload: DriveFile | undefined }) => {
      setDrive_(state, payload);
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
export const selectMyDrive = (state: { files: FilesState }) => state.files.myDrive;
export const selectMyDriveId = (state: { files: FilesState }) => state.files.myDriveId;
export const selectDrives = (state: { files: FilesState }) => getDrives(state.files);
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
}) => Record<string, DriveFile[]> = createSelector(
  [selectMapIdToFile, selectMyDriveId],
  (mapIdToFile, myDriveId) => {
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
      if (parentId === myDriveId) {
        if (map['root'] === undefined) {
          map['root'] = new Set();
        }
        map['root'].add(id);
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
  }
);

export default slice.reducer;
