import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  id: null,
  status: "idle",
  error: null,
  active: false,
  content: { title: null, body: null, level: null },
};

export const alertSlice = createSlice({
  name: "alert",
  initialState: initialState,
  reducers: {
    setAlertActive: (state, action) => {
      state.active = action.payload;
    },
    setAlertContent: (state, action) => {
      state.content = action.payload;
    },
  },
});

export const { setAlertContent, setAlertActive } = alertSlice.actions;

export const selectAlertActive = (state) => state.alert.active;
export const selectAlertContent = (state) => state.alert.content;

export default alertSlice.reducer;
