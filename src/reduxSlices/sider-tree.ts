import { createSlice } from '@reduxjs/toolkit';

export interface TreeState {
  selected: Array<string>;
  expanded: Array<string>;
}

const initialState: TreeState = {
  selected: [],
  expanded: [],
};

export const slice = createSlice({
  name: 'tree',
  initialState,
  reducers: {
    select: (state, { payload }: { payload: Array<string> }) => {
      state.selected = payload;
    },

    expand: (state, { payload }: { payload: Array<string> }) => {
      let set = new Set([...state.expanded, ...payload]);
      state.expanded = [...set];
    },

    collapse: (state, { payload }: { payload: Array<string> }) => {
      let set = new Set(state.expanded);
      for (let id of payload) {
        set.delete(id);
      }
      state.expanded = [...set];
    },

    collapseAll: (state) => {
      state.expanded = [];
    },
  },
});

export const { select, expand, collapse, collapseAll } = slice.actions;

export const selectSelected: (state: { tree: TreeState }) => ReadonlyArray<string> = (state) =>
  state.tree.selected;

export const selectExpanded: (state: { tree: TreeState }) => ReadonlySet<string> = (state) =>
  new Set(state.tree.expanded);

export default slice.reducer;
