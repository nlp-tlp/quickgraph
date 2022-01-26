import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../utils/api-interceptor";

const initialState = {
  status: "idle",
  error: null,
  projects: null,
  activeProject: null,
};

export const fetchProjects = createAsyncThunk(
  "/feed/fetchProjects",
  async () => {
    const response = await axios.get("/api/project");
    return response.data;
  }
);

export const feedSlice = createSlice({
  name: "feed",
  initialState: initialState,
  reducers: {
    setActiveProject: (state, action) => {
      state.activeProject = action.payload;
    },
    setIdle: (state, action) => {
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Add fetched data to projects
        state.projects = action.payload;
      })
      .addCase(fetchProjects.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { setActiveProject, setIdle, setProjectMetrics } =
  feedSlice.actions;

export const selectFeedStatus = (state) => state.feed.status;
export const selectFeedError = (state) => state.feed.error;
export const selectProjects = (state) => state.feed.projects;
export const selectActiveProject = (state) => state.feed.activeProject;

export default feedSlice.reducer;
