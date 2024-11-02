import React, { Suspense } from "react";
import "./App.css";
import { Helmet } from "react-helmet";
import { Route, BrowserRouter, Routes, Navigate } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { useMediaQuery, CircularProgress, Box } from "@mui/material";
import { theme } from "./theme";

// Routes
import { ROUTES, PUBLIC_ROUTES } from "./routes";

// Components
import DeviceTooSmall from "./shared/components/DeviceTooSmall";
import AuthPages from "./shared/components/Auth/AuthPages";
import PrivateRoute from "./shared/components/Auth/PrivateRoute";
import Layout from "./shared/components/Layout/Layout";

// Context Providers
import { AuthProvider } from "./shared/context/AuthContext";
import SnackbarProvider from "./shared/context/snackbar-context";
import { ThemeProvider } from "@mui/material/styles";

// Constants
const MOBILE_BREAKPOINT = "(max-width:1000px)";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error loading component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong loading this component.</div>;
    }

    return this.props.children;
  }
}

function App() {
  const isTooSmall = useMediaQuery(MOBILE_BREAKPOINT);

  const renderRouteContent = (route) => {
    // Handle different types of components
    const RouteComponent = (() => {
      // If it's already a React element (JSX)
      if (React.isValidElement(route.component)) {
        return () => route.component;
      }
      // If it's a lazy component
      if (route.component.$$typeof === Symbol.for("react.lazy")) {
        return route.component;
      }
      // If it's a regular component
      if (typeof route.component === "function") {
        return route.component;
      }
      // For any other case, wrap in a function
      return () => route.component;
    })();

    const WrappedComponent = route.contextprovider
      ? ({ children }) => (
          <route.contextprovider>{children}</route.contextprovider>
        )
      : ({ children }) => <>{children}</>;

    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <Box
              sx={{
                height: "100vh",
                width: "100vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          }
        >
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
      </ErrorBoundary>
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
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
