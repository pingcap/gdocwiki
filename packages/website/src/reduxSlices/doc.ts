import { createSlice } from '@reduxjs/toolkit';
import { DriveFile, MimeTypePreferredDisplay } from '../utils';
import { DocHeader, TreeHeading } from '../utils/docHeaders';
import { MimeTypes } from '../utils/gapi';

export interface DriveLink {
  driveLink: string;
  linkText: string;
  wikiLink: string;
  id: string;
  file?: DriveFile;
}

export interface DocState {
  file: DriveFile | null;
  modes: MimeTypePreferredDisplay;
  headers?: (TreeHeading | DocHeader)[];
  comments: gapi.client.drive.Comment[];
  driveLinks: DriveLink[];
}

let mimeTypePreferredDisplay: MimeTypePreferredDisplay = {};
mimeTypePreferredDisplay[MimeTypes.GoogleDocument] = 'view';
mimeTypePreferredDisplay[MimeTypes.GoogleSpreadsheet] = 'preview';

const initialStateDoc: DocState = {
  modes: mimeTypePreferredDisplay,
  file: null,
  headers: [],
  comments: [],
  driveLinks: [],
};

export const slice = createSlice({
  name: 'doc',
  initialState: initialStateDoc,
  reducers: {
    setDocMode: (state, { payload }: { payload: MimeTypePreferredDisplay }) => {
      state.modes = Object.assign(state.modes, payload);
    },
    resetDocMode: (state, { payload }: { payload: string }) => {
      const newModes = {};
      newModes[payload] = mimeTypePreferredDisplay[payload];
      state.modes = Object.assign(state.modes, newModes);
    },
    setFile: (state, { payload }: { payload: DriveFile }) => {
      state.file = payload;
    },
    setNoFile: (state, { payload }: { payload: undefined }) => {
      state.file = null;
    },
    setHeaders: (state, { payload }: { payload: (TreeHeading | DocHeader)[] }) => {
      state.headers = payload;
    },
    setComments: (state, { payload }: { payload: gapi.client.drive.Comment[] }) => {
      state.comments = payload;
    },
    setDriveLinks: (state, { payload }: { payload: DriveLink[] }) => {
      state.driveLinks = payload;
    },
  },
});

export const {
  setDocMode,
  resetDocMode,
  setFile,
  setNoFile,
  setHeaders,
  setComments,
  setDriveLinks,
} = slice.actions;

export const selectHeaders = (state: { doc: DocState }) => state.doc.headers;
export const selectComments = (state: { doc: DocState }) => state.doc.comments;
export const selectDriveFile = (state: { doc: DocState }) => state.doc.file;
export const selectDriveLinks = (state: { doc: DocState }) => state.doc.driveLinks;
export const selectDocMode = (mimeType: string) => {
  return (state: { doc: DocState }) => {
    return state.doc.modes[mimeType];
  };
};

export default slice.reducer;
