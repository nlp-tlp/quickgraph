import React from "react";
import { Helmet } from "react-helmet";
import { Route, Router, Switch } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./features/auth/authcontext";
import { Login } from "./features/auth/login";
import { ProtectedRoute } from "./features/auth/protectedroute";
import { SignUp } from "./features/auth/signup";
import { Unauthorized } from "./features/auth/unauthorized";
import { Footer } from "./features/common/footer";
import { NavBar } from "./features/common/navbar";
import { Feed } from "./features/feed/feed";
import { Landing } from "./features/landing/landing";
import { PortalModal } from "./features/modals/modalportal";
import { AlertPortal } from "./features/alerts/alertportal";
import { Create } from "./features/projectcreation/create";
import { Project } from "./features/project/project";
import { Dashboard } from "./features/dashboard/Dashboard";
import { Anonpage } from "./features/auth/anonpage";
import { Profile } from "./features/profile/Profile";
import history from "./features/utils/history";

import { Dev } from "./features/dev/dev";

function App() {
  return (
    <Router history={history}>
      <AuthProvider>
        <Switch>
          <ProtectedRoute path="/profile">
            <Helmet>
              <title>Profile | QuickGraph</title>
            </Helmet>
            <NavBar />
            <Profile />
            <Footer />
          </ProtectedRoute>

          <ProtectedRoute path="/annotation/:projectId/page=:pageNumber">
            <Helmet>
              <title>Annotation | QuickGraph</title>
            </Helmet>
            <NavBar />
            <Project />
            <Footer />
            <PortalModal />
          </ProtectedRoute>

          <ProtectedRoute path="/project/new">
            <Helmet>
              <title>New Project | QuickGraph</title>
            </Helmet>
            <NavBar />
            <Create />
            <Footer />
            <AlertPortal />
          </ProtectedRoute>

          <ProtectedRoute path="/feed">
            <Helmet>
              <title>Project Feed | QuickGraph</title>
            </Helmet>
            <NavBar />
            <Feed />
            <Footer />
            <PortalModal />
          </ProtectedRoute>

          <ProtectedRoute path="/dashboard/:projectId/:viewKey">
            <Helmet>
              <title>Dashboard | QuickGraph</title>
            </Helmet>
            <NavBar />
            <Dashboard />
            <Footer />
            <PortalModal />
          </ProtectedRoute>

          {/* <Route exact path="/project/:projectId/:accessId/page/:pageNumber">
            <Helmet>
              <title>Annotation | QuickGraph</title>
            </Helmet>
            <NavBar />
            <Project />
            <Footer />
            <PortalModal />
          </Route> */}

          {/* <Route
            exact
            path="/project/:projectId/:accessId"
            component={Anonpage}
          /> */}

          <Route exact path="/dev" component={Dev} />

          <Route exact path="/unauthorized" component={Unauthorized} />

          <Route exact path="/login">
            <Helmet>
              <title>Login | QuickGraph</title>
            </Helmet>
            <Login />
          </Route>
          <Route exact path="/signup">
            <Helmet>
              <title>Signup | QuickGraph</title>
            </Helmet>
            <SignUp />
          </Route>
          <Route path="/">
            <Helmet>
              <title>QuickGraph | Rapid Knowledge Graph Extraction</title>
            </Helmet>
            <Landing />
          </Route>
        </Switch>
      </AuthProvider>
    </Router>
  );
}

export default App;
