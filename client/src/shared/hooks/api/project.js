import { useState, useContext } from "react";
import axiosInstance from "../../utils/api";
import { texts as demoTexts } from "../../demo/data";
import { v4 as uuidv4 } from "uuid";
import { SnackbarContext } from "../../context/snackbar-context";

const useProject = ({ state, dispatch }) => {
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState();

  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);

  let fetchTexts, deleteAction, acceptAction, applyAction, saveAction;

  if (state.demo) {
    fetchTexts = () => {
      dispatch({
        type: "SET_TEXTS",
        payload: demoTexts,
      });
      dispatch({ type: "SET_VALUE", payload: { tasks: demoTexts.tasks } });
    };

    deleteAction = (payload) => {
      console.log("demo delete payload", payload);

      if (payload.annotationType === "entity") {
        dispatch({
          type: "DELETE_ANNOTATION",
          payload: {
            entities: {
              [payload.textId]: [payload.spanId],
            },
          },
        });
      } else {
        dispatch({
          type: "DELETE_ANNOTATION",
          payload: {
            relations: {
              [payload.textId]: [
                `${payload.sourceEntityId}${payload.targetEntityId}${payload.relationLabelId}`,
              ],
            },
          },
        });
      }
    };
    applyAction = (payload) => {
      let label;

      if (payload.annotationType === "entity") {
        label = state.ontology.filter((i) => i.id === payload.entityLabelId)[0];
        if (!payload.applyAll) {
          const entityNotExist =
            state.entities[payload.textId].filter(
              (e) =>
                e.start === payload.entitySpanStart &&
                e.end === payload.entitySpanEnd &&
                e.labelId === payload.entityLabelId
            ).length == 0;

          if (entityNotExist) {
            dispatch({
              type: "APPLY_ANNOTATION",
              payload: {
                entities: {
                  [payload.textId]: [
                    ...state.entities[payload.textId],
                    {
                      _id: uuidv4(),
                      textId: payload.textId,
                      isEntity: true,
                      createdBy: "demo",
                      start: payload.entitySpanStart,
                      end: payload.entitySpanEnd,
                      labelId: payload.entityLabelId,
                      suggested: payload.suggested,
                      name: label.name,
                      fullName: label.fullName,
                      color: label.color,
                    },
                  ],
                },
                relations: {},
                count: 1,
                labelName: label.name,
              },
            });
          }
        }
      } else {
        // Relation
        label = state.ontology.filter(
          (i) => i.id === payload.relationLabelId
        )[0];
        dispatch({
          type: "APPLY_ANNOTATION",
          payload: {
            entities: {},
            relations: {
              [payload.textId]: [
                {
                  _id: uuidv4(),
                  textId: payload.textId,
                  isEntity: false,
                  createdBy: "demo",
                  source: payload.sourceEntityId,
                  target: payload.targetEntityId,
                  labelId: payload.relationLabelId,
                  suggested: payload.suggest,
                  name: label.name,
                  fullName: label.fullName,
                },
              ],
            },
            count: 1,
            labelName: label.name,
          },
        });
      }
    };
    acceptAction = (payload) => {
      console.log("demo accept payload", payload);
      // dispatch({ type: "ACCEPT_ANNOTATION", payload: "" });
    };

    saveAction = (textId) => {
      dispatch({
        type: "SAVE_DATASET_ITEMS",
        payload: {
          data: [{ ...state.texts[textId], saved: !state.texts[textId].saved }],
        },
      });
    };
  }

  const editEntityMarkup = async ({
    markupId,
    ontologyItemId,
    textId,
    finallyFunction,
  }) => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.patch(`/markup/edit/${markupId}`, {
        ontology_item_id: ontologyItemId,
      });

      if (res.status === 200) {
        // Find entities assigned to textId and update the span that has been succesfully updated.
        const updatedEntities = state.entities[textId].map((e) =>
          e.id === res.data.id
            ? {
                ...e,
                name: res.data.name,
                fullname: res.data.fullname,
                color: res.data.color,
                ontology_item_id: res.data.ontology_item_id,
              }
            : e
        );

        // Trigger snackbar to update user of successful state change
        const toastInfo = {
          action: "edit",
          applyAll: false,
          annotationType: "entity",
          content: {
            label: res.data.name,
            count: 1,
            datasetItemIds: [],
          },
        };

        dispatch({
          type: "SET_VALUE",
          payload: {
            entities: { ...state.entities, [textId]: updatedEntities },
            toastInfo: toastInfo,
            showToast: true,
          },
        });
      }
    } catch (error) {
      setError(true);
    } finally {
      setIsLoading(false);
      if (finallyFunction) {
        finallyFunction();
      }
    }
  };

  const applyFlag = async ({ datasetItemId, flagState }) => {
    try {
      // setIsLoading(true);
      const res = await axiosInstance.post(
        `/markup/flag/${datasetItemId}`,
        null,
        {
          params: { state: flagState },
        }
      );

      if (res.status === 200) {
        const updatedFlags = [...state.texts[datasetItemId].flags, res.data];
        const updatedTexts = {
          ...state.texts,
          [datasetItemId]: {
            ...state.texts[datasetItemId],
            flags: updatedFlags,
          },
        };
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Succesfully added flag to dataset item",
            severity: "success",
          },
        });

        dispatch({
          type: "SET_VALUE",
          payload: {
            texts: updatedTexts,
          },
        });
      } else {
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Unable to add flag to dataset item",
            severity: "error",
          },
        });
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to add flag to dataset item",
          severity: "error",
        },
      });
    }
  };

  const deleteFlag = async ({ datasetItemId, flagState }) => {
    try {
      const res = await axiosInstance.delete(`/markup/flag/${datasetItemId}`, {
        params: {
          state: flagState,
        },
      });

      if (res.status === 200) {
        const updatedFlags = state.texts[datasetItemId].flags.filter(
          (f) => f.state !== flagState
        );

        const updatedTexts = {
          ...state.texts,
          [datasetItemId]: {
            ...state.texts[datasetItemId],
            flags: updatedFlags,
          },
        };

        dispatch({
          type: "SET_VALUE",
          payload: {
            texts: updatedTexts,
          },
        });
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully removed flag from dataset item",
            severity: "success",
          },
        });
      } else {
        setError(true);
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Unable to remove flag from dataset item",
            severity: "error",
          },
        });
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to remove flag from dataset item",
          severity: "error",
        },
      });
    }
  };

  const fetchInsights = async (projectId) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/markup/insights/${projectId}`);

      if (res.status === 200) {
        setData(res.data);
      } else {
        setError(true);
      }
    } catch (error) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDatasetClusters = async (projectId) => {
    try {
      const res = await axiosInstance.get(`/project/${projectId}/clusters`);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error("Unable to fetch project dataset clusters");
      }
    } catch (error) {
      setError(true);
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to retrieve project dataset clusters",
          severity: "error",
        },
      });
    }
  };

  return {
    loading,
    error,
    data,
    isLoading,
    applyAction,
    acceptAction,
    deleteAction,
    fetchTexts,
    saveAction,
    editEntityMarkup,
    applyFlag,
    deleteFlag,
    fetchInsights,
    fetchProjectDatasetClusters,
  };
};

export default useProject;

// Trigger hook will set the state of `loading` which will trigger the UI to show the user the CRUD operation is being performed;
// This will be done in-situ state rather than via context state.
