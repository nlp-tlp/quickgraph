import { useState } from "react";
import axiosInstance from "../../utils/api";

const useDatasets = () => {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState(false);
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

  const fetchDatasets = async ({
    include_dataset_size = true,
    include_system = false,
  } = {}) => {
    try {
      setLoading(true);
      setError(false);

      const response = await axiosInstance.get("/dataset", {
        params: {
          include_dataset_size,
          include_system,
        },
      });

      setDatasets(response.data);
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to fetch datasets",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectCreationDatasets = async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await axiosInstance.get("/dataset", {
        params: {
          include_dataset_size: true,
          include_system: true,
        },
      });

      // TODO: Make this filter in the backend server.
      setDatasets(response.data.filter((dataset) => dataset.is_blueprint));
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to fetch project creation datasets",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    datasets,
    fetchProjectCreationDatasets,
    fetchDatasets,
    message,
    handleMessageClose,
  };
};

export default useDatasets;
