import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axiosInstance from "../../utils/api";

const useResources = () => {
  const { getAccessTokenSilently } = useAuth0();
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
  }) => {
    getAccessTokenSilently().then((token) => {
      setLoading(true);
      setError(false);
      axiosInstance
        .get("/resources/", {
          params: { aggregate: aggregate, include_system: include_system },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setResources(res.data);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    });
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
