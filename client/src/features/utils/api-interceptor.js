import axios from "axios";
import { toast } from "react-toastify";
import history from "./history";
import store from "../../app/store";
import { setIsAuthenticated } from "../auth/userSlice";

const errorHandler = (error) => {
  // Use a common toastId for "Session Expired" toast so there is only ever one
  const expiredToastId = "session-expired-toast-id";

  switch (error.response.status) {
    case 400:
      toast.error(`${error.response.data.message}`, {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      });
      break;
    case 403:
      toast.info("Session expired. Please log in.", {
        toastId: expiredToastId,
        position: "top-center",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      });
      store.dispatch(setIsAuthenticated(false));
      history.push("/");
      break;
    case 404:
      toast.error(`${error.response.data.message}`, {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      });
      break;
    case 409:
      toast.error(`${error.response.data.message}`, {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      });
      break;
    case 500:
      toast.error(`${error.response.data.detail}`, {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      });
      break;
    default:
      break;
  }

  return Promise.reject(error);
};

// axios instance for making requests
const axiosInstance = axios.create();

// response interceptor for handling common errors (e.g. HTTP 500)
axiosInstance.interceptors.response.use(
  (response) => {
    if (
      response.config.url === "/api/user/profile" &&
      response.config.method === "patch"
    ) {
      toast.success("Profile updated.", {
        toastId: "user-profile-update-toast",
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      });
    }
    if (
      response.config.url.includes("/api/project") &&
      response.config.method === "patch"
    ) {
      toast.success("Project updated.", {
        toastId: "project-settings-update-toast",
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      });
    }

    return response;
  },
  (error) => errorHandler(error)
);

export default axiosInstance;
