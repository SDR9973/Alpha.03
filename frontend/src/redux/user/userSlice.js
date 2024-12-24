import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  token: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      const { user, access_token } = action.payload; 
      state.currentUser = user;
      state.token = access_token;
    },
    logoutUser(state) {
      state.currentUser = null;
      state.token = null;
    },
    deleteUser(state) {
      state.currentUser = null;
      state.token = null;
    },
    updateUser(state, action) {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
  },
});

export const { setUser, logoutUser, deleteUser, updateUser } = userSlice.actions;

export default userSlice.reducer;
