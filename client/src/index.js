import "./index.css";
import App from "./App";
import React from "react";
import { createRoot } from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";
import { Auth0Provider } from "@auth0/auth0-react";
import SnackbarProvider from "./shared/context/snackbar-context";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={`https://${process.env.REACT_APP_AUTH0_DOMAIN}`}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      redirectUri={window.location.origin}
      audience={`https://${process.env.REACT_APP_AUTH0_AUDIENCE}`}
      // scope={"read:current_user update:current_user_metadata"}
      useRefreshTokens={true}
      cacheLocation={"localstorage"}
    >
      <ThemeProvider theme={theme}>
        <SnackbarProvider>
          <App />
        </SnackbarProvider>
      </ThemeProvider>
    </Auth0Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
