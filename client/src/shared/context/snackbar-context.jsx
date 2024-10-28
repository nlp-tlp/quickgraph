import React from "react";
import Snackbar from "../components/Snackbar";

const placement = {
  top: { vertical: "top", horizontal: "center" },
  "bottom-right": { vertical: "bottom", horizontal: "right" },
};

const initialState = {
  open: false,
  message: "",
  severity: "success",
  duration: 4000,
  anchorOrigin: placement["top"],
};

export const SnackbarContext = React.createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_SNACKBAR":
      return { ...state, ...action.payload, open: true };
    case "HANDLE_CLOSE":
      return { ...state, open: false };
    default:
      break;
  }
};

const SnackbarProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  return (
    <SnackbarContext.Provider value={[state, dispatch]}>
      {children}
      <Snackbar {...state} onClose={() => dispatch({ type: "HANDLE_CLOSE" })} />
    </SnackbarContext.Provider>
  );
};

export default SnackbarProvider;
