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
    setActiveId: (state, { payload }: { payload: string }) => {
      state.activeId = payload;
    },

    activate: (state, { payload }: { payload: ActivatePayload }) => {
      console.log(`Sidebar activate`, payload.id);
      const expandedNodes = new Set<string>();

      let currentNodeId = payload.id;
      while (true) {
        if (expandedNodes.has(currentNodeId)) {
          // Duplicate
          break;
        }
        expandedNodes.add(currentNodeId);
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

      for (const id of state.expanded) {
        expandedNodes.add(id);
      }

      state.expanded = [...expandedNodes];
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

export default slice.reducer;
