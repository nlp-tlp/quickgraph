import { useState, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axiosInstance from "../../utils/api";
import { SnackbarContext } from "../../context/snackbar-context";

const useProfile = () => {
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);
  const { getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState();

  const getProfile = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();

      const res = await axiosInstance.get("/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      const token = await getAccessTokenSilently();

      const res = await axiosInstance.patch("/user/profile", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
