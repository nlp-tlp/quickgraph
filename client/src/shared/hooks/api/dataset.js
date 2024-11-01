import { useState, useContext } from "react";
import axiosInstance from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { SnackbarContext } from "../../context/snackbar-context";

const useDataset = () => {
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [error, setError] = useState(false);

  const deleteDataset = async (datasetId) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.delete(`/dataset/${datasetId}`);

      if (res.status === 200) {
        navigate("/datasets-explorer");
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully deleted dataset",
            severity: "success",
          },
        });
      } else {
        throw new Error("Unable to delete dataset");
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to delete dataset",
          severity: "error",
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchDataset = async (datasetId) => {
    try {
      const res = await axiosInstance.get(`/dataset/${datasetId}`, {
        params: {
          include_dataset_size: true,
          include_dataset_items: true,
          include_projects: true,
        },
      });

      if (res.status === 200) {
        setDataset(res.data);
      } else {
        throw new Error("Unable to retrieve dataset");
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to retrieve dataset",
          severity: "error",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const createDataset = async (body) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.post("/dataset", body);

      if (res.status === 200) {
        navigate(`/dataset-management/${res.data._id}`);
      } else {
        throw new Error("Failed to create dataset");
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to create dataset",
          severity: "error",
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDatasetItems = async (dataset_id, dataset_item_ids) => {
    try {
      const res = await axiosInstance.post("/dataset/delete-items", {
        dataset_id,
        dataset_item_ids,
      });
      if (
        res.status === 200 &&
        res.data.dataset_item_ids.length === dataset_item_ids.length
      ) {
        const updatedItems = dataset.items.filter(
          (i) => !res.data.dataset_item_ids.includes(i._id)
        );
        const updatedSize = updatedItems.length;

        setDataset((prevState) => ({
          ...prevState,
          items: updatedItems,
          size: updatedSize,
        }));
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully deleted selected item(s)",
            severity: "success",
          },
        });
      } else {
        throw new Error("Unable to delete the selected dataset item(s)");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to delete the selected dataset item(s)",
          severity: "error",
        },
      });
    }
  };

  // const addDatasetItem = async ({ datasetId, text, externalId = null }) => {
  //   try {
  //     const token = await getAccessTokenSilently();

  //     const res = await axiosInstance.post(
  //       "/dataset/item",
  //       { dataset_id: datasetId, original: text, external_id: externalId },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  //   } catch (error) {
  //     snackbarDispatch({
  //       type: "UPDATE_SNACKBAR",
  //       payload: {
  //         message: "Unable to add item to dataset",
  //         severity: "error",
  //       },
  //     });
  //   }
  // };

  const uploadDatasetItems = async ({
    dataset_id,
    data_type,
    items,
    is_annotated,
    preprocessing,
  }) => {
    try {
      const res = await axiosInstance.post(
        "/dataset/items",
        {
          dataset_items: items,
          preprocessing: preprocessing,
        },
        {
          params: { dataset_id, data_type, is_annotated },
        }
      );

      if (res.status === 200) {
        const newItems = [...dataset.items, ...res.data];
        const newSize = newItems.length;

        setDataset((prevState) => ({
          ...prevState,
          items: newItems,
          size: newSize,
        }));
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: `Successfully added ${res.data.length} dataset item${
              res.data.length > 0 ? "s" : ""
            }. Don't forget to assign them to project annotators.`,
            severity: "success",
          },
        });
      } else {
        throw new Error("Unable to add item(s) to dataset");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to add item(s) to dataset",
          severity: "error",
        },
      });
    }
  };

  //   const updateDataset = async (resource) => {
  //     setProcessingDataset(true);
  //     getAccessTokenSilently()
  //       .then((token) => {
  //         axiosInstance
  //           .patch("/resources/", resource, {
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //             },
  //           })
  //           .then((res) => {
  //             setProcessingDataset(false);
  //           })
  //           .catch((error) => console.error("Failed to update dataset"));
  //       })
  //       .finally(() => setProcessingDataset(false));
  //   };

  return {
    loading,
    error,
    dataset,
    fetchDataset,
    deleteDataset,
    // addDatasetItem,
    deleteDatasetItems,
    uploadDatasetItems,
    createDataset,
    submitting,
    // updateDataset,
  };
};

export default useDataset;
