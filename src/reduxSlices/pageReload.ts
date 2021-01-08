import { createSlice } from '@reduxjs/toolkit';

export interface PageReloadState {
  token: number;
}

const initialState: PageReloadState = {
  token: 0,
};

export const slice = createSlice({
  name: 'pageReload',
  initialState,
  reducers: {
    reloadPage: (state) => {
      state.token++;
    },
  },
});

export const { reloadPage } = slice.actions;

export const selectPageReloadToken = (state: { pageReload: PageReloadState }) =>
  state.pageReload.token;

export default slice.reducer;
