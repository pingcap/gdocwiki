import { createSlice } from '@reduxjs/toolkit';
import { DriveFile } from '../utils';

export interface TreeState {
  activeId?: string;
  expanded: Array<string>;
  selected: Array<string>;
}

const initialState: TreeState = {
  expanded: [],
  selected: [],
};

interface ActivatePayload {
  id: string;
  mapIdToFile: Record<string, DriveFile>;
}

export const slice = createSlice({
  name: 'tree',
  initialState,
  reducers: {
    setActiveId: (state, { payload }: { payload: string }) => {
      state.activeId = payload;
    },

    activate: (state, { payload }: { payload: ActivatePayload }) => {
      console.log(`Sidebar activate`, payload.id);
      const newExpandNodes = new Set<string>();

      let currentNodeId = payload.id;
      while (true) {
        if (newExpandNodes.has(currentNodeId)) {
          // Duplicate
          break;
        }
        newExpandNodes.add(currentNodeId);
        // Try to expand parent
        const currentNode = payload.mapIdToFile[currentNodeId];
        if (!currentNode) {
          break;
        }
        const parents = currentNode.parents ?? [];
        if (parents.length === 0) {
          break;
        }
        currentNodeId = parents[0];
      }

      state.selected = [...newExpandNodes];

      for (const id of state.expanded) {
        newExpandNodes.add(id);
      }
      state.expanded = [...newExpandNodes];
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

export const { setActiveId, activate, expand, collapse, collapseAll } = slice.actions;

export const selectExpanded = (state: { tree: TreeState }) =>
  new Set(state.tree.expanded) as ReadonlySet<string>;

export const selectActiveId = (state: { tree: TreeState }) => state.tree.activeId;

export const selectSelected = (state: { tree: TreeState }) => [...state.tree.selected];

export default slice.reducer;

