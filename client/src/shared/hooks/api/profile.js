import { useState, useContext } from "react";
import axiosInstance from "../../utils/api";
import { SnackbarContext } from "../../context/snackbar-context";

const useProfile = () => {
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState();

  const getProfile = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get("/users/profile");

      if (res.status === 200) {
        setData(res.data);
      } else {
        setError(true);
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            severity: "error",
            message: "Your profile information was unable to be retrieved",
          },
        });
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          severity: "error",
          message: "Your profile information was unable to be retrieved",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async ({ body }) => {
    try {
      const res = await axiosInstance.patch("/users/profile", body);

      if (res.status === 200) {
        setData(res.data);
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            severity: "success",
            message:
              "Your profile information has been successfully updated. Changes will take effect at next log in.",
          },
        });
      } else {
        setError(true);
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            severity: "error",
            message: "Your profile information was unable to be updated",
          },
        });
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          severity: "error",
          message: "Your profile information was unable to be updated",
        },
      });
    }
  };
  return {
    loading,
    data,
    error,
    getProfile,
    updateProfile,
  };
};

export default useProfile;
