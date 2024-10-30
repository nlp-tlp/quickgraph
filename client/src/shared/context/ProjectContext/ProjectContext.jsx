import * as React from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/api";
import { SnackbarContext } from "../snackbar-context";
import { reducer, initialState } from "./ProjectReducer";
import { createHistoryObject } from "./ProjectUtils";

import {
  deleteMarkupOptimistically,
  handleApply,
  handleDelete,
} from "./ProjectOperations";

export const ProjectContext = React.createContext();

export const ProjectProvider = (props) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [snackbarState, snackbarDispatch] = React.useContext(SnackbarContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (state.projectId) {
      fetchProject(state.projectId);
      fetchProgress(state.projectId);
    }
  }, [state.projectId]);

  const fetchProject = async (projectId) => {
    try {
      const res = await axiosInstance.get(`/project/${projectId}`);

      if (res.status === 200) {
        dispatch({ type: "SET_PROJECT", payload: res.data });
      } else if (res.status === 404 || 401) {
        // Project not found - redirect
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message:
              "Project not found - it may not exist or you may be unauthorized",
            severity: "error",
          },
        });
        navigate("/home");
      } else {
        throw new Error();
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: { message: "Error retrieving project", severity: "error" },
      });
      navigate("/home");
    }
  };

  const fetchProgress = async (projectId) => {
    try {
      const res = await axiosInstance.get(`/project/progress/${projectId}`);

      if (res.status === 200) {
        dispatch({
          type: "SET_VALUE",
          payload: { progress: res.data },
        });
      } else {
        throw new Error();
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to retrieve project progress metrics",
          severity: "error",
        },
      });
    }
  };

  const handleFetchDatasetItems = async (queryParams) => {
    // SaveStateFilters, QualityFilter, RelationsFilter, FlagsFilter
    try {
      dispatch({
        type: "SET_VALUE",
        payload: { submitting: true, textsLoading: true },
      });

      const res = await axiosInstance.get(`/dataset/filter/`, {
        params: queryParams,
      });

      if (res.status === 200) {
        dispatch({ type: "SET_TEXTS", payload: res.data });
        // If not in entity annotation mode,
        // then dispatch an action to remove source and target relationships
        if (!state.entityAnnotationMode) {
          dispatch({ type: "REMOVE_SOURCE_TARGET_RELS" });
          dispatch({ type: "TOGGLE_ENTITY_ANNOTATION_MODE" });
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to retrieve dataset item(s)",
          severity: "error",
        },
      });
    } finally {
      dispatch({
        type: "SET_VALUE",
        payload: { submitting: false, textsLoading: false },
      });
    }
  };

  const toggleSubmitting = () => {
    dispatch({
      type: "SET_VALUE",
      payload: { submitting: !state.submitting },
    });
  };

  // const handleApply = async ({ body, params, finallyFunction = null }) => {
  //   try {
  //     dispatch({ type: "SET_VALUE", payload: { submitting: true } });

  //     if (body.annotation_type === "entity") {
  //       const _optimisticEntityContent = state.flatOntology.filter(
  //         (i) => i.id === body.content.ontology_item_id
  //       )[0];

  //       console.log("_optimisticEntityContent", _optimisticEntityContent);

  //       const _optimisticPayload = {
  //         count: 1,
  //         label_name: _optimisticEntityContent.name,
  //         entities: [
  //           {
  //             id: generateTempId(),
  //             color: _optimisticEntityContent.color,
  //             fullname: _optimisticEntityContent.fullname,
  //             name: _optimisticEntityContent.name,
  //             ontology_item_id: _optimisticEntityContent.id,
  //             dataset_item_id: body.dataset_item_id,
  //             start: body.content.start, // Need to be calculated for other matches
  //             end: body.content.end, // Need to be calculated for other matches
  //             surface_form: "hello world", // Need to be calculated
  //             updated_at: new Date().toUTCString(), // Required for action tray...
  //             suggested: false, // Others need to be calculated
  //             //
  //             status: "pending", // success, pending, or error.
  //             error: null,
  //           },
  //         ],
  //         annotation_type: "entity",
  //         apply_all: params.apply_all,
  //       };

  //       console.log("_optimisticPayload", _optimisticPayload);
  //       // Optimistically update state - minimum info required {'count': 0, 'entities': [{id, surface_form, fullname, color, start, end, suggested, ontology_item_id, state, name}, ...], 'relations': [{... },...],
  //       dispatch({ type: "APPLY_ANNOTATION", payload: _optimisticPayload });

  //       // TODO: create `UPDATE_APPLY_ANNOTATION` to reconcile ids, etc.
  //       // TODO: enforce incorrect annotations from the front end, e.g. no duplicate spans.

  //       // "body":
  //       //   {
  //       //     "project_id": "643abceb4e5f53e869a2c01e",
  //       //     "dataset_item_id": "643abcec4e5f53e869a2c025",
  //       //     "extra_dataset_item_ids": [
  //       //         "643abcec4e5f53e869a2c020",
  //       //         "643abcec4e5f53e869a2c021",
  //       //         "643abcec4e5f53e869a2c022",
  //       //         "643abcec4e5f53e869a2c023",
  //       //         "643abcec4e5f53e869a2c024",
  //       //         "643abcec4e5f53e869a2c025",
  //       //         "643abcec4e5f53e869a2c026",
  //       //         "643abcec4e5f53e869a2c027",
  //       //         "643abcec4e5f53e869a2c028",
  //       //         "643abcec4e5f53e869a2c029"
  //       //     ],
  //       //     "annotation_type": "entity",
  //       //     "suggested": false,
  //       //     "content": {
  //       //         "ontology_item_id": "2d9a35cf",
  //       //         "start": 0,
  //       //         "end": 0,
  //       //         "surface_form": "hello"
  //       //     }
  //       // }

  //       // Single update response body:
  //       //   {
  //       //     "count": 1,
  //       //     "label_name": "Organisation",
  //       //     "entities": [
  //       //         {
  //       //             "id": "643abe512e3ea8d31467e901",
  //       //             "color": "#2119a1",
  //       //             "fullname": "Organisation",
  //       //             "name": "Organisation",
  //       //             "start": 0,
  //       //             "end": 0,
  //       //             "surface_form": "hello",
  //       //             "suggested": false,
  //       //             "created_at": "2023-04-15T15:10:10.075000",
  //       //             "updated_at": "2023-04-15T15:10:10.075000",
  //       //             "dataset_item_id": "643abcec4e5f53e869a2c025",
  //       //             "ontology_item_id": "2d9a35cf",
  //       //             "state": "active"
  //       //         }
  //       //     ],
  //       //     "annotation_type": "entity",
  //       //     "apply_all": false
  //       // }
  //     }

  //     const token = await getAccessTokenSilently();

  //     const res = await axiosInstance.post("/markup/", body, {
  //       params: params,
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     if (res.status === 200) {
  //       console.log("res.data", res.data);
  //       // dispatch({ type: "APPLY_ANNOTATION", payload: res.data });

  //       dispatch({ type: "UPDATE_MARKUP_STATUS", payload: res.data });

  //       snackbarDispatch({
  //         type: "UPDATE_SNACKBAR",
  //         payload: {
  //           message:
  //             res.data.count > 0
  //               ? `Applied ${res.data.count} ${
  //                   res.data.annotation_type
  //                 } annotation${res.data.count > 1 ? "s" : ""}`
  //               : "No annotations applied",
  //           severity: "success",
  //         },
  //       });

  //       if (res.data.count > 0) {
  //         state.history.write(
  //           createHistoryObject("apply", {
  //             ...res.data,
  //             ontology_item_id: body.content.ontology_item_id,
  //           })
  //         );
  //       }
  //     } else {
  //       snackbarDispatch({
  //         type: "UPDATE_SNACKBAR",
  //         payload: {
  //           message: "Failed to apply annotation(s)",
  //           severity: "error",
  //         },
  //       });
  //     }
  //   } catch (error) {
  //     snackbarDispatch({
  //       type: "UPDATE_SNACKBAR",
  //       payload: {
  //         message: "Failed to apply annotation(s)",
  //         severity: "error",
  //       },
  //     });
  //   } finally {
  //     dispatch({ type: "SET_VALUE", payload: { submitting: false } });

  //     if (finallyFunction) {
  //       finallyFunction();
  //     }
  //   }
  // };

  const handleAccept = async ({ markupId, params, finallyFunction }) => {
    try {
      dispatch({ type: "SET_VALUE", payload: { submitting: true } });

      const res = await axiosInstance.patch(`/markup/${markupId}`, null, {
        params: params,
      });

      if (res.status === 200) {
        dispatch({ type: "ACCEPT_ANNOTATION", payload: res.data });
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: `Accepted ${res.data.count} ${
              res.data.annotation_type
            } annotation${res.data.count > 1 ? "s" : ""}`,
            severity: "success",
          },
        });
        if (res.data.count > 0) {
          state.history.write(createHistoryObject("accept", res.data));
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to accept annotation(s)",
          severity: "error",
        },
      });
    } finally {
      dispatch({ type: "SET_VALUE", payload: { submitting: false } });
      if (finallyFunction) {
        finallyFunction();
      }
    }
  };

  // const handleDelete = async ({ markupId, params, finallyFunction }) => {
  //   try {
  //     const token = await getAccessTokenSilently();
  //     dispatch({ type: "SET_VALUE", payload: { submitting: true } });

  //     const res = await axiosInstance.delete(`/markup/${markupId}`, {
  //       params: params,
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     if (res.status === 200) {
  //       dispatch({ type: "DELETE_ANNOTATION", payload: res.data });
  //       snackbarDispatch({
  //         type: "UPDATE_SNACKBAR",
  //         payload: {
  //           message: `Deleted ${res.data.count} ${
  //             res.data.annotation_type
  //           } annotation${res.data.count > 1 ? "s" : ""}`,
  //           severity: "success",
  //         },
  //       });
  //       if (res.data.count > 0) {
  //         state.history.write(createHistoryObject("delete", res.data));
  //       }
  //     } else {
  //       snackbarDispatch({
  //         type: "UPDATE_SNACKBAR",
  //         payload: {
  //           message: "Failed to delete annotation(s)",
  //           severity: "error",
  //         },
  //       });
  //     }
  //   } catch (error) {
  //     snackbarDispatch({
  //       type: "UPDATE_SNACKBAR",
  //       payload: {
  //         message: "Failed to delete annotation(s)",
  //         severity: "error",
  //       },
  //     });
  //   } finally {
  //     toggleSubmitting();
  //     dispatch({ type: "SET_VALUE", payload: { submitting: false } });
  //     if (finallyFunction) {
  //       finallyFunction();
  //     }
  //   }
  // };

  const handleSave = async (dataset_item_ids) => {
    try {
      dispatch({ type: "SET_VALUE", payload: { submitting: true } });

      // Optimistically update state
      dispatch({
        type: "SAVE_DATASET_ITEMS",
        payload: {
          datasetItemIds: dataset_item_ids,
          count: dataset_item_ids.length,
        },
      });

      const res = await axiosInstance.patch("/project/save", {
        project_id: state.projectId,
        dataset_item_ids: dataset_item_ids,
      });

      if (res.status === 200) {
        // dispatch({
        //   type: "SAVE_DATASET_ITEMS",
        //   payload: { datasetItemIds: dataset_item_ids, count: res.data.count },
        // });
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message:
              res.data.count > 0
                ? `Updated save state of ${res.data.count} dataset item${
                    res.data.count > 1 ? "s" : ""
                  }`
                : "No save states to update",
            severity: "success",
          },
        });
        if (res.data.count > 0) {
          state.history.write(createHistoryObject("save", res.data));
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to save dataset item(s)",
          severity: "error",
        },
      });
    } finally {
      dispatch({ type: "SET_VALUE", payload: { submitting: false } });
    }
  };

  const handleEdit = async ({
    markupId,
    ontologyItemId,
    datasetItemId,
    finallyFunction,
  }) => {
    try {
      dispatch({ type: "SET_VALUE", payload: { submitting: true } });

      const res = await axiosInstance.patch(`/markup/edit/${markupId}`, {
        ontology_item_id: ontologyItemId,
      });

      if (res.status === 200) {
        // Find entities assigned to textId and update the span that has been succesfully updated.

        // Only single entity is updatable at the moment
        const entity = res.data.entities[0];

        const updatedEntities = state.entities[datasetItemId].map((e) =>
          e.id === entity.id
            ? {
                ...e,
                name: entity.name,
                fullname: entity.fullname,
                color: entity.color,
                ontology_item_id: entity.ontology_item_id,
              }
            : e
        );
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message:
              res.data.count > 0
                ? `Edited ${res.data.count} entity annotation${
                    res.data.count > 1 ? "s" : ""
                  }`
                : "Edit not applied",
            severity: "success",
          },
        });

        dispatch({
          type: "SET_VALUE",
          payload: {
            entities: { ...state.entities, [datasetItemId]: updatedEntities },
          },
        });
        if (res.data.count > 0) {
          state.history.write(createHistoryObject("edit", res.data));
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: `Failed to edit annotation(s): ${error.response.data.detail}`,
          severity: "error",
        },
      });
    } finally {
      dispatch({ type: "SET_VALUE", payload: { submitting: false } });

      if (finallyFunction) {
        finallyFunction();
      }
    }
  };

  const fetchSuggestedEntities = async ({ projectId, surfaceForm }) => {
    try {
      const res = await axiosInstance.get(
        `/project/suggested-entities/${projectId}/${surfaceForm}`
      );

      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error();
      }
    } catch (error) {}
  };

  const value = {
    state,
    dispatch,
    handleApply: ({ body, params }) =>
      handleApply({ state, dispatch, snackbarDispatch, body, params }),
    handleAccept,
    handleDelete: ({ markupId, params, finallyFunction }) =>
      handleDelete({
        state,
        dispatch,
        snackbarDispatch,
        markupId,
        params,
        finallyFunction,
      }),
    handleSave,
    handleFetchDatasetItems,
    handleEdit,
    fetchSuggestedEntities,
    //
    deleteMarkupOptimistically: ({
      markupId,
      datasetItemId,
      params,
      finallyFunction,
    }) =>
      deleteMarkupOptimistically({
        state,
        dispatch,
        snackbarDispatch,
        markupId,
        datasetItemId,
        params,
        finallyFunction,
      }),
  };

  return (
    <ProjectContext.Provider value={value}>
      {props.children}
    </ProjectContext.Provider>
  );
};
