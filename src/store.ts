import { configureStore } from '@reduxjs/toolkit';
import filesReducer from './reduxSlices/files';
import treeReducer from './reduxSlices/sider-tree';

export default configureStore({
  reducer: {
    files: filesReducer,
    tree: treeReducer,
  },
});
