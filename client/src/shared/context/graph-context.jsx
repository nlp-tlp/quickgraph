import { createContext, useReducer, useContext } from "react";
import axiosInstance from "../utils/api";
import { SnackbarContext } from "./snackbar-context";

export const initialState = {
  loading: true,
  error: false,
  updating: false,
  resetting: false,
  filters: {
    username: "group",
    search_term: "",
    quality: 2,
    aggregate: true,
    show_orphans: true,
    exclude_ontology_item_ids: [],
    node_limit: 5000,
  },
  data: { nodes: {}, links: {}, relationships: {} },
};

export const GraphContext = createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_VALUE":
      return { ...state, ...action.payload };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "RESET_FILTERS":
      return { ...state, filters: initialState.filters };
    default:
      break;
  }
};

export const GraphProvider = (props) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);

  const setAppState = (key, value) =>
    dispatch({ type: "SET_VALUE", payload: { [key]: value } });

  const stateActions = {
    loading: (value) => setAppState("loading", value),
    updating: (value) => setAppState("updating", value),
    resetting: (value) => setAppState("resetting", value),
    error: (value) => setAppState("error", value),
  };

  const mergeData = (oldData, newData) => {
    // List of keys we want to merge
    const keysToMerge = ["nodes", "links", "relationships"];

    // Loop over each key
    keysToMerge.forEach((key) => {
      const oldDataKey = oldData[key];
      const newDataKey = newData[key];

      if (oldDataKey && newDataKey) {
        // Add/update entries from newData to oldData
        Object.keys(newDataKey).forEach((id) => {
          oldDataKey[id] = newDataKey[id];
        });

        // Remove any key that's not present in the new data
        Object.keys(oldDataKey).forEach((id) => {
          if (!newDataKey.hasOwnProperty(id)) {
            delete oldDataKey[id];
          }
        });
      }
    });

    return oldData;
  };
  const fetchGraph = async ({
    projectId,
    filters = state.filters,
    stateToToggle = "loading",
  }) => {
    try {
      stateActions[stateToToggle](true);

      const res = await axiosInstance.get(`/graph/${projectId}`, {
        params: {
          ...filters,
          username:
            filters.username.toLowerCase() === "group" ? "" : filters.username,
          exclude_ontology_item_ids:
            filters.exclude_ontology_item_ids.join(","), // Need to stringify before sending to backend
        },
      });

      if (res.status === 200) {
        if (stateToToggle === "loading") {
          dispatch({
            type: "SET_VALUE",
            payload: { ...res.data, loading: false },
          });
        } else {
          // Merge new data with existing data.
          const updatedData = mergeData(state.data, res.data.data);
          dispatch({
            type: "SET_VALUE",
            payload: { ...updatedData, loading: false },
          });
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      stateActions.error(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to retrieve graph",
          severity: "error",
        },
      });
    } finally {
      stateActions[stateToToggle](false);
    }
  };

  const value = {
    state,
    dispatch,
    fetchGraph,
  };

  return (
    <GraphContext.Provider value={value}>
      {props.children}
    </GraphContext.Provider>
  );
};
