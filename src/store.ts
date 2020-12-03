import { configureStore } from '@reduxjs/toolkit';
import filesReducer from './reduxSlices/files';

export default configureStore({
  reducer: {
    files: filesReducer,
  },
});
