import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../utils/api-interceptor";

const initialState = {
  loginStatus: "idle",
  loginError: null,
  signupStatus: "idle",
  signupError: null,
  tokenStatus: "idle",
  tokenError: null,
  isAuthenticated: false,
  username: null,
  _id: null,
  colour: null,
  invitations: null,
  preferences: {},
};

export const signup = createAsyncThunk(
  "/user/signup",
  async ({ username, password, email }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/auth/signup", {
        username: username,
        password: password,
        email: email,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const login = createAsyncThunk(
  "/user/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/auth/login", {
        username: username,
        password: password,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const logout = createAsyncThunk(
  "/user/logout",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/auth/logout");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchUserDetails = createAsyncThunk(
  "/user/fetchUserDetails",
  async () => {
    const response = await axios.get("/api/user/profile");
    return response.data;
  }
);

export const fetchInvitations = createAsyncThunk(
  "/user/fetchInvitations",
  async () => {
    const response = await axios.get("/api/user/invitations");
    return response.data;
  }
);

export const acceptInvitation = createAsyncThunk(
  "/user/acceptInvitation",
  async ({ projectId }) => {
    const response = await axios.patch("/api/user/invitation/accept", {
      project_id: projectId,
    });
    return response.data;
  }
);

export const declineInvitation = createAsyncThunk(
  "/user/declineInvitation",
  async ({ projectId }) => {
    const response = await axios.patch("/api/user/invitation/decline", {
      project_id: projectId,
    });
    return response.data;
  }
);

export const updateProfile = createAsyncThunk(
  "/user/updateProfile",
  async ({ username, email, publicBool, colour }) => {
    const response = await axios.patch("/api/user/profile", {
      username: username,
      email: email,
      public: publicBool, // Cannot use public as reserved word
      colour: colour,
    });
    return response.data;
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState: initialState,
  reducers: {
    setIsAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loginError = null;
        state.loginStatus = "loading";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginError = null;
        state.username = action.payload.username;
        state._id = action.payload._id;
        state.colour = action.payload.colour;
        state.isAuthenticated = true;
        state.invitations = action.payload.invitations;
        state.loginStatus = "succeeded";
      })
      .addCase(login.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.loginError =
          action.payload.error ||
          "An unknown error occurred 😞 - give it another crack!";
        state.loginStatus = "failed";
      })
      .addCase(signup.pending, (state) => {
        state.signupError = null;
        state.signupStatus = "loading";
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.signupError = null;
        state.username = action.payload.username;
        state._id = action.payload._id;
        state.colour = action.payload.colour;
        state.isAuthenticated = true;
        state.invitations = action.payload.invitations;
        state.signupStatus = "succeeded";
      })
      .addCase(signup.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.signupError =
          action.payload.error ||
          "An unknown error occurred 😞 - give it another crack!";
        state.signupStatus = "failed";
      })
      .addCase(logout.fulfilled, (state, action) => {
        console.log("Logged out");
        return initialState;
      })
      .addCase(logout.rejected, (state, action) => {
        console.log("failed to logout user", action.payload.error);
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.username = action.payload.username;
        state._id = action.payload._id;
        state.colour = action.payload.colour;
      })
      .addCase(fetchInvitations.fulfilled, (state, action) => {
        state.invitations = action.payload;
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        console.log("reducer action", action);
        state.invitations = action.payload.user_response.projects.filter(
          (p) => !p.accepted
        );
      })
      .addCase(declineInvitation.fulfilled, (state, action) => {
        state.invitations = action.payload.user_response.projects.filter(
          (p) => !p.accepted
        );
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.username = action.payload.username;
        state.colour = action.payload.colour;
      });
  },
});

export const { setIsAuthenticated } = userSlice.actions;

export const selectLoginStatus = (state) => state.user.loginStatus;
export const selectLoginError = (state) => state.user.loginError;
export const selectSignupStatus = (state) => state.user.signupStatus;
export const selectSignupError = (state) => state.user.signupError;
export const selectTokenStatus = (state) => state.user.tokenStatus;
export const selectTokenError = (state) => state.user.tokenError;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;

export const selectUsername = (state) => state.user.username;
export const selectInvitations = (state) => state.user.invitations;
export const selectUserId = (state) => state.user._id;
export const selectColour = (state) => state.user.colour;

export default userSlice.reducer;
