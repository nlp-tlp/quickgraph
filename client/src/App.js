import "./App.css";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Route, BrowserRouter, Routes, Navigate } from "react-router-dom";
import Projects from "./features/projects/Projects";
import Landing from "./features/landing/Landing";
import CreateProject from "./features/projectcreation/CreateProject";
import Profile from "./features/profile/Profile";
import AuthPages from "./shared/components/Auth/AuthPages";
import PrivateRoute from "./shared/components/Auth/PrivateRoute";
import Layout from "./shared/components/Layout/Layout";
import Resources from "./features/resources/Resources";
import CssBaseline from "@mui/material/CssBaseline";
import { LandingProvider } from "./shared/context/landing-context";
import Datasets from "./features/datasets/Datasets";
import Dataset from "./features/datasets/Dataset";
import CreateDataset from "./features/datasets/Create";
import Home from "./features/home/Home";
import CreateResource from "./features/resources/Create";
import Resource from "./features/resources/Resource";

import Project from "./features/project";
import Dashboard from "./features/dashboard";
import Cleaner from "./features/cleaner";
import Banner from "./shared/components/Banner";
import PricingPage from "./features/landing/Pricing";

import LayoutHOC from "./shared/components/Layout/LayoutHOC";
import { ProjectProvider } from "./shared/context/ProjectContext";
import PrimarySidebar from "./features/project/PrimarySidebar";
import { useMediaQuery } from "@mui/material";
import DeviceTooSmall from "./shared/components/DeviceTooSmall";

function App() {
  // const [state, dispatch] = useContext(ProjectContext);
  const isTooSmall = useMediaQuery("(max-width:1000px)");

  // TODO: Figure out why this uses state.entityAnnotationMode for the trigger array
  // useEffect(() => {
  //   const handler = (e) => {
  //     if (e.ctrlKey && e.keyCode === 77) {
  //       dispatch({
  //         type: "SET_VALUE",
  //         payload: { entityAnnotationMode: !state.entityAnnotationMode },
  //       });
  //     }
  //   };

  //   window.addEventListener("keydown", handler, false);
  //   return () => window.removeEventListener("keydown", handler, false);
  // }, [state.entityAnnotationMode]);

  const routes = [
    {
      protected: true,
      title: "Home",
      path: "/home",
      name: "Home",
      component: <Home />,
      layout: true,
    },
    {
      protected: true,
      title: "Account Settings",
      path: "/profile",
      name: "Account Settings",
      component: <Profile />,
      layout: true,
    },
    // {
    //   protected: true,
    //   title: "Cleaner",
    //   path: "/cleaner/:datasetId",
    //   name: "Cleaner",
    //   component: <Cleaner />,
    //   layout: false,
    // },
    {
      protected: true,
      title: "Annotation",
      path: "/annotation/:projectId",
      name: "Annotation",
      component: <Project />,
      contextprovider: ProjectProvider,
      sidebar: PrimarySidebar,
      layout: false,
    },
    {
      protected: true,
      title: "New Project",
      path: "/project-creator/:step",
      name: "New Project",
      component: <CreateProject />,
      layout: true,
    },
    {
      protected: true,
      title: "Projects Explorer",
      path: "/projects-explorer",
      name: "Projects Explorer",
      component: <Projects />,
      layout: true,
    },
    {
      protected: true,
      title: "Resources Explorer",
      path: "/resources-explorer",
      name: "Resources Explorer",
      component: <Resources />,
      layout: true,
    },
    {
      protected: true,
      title: "New Resource",
      path: "/resource-creator/:step",
      name: "New Resource",
      component: <CreateResource />,
      layout: true,
    },
    {
      protected: true,
      title: "Resource Management",
      path: "/resource-management/:resourceId",
      name: "Resource Management",
      component: <Resource />,
      layout: true,
    },

    {
      protected: true,
      title: "Datasets Explorer",
      path: "/datasets-explorer",
      name: "Datasets Explorer",
      component: <Datasets />,
      layout: true,
    },
    {
      // TODO: Implement limit on step names ['details', 'review', ...]
      protected: true,
      title: "New Dataset",
      path: "/dataset-creator/:step",
      name: "New Dataset",
      component: <CreateDataset />,
      layout: true,
    },
    {
      protected: true,
      title: "Dataset Management",
      path: "/dataset-management/:datasetId",
      name: "Dataset Management",
      component: <Dataset />,
      layout: true,
    },
    {
      protected: true,
      title: "Dashboard",
      path: "/dashboard/:projectId/:view",
      name: "Dashboard",
      component: <Dashboard />,
      layout: false,
    },
    {
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
    {
      protected: false,
      title: "Pricing",
      path: "/pricing",
      name: "Pricing",
      component: <PricingPage />,
      layout: false,
    },
    {
      protected: false,
      title: "Something went wrong",
      path: "/error",
      name: null,
      layout: false,
      component: <AuthPages page={"error"} />,
    },
  ];

  // const [isBannerVisible, setIsBannerVisible] = useState(true);
  // const bannerHeight = "2rem";

  // useEffect(() => {
  //   const bannerDismissed = sessionStorage.getItem("bannerDismissed");
  //   if (!bannerDismissed) {
  //     setIsBannerVisible(true);
  //   }
  // }, []);

  // const handleBannerClose = () => {
  //   sessionStorage.setItem("bannerDismissed", "true");
  //   setIsBannerVisible(false);
  // };

  // useEffect(() => {
  //   document.body.style.paddingTop = isBannerVisible ? bannerHeight : "0";
  //   // Clean up the effect when the component is unmounted
  //   return () => {
  //     document.body.style.paddingTop = "0";
  //   };
  // }, [isBannerVisible, bannerHeight]);

  const renderRoute = (route, index) => {
    const routeElement = (
      <>
        <Helmet>
          <title>{route.title} | QuickGraph</title>
        </Helmet>
        {route.layout ? (
          // <LayoutHOC
          //   Sidebar={route.sidebar}
          //   ContextProviders={route.contextprovider}
          //   children={route.component}
          //   context={{ name: route.name }}
          // />
          <Layout children={route.component} context={{ name: route.name }} />
        ) : (
          route.component
        )}
      </>
    );

    const wrappedElement = route.protected ? (
      <PrivateRoute key={`private-route-${index}`}>{routeElement}</PrivateRoute>
    ) : (
      routeElement
    );

    return (
      <Route
        path={route.path}
        element={
          isTooSmall && !["/", "/pricing"].includes(route.path) ? (
            <DeviceTooSmall />
          ) : (
            wrappedElement
          )
        }
        key={`route-${index}`}
      />
    );
  };

  return (
    <BrowserRouter>
      <CssBaseline />
      <Routes>
        {routes.map((route, index) => renderRoute(route, index))}
        <Route
          exact
          path="/unauthorized"
          element={<AuthPages page={"unauthorized"} />}
        />
        <Route path="*" element={<AuthPages page={"notExist"} />} />
        <Route
          path="/dashboard"
          exact
          element={<Navigate to="/dashboard/overview" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
