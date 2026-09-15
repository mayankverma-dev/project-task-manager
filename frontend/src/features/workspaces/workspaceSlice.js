import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeWorkspace: null, // { id, name, slug, ownerId, createdAt, role }
};

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setActiveWorkspace: (state, action) => {
      state.activeWorkspace = action.payload;
    },
    clearActiveWorkspace: (state) => {
      state.activeWorkspace = null;
    }
  },
});

export const { setActiveWorkspace, clearActiveWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
