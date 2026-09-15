import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import workspaceReducer from '../features/workspaces/workspaceSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspaces: workspaceReducer,
  },
});
