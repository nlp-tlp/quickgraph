import { useState, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { DashboardContext } from "../../context/dashboard-context";
import axiosInstance from "../../utils/api";
import { SnackbarContext } from "../../context/snackbar-context";

const useDownload = () => {
  const { state } = useContext(DashboardContext);
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);
  const { getAccessTokenSilently } = useAuth0();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAnnotations = async ({ projectId, filters, annotators }) => {
    try {
      const token = await getAccessTokenSilently();
      setIsDownloading(true);

      const res = await axiosInstance.get(`/dashboard/download/${projectId}`, {
        params: {
          ...filters,
          usernames: annotators.join(","), // Need to stringify before sending to backend
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        console.log("download response", res.data);
        setIsDownloading(false);

        // Prepare for file download
        const fileName = `${state.name}_annotations_iaa-${filters.iaa}_q-${filters.quality}_s-${filters.saved}`;
        const json = JSON.stringify(res.data, null, 4);
        const blob = new Blob([json], { type: "application/json" });
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = fileName + ".json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Error
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Unable to download annotations",
            severity: "error",
          },
        });
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to download annotations",
          severity: "error",
        },
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isDownloading,
    downloadAnnotations,
  };
};

export default useDownload;
