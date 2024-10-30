import { useState, useContext } from "react";
import axiosInstance from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { SnackbarContext } from "../../context/snackbar-context";

const useNotifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);

  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await axiosInstance.get("/notifications");

      if (res.status === 200) {
        setData(res.data);
      } else {
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Failed to retrieve notification(s)",
            severity: "error",
          },
        });
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to retrieve notification(s)",
          severity: "error",
        },
      });
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const acceptNotification = async ({ notification }) => {
    try {
      setLoading(true);
      setError(false);

      const res = await axiosInstance.patch(
        `/notifications/${notification._id}/invite`,
        null,
        { params: { accepted: true } }
      );

      if (res.status === 200) {
        navigate(`/dashboard/${notification.content_id}/overview`);
      } else {
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Failed to accept notification",
            severity: "error",
          },
        });
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to accept notification",
          severity: "error",
        },
      });
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const declineNotification = async ({ notificationId }) => {
    try {
      setLoading(true);
      setError(false);

      const res = await axiosInstance.patch(
        `/notifications/${notificationId}/invite`,
        null,
        { params: { accepted: false } }
      );
      if (res.status !== 200) {
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Failed to decline notification",
            severity: "error",
          },
        });
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to decline notification",
          severity: "error",
        },
      });
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    submitting,
    data,
    fetchNotifications,
    acceptNotification,
    declineNotification,
  };
};

export default useNotifications;
