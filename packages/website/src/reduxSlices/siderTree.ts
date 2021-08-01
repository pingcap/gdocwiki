import { createSlice } from '@reduxjs/toolkit';
import { DriveFile } from '../utils';
import { selectMapIdToFile } from './files';

function ancestors(id: string, mapIdToFile: Record<string, DriveFile>): Set<string> {
  const newExpandNodes = new Set<string>();

  let currentNodeId = id;
  while (true) {
    if (newExpandNodes.has(currentNodeId)) {
      // Duplicate
      break;
    }
    newExpandNodes.add(currentNodeId);
    // Try to expand parent
    const currentNode = mapIdToFile[currentNodeId];
    if (!currentNode) {
      break;
    }
    const parents = currentNode.parents ?? [];
    if (parents.length === 0) {
      break;
    }
    currentNodeId = parents[0];
  }

  return newExpandNodes;
}

export interface TreeState {
  sidebarOpen: boolean;
  activeId?: string;
  expanded: Array<string>;
  selected: Array<string>;
}

const initialState: TreeState = {
  sidebarOpen: window.innerWidth >= 600,
  expanded: [],
  selected: [],
};

interface WithMappings<T> {
  arg: T;
  mapIdToFile: Record<string, DriveFile>;
}

export const slice = createSlice({
  name: 'tree',
  initialState,
  reducers: {
    closeSidebar: (state, { payload }: { payload: undefined }) => {
      state.sidebarOpen = false;
    },

    openSidebar: (state, { payload }: { payload: undefined }) => {
      state.sidebarOpen = true;
    },

    setActiveId: (state, { payload }: { payload: string }) => {
      state.activeId = payload;
    },

    activate: (state, { payload }: { payload: WithMappings<string> }) => {
      const id = payload.arg;
      console.log(`Sidebar activate`, id);
      const newExpandNodes = ancestors(payload.arg, payload.mapIdToFile);

      state.selected = [...newExpandNodes];
      state.expanded = [...newExpandNodes];
    },

    expand: (state, { payload }: { payload: WithMappings<string[]> }) => {
      const newExpanded = payload.arg;
      console.log('expand', newExpanded);

      let newExpandedAll: string[] = [];
      newExpanded.forEach((id: string) => {
        newExpandedAll = newExpandedAll.concat(...ancestors(id, payload.mapIdToFile));
      });

      // If a different node is selected
      // Then keep the selected nodes open if they are expanded
      const ex = new Set(state.expanded);
      const selectedExpanded = state.selected.filter((s) => ex.has(s));
      // TODO: also keep expanded parents
      state.expanded = [...selectedExpanded, ...newExpandedAll];
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

export const {
  closeSidebar,
  openSidebar,
  setActiveId,
  activate,
  expand,
  collapse,
  collapseAll,
} = slice.actions;

export const selectExpanded = (state: { tree: TreeState }) =>
  new Set(state.tree.expanded) as ReadonlySet<string>;

export const selectActiveId = (state: { tree: TreeState }) => state.tree.activeId;

export const selectSelected = (state: { tree: TreeState }) => [...state.tree.selected];

export const selectSidebarOpen = (state: { tree: TreeState }) => state.tree.sidebarOpen;

export default slice.reducer;

