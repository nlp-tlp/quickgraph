import { useState, useContext } from "react";
import axiosInstance from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { SnackbarContext } from "../../context/snackbar-context";

const useCreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState({ open: false });
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);

  const handleCloseMessage = () =>
    setMessage((prevState) => ({ ...prevState, open: false }));

  const createProject = async (body) => {
    try {
      setSubmitting(true);
      setError(false);

      const res = await axiosInstance.post("/project/", body);

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
      setSubmitting(true);
      setError(false);
      const res = await axiosInstance.post(
        "/project/user/validation",
        usernames
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
