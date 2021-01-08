import { createSlice } from '@reduxjs/toolkit';
import { DriveFile } from '../utils';

export interface TreeState {
  activeId?: string;
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
    updateActiveId: (state, { payload }: { payload: string }) => {
      state.activeId = payload;
    },

    activate: (state, { payload }: { payload: ActivatePayload }) => {
      console.trace(`Sidebar activate`, payload.id);
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

export const { updateActiveId, activate, expand, collapse, collapseAll } = slice.actions;

export const selectExpanded = (state: { tree: TreeState }) =>
  new Set(state.tree.expanded) as ReadonlySet<string>;

export const selectActiveId = (state: { tree: TreeState }) => state.tree.activeId;

export default slice.reducer;
