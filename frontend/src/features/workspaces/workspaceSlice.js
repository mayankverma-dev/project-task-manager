import { createSlice } from '@reduxjs/toolkit';

const loadActiveWorkspace = () => {
  try {
    const serializedState = localStorage.getItem('activeWorkspace');
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return null;
  }
};

const initialState = {
  activeWorkspace: loadActiveWorkspace(),
};

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setActiveWorkspace: (state, action) => {
      state.activeWorkspace = action.payload;
      try {
        localStorage.setItem('activeWorkspace', JSON.stringify(action.payload));
      } catch (err) {
        // Ignore write errors
      }
    },
    clearActiveWorkspace: (state) => {
      state.activeWorkspace = null;
      try {
        localStorage.removeItem('activeWorkspace');
      } catch (err) {
        // Ignore write errors
      }
    }
  },
});

export const { setActiveWorkspace, clearActiveWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
