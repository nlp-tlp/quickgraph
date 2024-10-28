import * as React from "react";
import { updateTexts } from "../utils/cleaner-context";
import { useAuth0 } from "@auth0/auth0-react";
import axiosInstance from "../utils/api";

const initialState = {
  filters: {
    searchTerm: "",
    referenceSearchTerm: "",
    saved: "all",
    candidates: "all",
    rank: 1,
  },
  savePending: false,
  projectLoading: true,
  project: null,
  projectId: null,
  progress: { value: 0, title: "" },
  totalTexts: null,
  pageLimit: 10,
  pageNumber: 1,
  textsLoading: true,
  texts: null,
  showReferences: false,
  showToast: false,
  toastInfo: null,
  operationLoading: false,
  tokenizeTextId: null,
  currentTextSelected: null,
  tokenIdsSelected: [],
  selectedTokens: { tokenIds: [], textId: null },
  selectedTokenValue: null,
};

export const CleanerContext = React.createContext();

const reducer = (state, action) => {
  // console.log("[REDUCER]", action.type, action.payload);

  switch (action.type) {
    case "SET_PROJECTID": {
      return { ...state, projectId: action.payload };
    }
    case "SET_PROJECT": {
      // Sets textsLoading to ensure documents are loaded correctly.
      return {
        ...initialState,
        projectId: state.projectId,
        project: action.payload,
        projectLoading: false,
        textsLoading: true,
      };
    }
    case "SET_PROJECT_METRICS": {
      return state;
    }
    case "SET_TEXTS": {
      return {
        ...state,
        texts: action.payload.texts,
        totalTexts: action.payload.totalTexts,
        textsLoading: false,
      };
    }
    case "SET_TEXTS_LOADING": {
      return { ...state, textsLoading: true };
    }
    case "SET_PAGE": {
      return { ...state, pageNumber: action.payload, textsLoading: true };
    }
    case "SAVE_TEXTS": {
      let updatedTexts = state.texts;

      action.payload.textIds.map((textId) => {
        updatedTexts = {
          ...updatedTexts,
          [textId]: {
            ...updatedTexts[textId],
            saved: action.payload.saveState,
          },
        };
      });

      return { ...state, texts: updatedTexts };
    }
    case "SET_VALUE": {
      return { ...state, ...action.payload };
    }
    case "RESET_FILTERS": {
      return { ...state, filters: initialState.filters };
    }
    case "UPDATE_TOKEN_VALUE": {
      const text = state.texts[action.payload.textId];
      const newTokens = {
        ...text.tokens,
        [action.payload.tokenIndex]: {
          ...text.tokens[action.payload.tokenIndex],
          currentValue: action.payload.newValue,
        },
      };

      return {
        ...state,
        texts: {
          ...state.texts,
          [action.payload.textId]: { ...text, tokens: newTokens },
        },
      };
    }
    case "TOKEN_APPLY": {
      const updatedTexts = updateTexts(
        "apply",
        state.texts,
        action.payload.textTokenIds,
        action.payload.tokenId,
        action.payload.replacement
      );

      // Set toast values and set toast to active for user to see
      const toastInfo = {
        action: "apply",
        applyAll: action.payload.applyAll,
        content: {
          oldValue: action.payload.originalValue,
          newValue: action.payload.replacement,
          count: action.payload.matches,
          //     textIds: updatedTextIds,
        },
      };

      return {
        ...state,
        texts: updatedTexts,
        toastInfo: toastInfo,
        showToast: true,
      };
    }
    case "TOKEN_DELETE": {
      const updatedTexts = updateTexts(
        "delete",
        state.texts,
        action.payload.textTokenIds,
        action.payload.tokenId,
        action.payload.replacement
      );

      // Set toast values and set toast to active for user to see
      const toastInfo = {
        action: "delete",
        applyAll: action.payload.applyAll,
        content: {
          oldValue: action.payload.currentValue, // Old value as its being removed.
          newValue: action.payload.originalValue,
          count: action.payload.matches,
          //     textIds: updatedTextIds,
        },
      };

      return {
        ...state,
        texts: updatedTexts,
        toastInfo: toastInfo,
        showToast: true,
      };
    }
    case "TOKEN_ACCEPT": {
      const updatedTexts = updateTexts(
        "accept",
        state.texts,
        action.payload.textTokenIds,
        action.payload.tokenId,
        action.payload.replacement
      );

      // Set toast values and set toast to active for user to see
      const toastInfo = {
        action: "accept",
        applyAll: action.payload.applyAll,
        content: {
          oldValue: action.payload.originalValue,
          newValue: action.payload.currentValue,
          count: action.payload.matches,
          //     textIds: updatedTextIds,
        },
      };

      return {
        ...state,
        texts: updatedTexts,
        toastInfo: toastInfo,
        showToast: true,
      };
    }
    case "TOKEN_SPLIT": {
      return { ...state, texts: { ...state.texts, ...action.payload } };
    }
    case "TOKEN_REMOVE": {
      // Removes token from text
      // Set toast values and set toast to active for user to see

      const toastInfo = {
        action: "remove",
        applyAll: action.payload.applyAll,
        content: {
          oldValue: action.payload.originalValue,
          count: action.payload.matches,
        },
      };

      return {
        ...state,
        texts: { ...state.texts, ...action.payload.textTokenObjects },
        toastInfo: toastInfo,
        showToast: true,
      };
    }
    case "TOKENIZE": {
      // Joins contiguous n-grams on a given text
      return {
        ...state,
        texts: { ...state.texts, ...action.payload },
        tokenizeTextId: null,
      };
    }
    case "SET_SHOW_TOAST": {
      return { ...state, showToast: action.payload };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
};

export const CleanerProvider = (props) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { getAccessTokenSilently } = useAuth0();

  //   React.useEffect(() => {
  //     if (state.projectId) {
  //       fetchProject(state.projectId);
  //       fetchProgress(state.projectId);
  //     }
  //   }, [state.projectId]);

  //   React.useEffect(() => {
  //     if (state.textsLoading && state.projectId) {
  //       fextDatasetItems(
  //         state.projectId,
  //         state.filters,
  //         state.pageNumber,
  //         state.pageLimit
  //       );
  //     }
  //   }, [state.textsLoading, state.projectId, state.pageNumber]);

  //   const fetchProgress = async (projectId) => {
  //     axiosInstance.get(`/api/project/progress/${projectId}`).then((response) => {
  //       dispatch({ type: "SET_VALUE", payload: response.data }).catch((error) =>
  //         console.log(`error fetching project progresss: ${error}`)
  //       );
  //     });
  //   };

  //   const fetchProject = async (projectId) => {
  //     axios
  //       .get(`/api/project/${projectId}`)
  //       .then((response) => {
  //         dispatch({ type: "SET_PROJECT", payload: response.data });
  //       })
  //       .catch((error) => console.log(`error fetching project: ${error}`));
  //   };

  const fextDatasetItems = async (
    projectId,
    filters,
    pageNumber,
    pageLimit
  ) => {
    try {
      const token = await getAccessTokenSilently();

      const res = await axiosInstance.post(
        "/api/text/filter",
        { projectId: projectId, filters: filters },
        {
          params: { page: pageNumber, limit: pageLimit },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        dispatch({ type: "SET_TEXTS", payload: res.data });
      } else {
        // Snack
      }
    } catch (error) {
      console.log(`error fetching texts: ${error}`);
    } finally {
    }
  };

  const applyToken = async () => {};

  const deleteToken = async () => {};

  const acceptToken = async () => {};

  return (
    <CleanerContext.Provider value={[state, dispatch]}>
      {props.children}
    </CleanerContext.Provider>
  );
};
