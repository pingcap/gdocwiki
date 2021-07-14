import { configureStore } from '@reduxjs/toolkit';
import docReducer from '../reduxSlices/doc';
import filesReducer from '../reduxSlices/files';
import pageReloadReducer from '../reduxSlices/pageReload';
import treeReducer from '../reduxSlices/siderTree';

export const store = configureStore({
  reducer: {
    files: filesReducer,
    tree: treeReducer,
    pageReload: pageReloadReducer,
    doc: docReducer,
  },
});
