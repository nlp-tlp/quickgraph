import { useState } from "react";
import axiosInstance from "../../utils/api";

const useResources = () => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState({
    open: false,
    severity: null,
    title: null,
    message: null,
  });

  const handleMessageClose = () =>
    setMessage((prevState) => ({
      ...prevState,
      open: false,
    }));

  const fetchResources = async ({
    aggregate = false,
    include_system = false,
  } = {}) => {
    setLoading(true);
    setError(false);

    try {
      const response = await axiosInstance.get("/resources", {
        params: {
          aggregate,
          include_system,
        },
      });
      setResources(response.data);
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to fetch resources",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    submitting,
    fetchResources,
    resources,
    message,
    handleMessageClose,
  };
};

export default useResources;
