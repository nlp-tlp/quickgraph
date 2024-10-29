import { useState, useContext } from "react";
import { DashboardContext } from "../../context/dashboard-context";
import axiosInstance from "../../utils/api";
import qs from "qs";
import { SnackbarContext } from "../../context/snackbar-context";

const useGraph = () => {
  const [state, dispatch] = useContext(DashboardContext);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState();
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);

  const fetchGraph = async (params) => {
    try {
      console.log("params", params);

      const res = await axiosInstance.get(`/graph/${state.projectId}`, {
        params: params,
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: "comma" });
        },
      });

      if (res.status === 200) {
        console.log("fetchGraph res!!!", res.data);

        setData(res.data);

        // dispatch({
        //   type: "SET_GRAPH_DATA",
        //   payload: {
        //     graphData: res.data.data,
        //     graphOntology: res.data.ontology,
        //     graphMetrics: res.data.metrics,
        //   },
        // });
      } else {
        setError(true);
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: { message: "Unable to retrieve graph", severity: "error" },
        });
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: { message: "Unable to retrieve graph", severity: "error" },
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    data,
    submitting,
    fetchGraph,
  };
};

export default useGraph;
