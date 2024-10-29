import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../utils/api";
import { SnackbarContext } from "../../context/snackbar-context";

const useProjects = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get("/project");

      if (res.status === 200) {
        setData(res.data);
      } else {
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Failed to retrieve projects",
            severity: "error",
          },
        });
        setError(true);
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to retrieve projects",
          severity: "error",
        },
      });
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getSummary = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/project/summary");

      if (res.status === 200) {
        setData(res.data);
      } else {
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Failed to retrieve summary",
            severity: "error",
          },
        });
        setError(true);
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to retrieve summary",
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
    data,
    fetchProjects,
    getSummary,
  };
};

export default useProjects;
