import { useState, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axiosInstance from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { SnackbarContext } from "../../context/snackbar-context";

const useCreateProject = () => {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState({ open: false });
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);

  const handleCloseMessage = () =>
    setMessage((prevState) => ({ ...prevState, open: false }));

  const createProject = async (body) => {
    try {
      const token = await getAccessTokenSilently();
      setSubmitting(true);
      setError(false);

      const res = await axiosInstance.post("/project/", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        // console.log("res.data", res.data);
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully created project",
            severity: "success",
          },
        });
        navigate(`/projects-explorer`);
      } else {
        throw new Error("Unable to create project");
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to create project",
          severity: "error",
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const validateUsernames = async ({ usernames }) => {
    try {
      const token = await getAccessTokenSilently();
      setSubmitting(true);
      setError(false);
      const res = await axiosInstance.post(
        "/project/user/validation",
        usernames,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (error) {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    error,
    submitting,
    createProject,
    validateUsernames,
    message,
    handleCloseMessage,
  };
};

export default useCreateProject;
