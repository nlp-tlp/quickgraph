import { useSelector } from "react-redux";
import { Redirect, Route } from "react-router-dom";
import { selectIsAuthenticated } from "./userSlice";

export const ProtectedRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (isAuthenticated) {
    return <Route {...rest} />;
  } else {
    return <Redirect to="/unauthorized" />;
  }
};
