import { useState, useContext } from "react";
import { DashboardContext } from "../../context/dashboard-context";
import axiosInstance from "../../utils/api";

const useDashboard = () => {
  const { state, dispatch } = useContext(DashboardContext);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState();
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

  const fetchDashboardOverview = async ({ projectId }) => {
    try {
      setError(false);
      setLoading(true);

      const response = await axiosInstance.get(
        `/dashboard/overview/${projectId}`
      );
      setData(response.data);
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to fetch dashboard overview",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGraph = async ({ projectId, filters }) => {
    try {
      setLoading(true);
      setError(false);

      const response = await axiosInstance.get(`/graph/${projectId}`, {
        params: { filters },
      });

      dispatch({
        type: "SET_GRAPH_DATA",
        payload: {
          graphData: response.data.data,
          graphOntology: response.data.ontology,
          graphMetrics: response.data.metrics,
        },
      });
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to fetch graph data",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOntology = async (ontology, isEntity) => {
    try {
      setSubmitting(true);
      setError(false);

      const response = await axiosInstance.patch(
        `/api/project/ontology/${state.projectId}`,
        { ontology, isEntity }
      );

      dispatch({
        type: "SET_VALUE",
        payload: { ontology: response.data },
      });
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to update ontology",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filterAdjudication = async ({
    page = 1,
    sortDirection = "",
    searchTerm = "",
    flags = "",
    minAgreement = 0,
    datasetItemId = "",
  } = {}) => {
    try {
      setLoading(true);
      setError(false);

      const response = await axiosInstance.get(
        `/dashboard/adjudication/${state.projectId}`,
        {
          params: {
            skip: page - 1,
            limit: 1,
            sort: sortDirection,
            search_term: searchTerm,
            flags: flags,
            min_agreement: minAgreement,
            dataset_item_id: datasetItemId,
          },
        }
      );

      setData(response.data);
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to filter adjudication data",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAnnotations = async () => {
    try {
      setSubmitting(true);
      setError(false);

      // TODO: Implement annotation download logic
      console.log("downloading annotations...");
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to download annotations",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    error,
    data,
    submitting,
    message,
    handleMessageClose,
    fetchDashboardOverview,
    updateOntology,
    fetchGraph,
    filterAdjudication,
    downloadAnnotations,
  };
};

export default useDashboard;
