import { configureStore } from '@reduxjs/toolkit';
import filesReducer from '../reduxSlices/files';
import pageReloadReducer from '../reduxSlices/pageReload';
import treeReducer from '../reduxSlices/siderTree';

export const store = configureStore({
  reducer: {
    files: filesReducer,
    tree: treeReducer,
    pageReload: pageReloadReducer,
  },
});
