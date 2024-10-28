import React, { Suspense } from "react";
import "./App.css";
import { Helmet } from "react-helmet";
import { Route, BrowserRouter, Routes, Navigate } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { useMediaQuery, CircularProgress } from "@mui/material";
import { theme } from "./theme";

// Routes
import { ROUTES, PUBLIC_ROUTES } from "./routes";

// Components
import DeviceTooSmall from "./shared/components/DeviceTooSmall";
import AuthPages from "./shared/components/Auth/AuthPages";
import PrivateRoute from "./shared/components/Auth/PrivateRoute";
import Layout from "./shared/components/Layout/Layout";

// Context Providers
import { Auth0Provider } from "@auth0/auth0-react";
import SnackbarProvider from "./shared/context/snackbar-context";
import { ThemeProvider } from "@mui/material/styles";

// Constants
const MOBILE_BREAKPOINT = "(max-width:1000px)";

// Auth0 configuration
const AUTH0_CONFIG = {
  domain: `https://${import.meta.env.VITE_AUTH0_DOMAIN}`,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  redirectUri: window.location.origin,
  audience: `https://${import.meta.env.VITE_AUTH0_AUDIENCE}`,
  useRefreshTokens: true,
  cacheLocation: "localstorage",
};

function App() {
  const isTooSmall = useMediaQuery("(max-width:1000px)");

  const renderRouteContent = (route) => {
    // Handle both lazy and non-lazy components
    const RouteComponent =
      typeof route.component === "function"
        ? route.component
        : React.lazy(() => Promise.resolve({ default: () => route.component }));

    const WrappedComponent = route.contextprovider
      ? ({ children }) => (
          <route.contextprovider>{children}</route.contextprovider>
        )
      : ({ children }) => <>{children}</>;

    return (
      <Suspense fallback={<CircularProgress />}>
        <Helmet>
          <title>{route.title} | QuickGraph</title>
        </Helmet>
        <WrappedComponent>
          {route.layout ? (
            <Layout context={{ name: route.name }} sidebar={route.sidebar}>
              <RouteComponent />
            </Layout>
          ) : (
            <RouteComponent />
          )}
        </WrappedComponent>
      </Suspense>
    );
  };

  const renderRoute = (route, index) => {
    const shouldShowSmallDeviceWarning =
      isTooSmall &&
      !Object.values(PUBLIC_ROUTES).some((r) => r.path === route.path);

    const routeContent = shouldShowSmallDeviceWarning ? (
      <DeviceTooSmall />
    ) : (
      renderRouteContent(route)
    );

    return (
      <Route
        key={`route-${index}`}
        path={route.path}
        element={
          route.protected ? (
            <PrivateRoute>{routeContent}</PrivateRoute>
          ) : (
            routeContent
          )
        }
      />
    );
  };

  return (
    <Auth0Provider {...AUTH0_CONFIG}>
      <ThemeProvider theme={theme}>
        <SnackbarProvider>
          <BrowserRouter>
            <CssBaseline />
            <Routes>
              {ROUTES.map(renderRoute)}
              <Route
                path="/unauthorized"
                element={<AuthPages page="unauthorized" />}
              />
              <Route path="*" element={<AuthPages page="notExist" />} />
              <Route
                path="/dashboard"
                element={<Navigate to="/dashboard/overview" replace />}
              />
            </Routes>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Auth0Provider>
  );
}

export default App;
