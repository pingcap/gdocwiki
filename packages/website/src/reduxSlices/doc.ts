import { createSlice } from '@reduxjs/toolkit';
import { DriveFile } from '../utils';
import { DocHeader, TreeHeading } from '../utils/docHeaders';

export interface DocState {
  file: DriveFile | null;
  headers?: (TreeHeading | DocHeader)[];
  comments: gapi.client.drive.Comment[];
}

const initialStateDoc: DocState = {
  file: null,
  headers: [],
  comments: [],
};

export const slice = createSlice({
  name: 'doc',
  initialState: initialStateDoc,
  reducers: {
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
  },
})

export const { setFile, setNoFile, setHeaders, setComments } = slice.actions;

export const selectHeaders = (state: { doc: DocState }) => state.doc.headers;
export const selectComments = (state: { doc: DocState }) => state.doc.comments;
export const selectDriveFile = (state: { doc: DocState }) => state.doc.file;

export default slice.reducer;