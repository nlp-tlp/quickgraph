import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer } from "redux-persist";
import projectReducer from "../features/project/projectSlice";
import userReducer from "../features/auth/userSlice";
import feedReducer from "../features/feed/feedSlice";
import createStepReducer from "../features/projectcreation/createStepSlice";
import dataReducer from "./dataSlice";
import graphReducer from "../features/dashboard/features/graph/graphSlice";
import alertReducer from "../features/alerts/alertSlice"

const combinedReducer = combineReducers({
  user: userReducer,
  project: projectReducer,
  data: dataReducer,
  feed: feedReducer,
  graph: graphReducer,
  create: createStepReducer,
  alert: alertReducer
});

const persistConfig = {
  timeout: 500, //Set the timeout function to 2 seconds (src: https://github.com/rt2zz/redux-persist/issues/816)
  key: "root",
  storage,
  whitelist: ["user"],
};

// Root reducer resets state on action.
// src: https://stackoverflow.com/questions/35622588/how-to-reset-the-state-of-a-redux-store?rq=1
const rootReducer = (state, action) => {
  if (action.type === "user/logout") {
    state = undefined;
  }
  return combinedReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  // TODO: add env and fix this issue below
  // devTools: process.env.NODE_ENV !== "production",
});

export default store;
