import { createSlice } from '@reduxjs/toolkit';
import { DocHeader, TreeHeading, MakeTree } from '../utils/docHeaders';

export interface HeadersState {
  headers?: (TreeHeading | DocHeader)[];
}

const initialStateHeaders: HeadersState = {
  headers: [],
};

export const slice = createSlice({
  name: 'headers',
  initialState: initialStateHeaders,
  reducers: {
    setHeaders: (state, { payload }: { payload: (TreeHeading | DocHeader)[] }) => {
      console.debug('set Headers');
      state.headers = MakeTree(payload);
    },
  },
})

export const { setHeaders } = slice.actions;

export const selectHeaders = (state: { headers: HeadersState }) => state.headers.headers;

export default slice.reducer;