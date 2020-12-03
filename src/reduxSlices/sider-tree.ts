import { createSlice } from '@reduxjs/toolkit';
import { DriveFile } from './files';

export interface TreeState {
  active?: string;
  expanded: Array<string>;
}

const initialState: TreeState = {
  expanded: [],
};

interface ActivatePayload {
  id: string;
  mapIdToFile: Record<string, DriveFile>;
}

export const slice = createSlice({
  name: 'tree',
  initialState,
  reducers: {
    activate: (state, { payload }: { payload: ActivatePayload }) => {
      state.active = payload.id;
      console.log(`activate(${payload.id}), mapIdToFile(${payload.mapIdToFile})`);
      const visitedNodes = new Set<string>(state.expanded);
      let activeNodes: string[] = payload.mapIdToFile[payload.id]?.parents ?? [];
      while (activeNodes.length !== 0) {
        let newNodes: string[] = [];
        for (let id of activeNodes) {
          const parents = payload.mapIdToFile[id]?.parents;
          if (!visitedNodes.has(id) && parents !== undefined) {
            visitedNodes.add(id);
            newNodes = [...newNodes, ...parents];
          }
        }
        activeNodes = newNodes;
      }

      state.expanded = [...visitedNodes];
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

export const { activate, expand, collapse, collapseAll } = slice.actions;

export const selectActive: (state: { tree: TreeState }) => string | undefined = (state) =>
  state.tree.active;

export const selectExpanded: (state: { tree: TreeState }) => ReadonlySet<string> = (state) =>
  new Set(state.tree.expanded);

export default slice.reducer;
