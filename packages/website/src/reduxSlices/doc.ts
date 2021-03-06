import { createSlice } from '@reduxjs/toolkit';
import { DocHeader, TreeHeading } from '../utils/docHeaders';

export interface DocState {
  headers?: (TreeHeading | DocHeader)[];
  comments: gapi.client.drive.Comment[];
}

const initialStateDoc: DocState = {
  headers: [],
  comments: [],
};

export const slice = createSlice({
  name: 'doc',
  initialState: initialStateDoc,
  reducers: {
    setHeaders: (state, { payload }: { payload: (TreeHeading | DocHeader)[] }) => {
      state.headers = payload;
    },
    setComments: (state, { payload }: { payload: gapi.client.drive.Comment[] }) => {
      state.comments = payload;
    },
  },
})

export const { setHeaders, setComments } = slice.actions;

export const selectHeaders = (state: { doc: DocState }) => state.doc.headers;
export const selectComments = (state: { doc: DocState }) => state.doc.comments;

export default slice.reducer;