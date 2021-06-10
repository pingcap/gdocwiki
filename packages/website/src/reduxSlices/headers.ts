import { createSlice } from '@reduxjs/toolkit';
import { DocHeader } from '../utils/docHeaders';

export interface HeadersState {
  headers: Array<any>;
}

const initialStateHeaders: HeadersState = {
  headers: [],
}

export const slice = createSlice({
  name: 'headers',
  initialState: initialStateHeaders,
  reducers: {
    setHeaders: (state, { payload }: { payload: Array<DocHeader> }) => {
      state.headers = payload;
    },
  },
})

export const { setHeaders } = slice.actions;

export const selectHeaders = (state: { headers: HeadersState }) => state.headers.headers;

export default slice.reducer;