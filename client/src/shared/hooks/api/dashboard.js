import { useState, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { DashboardContext } from "../../context/dashboard-context";
import axiosInstance from "../../utils/api";

const useDashboard = () => {
  const { getAccessTokenSilently } = useAuth0();
  const { state, dispatch } = useContext(DashboardContext);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState();

  const fetchDashboardOverview = async ({ projectId }) => {
    try {
      setError(false);
      setLoading(true);

      const token = await getAccessTokenSilently();

      const res = await axiosInstance.get(`/dashboard/overview/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        setData(res.data);
      } else {
      }
    } catch (error) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchGraph = async ({ projectId, filters }) => {
    getAccessTokenSilently().then((token) => {
      axiosInstance
        .get(
          `/graph/${projectId}`,
          {
            filters: filters,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => {
          dispatch({
            type: "SET_GRAPH_DATA",
            payload: {
              graphData: response.data.data,
              graphOntology: response.data.ontology,
              graphMetrics: response.data.metrics,
            },
          });
        });
    });
  };

  const updateOntology = async (ontology, isEntity) => {
    getAccessTokenSilently().then((token) => {
      axiosInstance
        .patch(
          `/api/project/ontology/${state.projectId}`,
          { ontology, isEntity },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .then((res) =>
          dispatch({ type: "SET_VALUE", payload: { ontology: res.data } })
        )
        .catch((error) => console.log(`Error updating ontology: ${error}`));
    });
  };

  const filterAdjudication = async ({
    page,
    sortDirection,
    searchTerm = "",
    flags = "",
    minAgreement = 0,
    datasetItemId = "",
  }) => {
    getAccessTokenSilently().then((token) => {
      setLoading(true);
      axiosInstance
        .get(`/dashboard/adjudication/${state.projectId}`, {
          params: {
            skip: page - 1,
            limit: 1,
            sort: sortDirection,
            search_term: searchTerm,
            flags: flags,
            min_agreement: minAgreement,
            dataset_item_id: datasetItemId,
          },
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setData(res.data);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    });
  };

  const downloadAnnotations = async () => {
    console.log("downloading annotations...");
  };

  return {
    loading,
    error,
    data,
    submitting,
    fetchDashboardOverview,
    updateOntology,
    fetchGraph,
    filterAdjudication,
  };
};

export default useDashboard;
