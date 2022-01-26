import React, { useEffect, useContext } from "react";
import { Redirect, Route } from "react-router-dom";
import axios from "../utils/api-interceptor";
import { toast } from "react-toastify";
import history from "../utils/history";
import { selectIsAuthenticated, validateCookie } from "./userSlice";
import { useDispatch, useSelector } from "react-redux";

export const ProtectedRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  // Trigger a call to the api. This will force the session to expire
  // even if no API calls exist on the protected route.

  // useEffect(() => {
  //   const checkToken = async () => {
  //     const expiredToastId = "session-expired-toast-id";
  //     return axios.get("/api/auth/token/validate").then(function (response) {
  //       if (response.data.valid) {
  //         setIsAuthenticated(true);
  //       } else {
  //         setIsAuthenticated(false);
  //         window.localStorage.removeItem("token");
  //         toast.info("Session expired. Please log in.", {
  //           toastId: expiredToastId,
  //           position: "top-center",
  //           hideProgressBar: false,
  //           closeOnClick: true,
  //           pauseOnHover: true,
  //           draggable: true,
  //           progress: 0,
  //         });
  //         history.push("/");
  //       }
  //     });
  //   };
  //   checkToken().catch((error) => console.debug(error));
  // });

  // const token = window.localStorage.getItem("token");
  if (isAuthenticated) {
    return <Route {...rest} />;
  } else {
    return <Redirect to="/unauthorized" />;
  }
};
