import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axiosInstance from "../../utils/api";

const useDatasets = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState(false);

  const fetchDatasets = async ({
    include_dataset_size = true,
    include_system = false,
  }) => {
    getAccessTokenSilently().then((token) => {
      setLoading(true);
      setError(false);
      axiosInstance
        .get("/dataset/", {
          params: {
            include_dataset_size: include_dataset_size,
            include_system: include_system,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setDatasets(res.data);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    });
  };

  const fetchProjectCreationDatasets = async () => {
    getAccessTokenSilently().then((token) => {
      setLoading(true);
      setError(false);
      axiosInstance
        .get("/dataset/", {
          params: { include_dataset_size: true, include_system: true },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          // TODO: Make this filter in the backend server.
          setDatasets(res.data.filter((d) => d.is_blueprint));
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    });
  };

  return {
    loading,
    error,
    datasets,
    fetchProjectCreationDatasets,
    fetchDatasets,
  };
};

export default useDatasets;
