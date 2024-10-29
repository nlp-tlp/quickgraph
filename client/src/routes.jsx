// types.js
/**
 * @typedef {Object} Route
 * @property {boolean} protected - Whether route requires authentication
 * @property {string} title - Page title
 * @property {string} path - URL path
 * @property {string|null} name - Navigation name
 * @property {React.LazyExoticComponent|React.ReactNode} component - Route component
 * @property {boolean} layout - Whether to use layout wrapper
 * @property {Function} [contextprovider] - Optional context provider
 * @property {React.ComponentType} [sidebar] - Optional sidebar component
 */

// routes.js
import React from "react";
import { LandingProvider } from "./shared/context/landing-context";
import { ProjectProvider } from "./shared/context/ProjectContext";
import Landing from "./features/landing/Landing";
import AuthPages from "./shared/components/Auth/AuthPages";
import PrimarySidebar from "./features/project/PrimarySidebar";
import LoginSignupPages from "./shared/components/Auth/LoginSignupPages";

// Group routes by feature area
const PUBLIC_ROUTES = {
  landing: {
    protected: false,
    title: "Rapid Knowledge Graph Extraction",
    path: "/",
    name: null,
    layout: false,
    component: (
      <LandingProvider>
        <Landing />
      </LandingProvider>
    ),
  },
  pricing: {
    protected: false,
    title: "Pricing",
    path: "/pricing",
    name: "Pricing",
    component: React.lazy(() => import("./features/landing/Pricing")),
    layout: false,
  },
  error: {
    protected: false,
    title: "Something went wrong",
    path: "/error",
    name: null,
    layout: false,
    component: <AuthPages page="error" />,
  },
};

const DASHBOARD_ROUTES = {
  home: {
    protected: true,
    title: "Home",
    path: "/home",
    name: "Home",
    component: React.lazy(() => import("./features/home/Home")),
    layout: true,
  },
  dashboard: {
    protected: true,
    title: "Dashboard",
    path: "/dashboard/:projectId/:view",
    name: "Dashboard",
    component: React.lazy(() => import("./features/dashboard/Dashboard")),
    layout: false,
  },
};

const PROJECT_ROUTES = {
  explorer: {
    protected: true,
    title: "Projects Explorer",
    path: "/projects-explorer",
    name: "Projects Explorer",
    component: React.lazy(() => import("./features/projects/Projects")),
    layout: true,
  },
  create: {
    protected: true,
    title: "New Project",
    path: "/project-creator/:step",
    name: "New Project",
    component: React.lazy(() =>
      import("./features/projectcreation/CreateProject")
    ),
    layout: true,
  },
  annotation: {
    protected: true,
    title: "Annotation",
    path: "/annotation/:projectId",
    name: "Annotation",
    component: React.lazy(() => import("./features/project/Project")),
    contextprovider: ProjectProvider,
    sidebar: PrimarySidebar,
    layout: false,
  },
};

const RESOURCE_ROUTES = {
  explorer: {
    protected: true,
    title: "Resources Explorer",
    path: "/resources-explorer",
    name: "Resources Explorer",
    component: React.lazy(() => import("./features/resources/Resources")),
    layout: true,
  },
  create: {
    protected: true,
    title: "New Resource",
    path: "/resource-creator/:step",
    name: "New Resource",
    component: React.lazy(() => import("./features/resources/Create")),
    layout: true,
  },
  manage: {
    protected: true,
    title: "Resource Management",
    path: "/resource-management/:resourceId",
    name: "Resource Management",
    component: React.lazy(() => import("./features/resources/Resource")),
    layout: true,
  },
};

const DATASET_ROUTES = {
  explorer: {
    protected: true,
    title: "Datasets Explorer",
    path: "/datasets-explorer",
    name: "Datasets Explorer",
    component: React.lazy(() => import("./features/datasets/Datasets")),
    layout: true,
  },
  create: {
    protected: true,
    title: "New Dataset",
    path: "/dataset-creator/:step",
    name: "New Dataset",
    component: React.lazy(() => import("./features/datasets/Create")),
    layout: true,
    metadata: {
      validSteps: ["details", "review"], // Implementation for TODO
    },
  },
  manage: {
    protected: true,
    title: "Dataset Management",
    path: "/dataset-management/:datasetId",
    name: "Dataset Management",
    component: React.lazy(() => import("./features/datasets/Dataset")),
    layout: true,
  },
};

const USER_ROUTES = {
  login: {
    protected: false,
    title: "Log In",
    path: "/auth",
    name: "Log In",
    component: <LoginSignupPages />,
    layout: false,
  },
  profile: {
    protected: true,
    title: "Account Settings",
    path: "/profile",
    name: "Account Settings",
    component: React.lazy(() => import("./features/profile/Profile")),
    layout: true,
  },
};

// Combine all routes
export const ROUTES = [
  ...Object.values(PUBLIC_ROUTES),
  ...Object.values(DASHBOARD_ROUTES),
  ...Object.values(PROJECT_ROUTES),
  ...Object.values(RESOURCE_ROUTES),
  ...Object.values(DATASET_ROUTES),
  ...Object.values(USER_ROUTES),
];

// Export individual route groups for more granular access
export {
  PUBLIC_ROUTES,
  DASHBOARD_ROUTES,
  PROJECT_ROUTES,
  RESOURCE_ROUTES,
  DATASET_ROUTES,
  USER_ROUTES,
};

// Helper functions
export const getRouteByPath = (path) =>
  ROUTES.find((route) => route.path === path);

export const getProtectedRoutes = () =>
  ROUTES.filter((route) => route.protected);

export const getPublicRoutes = () => ROUTES.filter((route) => !route.protected);
