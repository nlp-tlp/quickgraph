import { useState, useContext } from "react";
import axiosInstance from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { SnackbarContext } from "../../context/snackbar-context";

const useResource = () => {
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resource, setResource] = useState([]);

  const deleteResource = async (resourceId) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.delete(`/resources/${resourceId}`);

      if (res.status === 200) {
        navigate("/resources-explorer");
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully deleted resource",
            severity: "success",
          },
        });
      } else {
        throw new Error("Unable to delete resource");
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to delete resource",
          severity: "error",
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchResource = async (resourceId) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/resources/${resourceId}`);

      if (res.status === 200) {
        setResource(res.data);
      } else {
        throw new Error("Unable to retrieve resource");
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to retrieve resource",
          severity: "error",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const createResource = async (body) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.post("/resources", body);

      if (res.status === 200) {
        navigate(`/resource-management/${res.data._id}`);
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully created resource",
            severity: "success",
          },
        });
      } else {
        throw new Error("Unable to create resource");
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to create resource",
          severity: "error",
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateResource = async ({ resourceId, body }) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.patch(`/resources/${resourceId}`, body);

      if (res.status === 200) {
        setSubmitting(false);
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully updated resource",
            severity: "success",
          },
        });
      } else {
        throw new Error("Unable to update resource");
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to update resource",
          severity: "error",
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    error,
    submitting,
    fetchResource,
    resource,
    deleteResource,
    updateResource,
    createResource,
  };
};

export default useResource;
