import {
  generateTempId,
  createHistoryObject,
  findMatches,
} from "./ProjectUtils";
import axiosInstance from "../../utils/api";
import {
  applyAnnotation,
  deleteAnnotation,
  restoreMarkup,
  setValue,
  updateOptimisticItemState,
} from "./ProjectActions";

export const handleApply = async ({
  state,
  dispatch,
  snackbarDispatch,
  body,
  params,
  finallyFunction = null,
}) => {
  try {
    dispatch(setValue({ submitting: true }));

    // if (body.annotation_type === "entity" && params.apply_all) {
    //   const _optimisticEntityContent = state.flatOntology.filter(
    //     (i) => i.id === body.content.ontology_item_id
    //   )[0];

    //   console.log("_optimisticEntityContent", _optimisticEntityContent);

    //   const _optimisticPayload = {
    //     count: 1,
    //     label_name: _optimisticEntityContent.name,
    //     entities: [
    //       {
    //         id: generateTempId(),
    //         color: _optimisticEntityContent.color,
    //         fullname: _optimisticEntityContent.fullname,
    //         name: _optimisticEntityContent.name,
    //         ontology_item_id: _optimisticEntityContent.id,
    //         dataset_item_id: body.dataset_item_id,
    //         start: body.content.start, // Need to be calculated for other matches
    //         end: body.content.end, // Need to be calculated for other matches
    //         surface_form: "hello world", // Need to be calculated
    //         updated_at: new Date().toUTCString(), // Required for action tray...
    //         suggested: false, // Others need to be calculated
    //         //
    //         status: "pending", // success, pending, or error.
    //         error: null,
    //       },
    //     ],
    //     annotation_type: "entity",
    //     apply_all: params.apply_all,
    //   };

    //   console.log("_optimisticPayload", _optimisticPayload);
    //   // Optimistically update state - minimum info required {'count': 0, 'entities': [{id, surface_form, fullname, color, start, end, suggested, ontology_item_id, state, name}, ...], 'relations': [{... },...],

    //   dispatch(applyAnnotation({ entities: _optimisticPayload.entities }));

    //   //   TEST entity matching
    //   console.log(
    //     "findMatches",
    //     findMatches(
    //       state.texts,
    //       ["wrench"],
    //       state.entities,
    //       _optimisticEntityContent.id
    //     )
    //   );

    //   //   dispatch({ type: "APPLY_ANNOTATION", payload: _optimisticPayload });

    //   // TODO: create `UPDATE_APPLY_ANNOTATION` to reconcile ids, etc.
    //   // TODO: enforce incorrect annotations from the front end, e.g. no duplicate spans.

    //   // "body":
    //   //   {
    //   //     "project_id": "643abceb4e5f53e869a2c01e",
    //   //     "dataset_item_id": "643abcec4e5f53e869a2c025",
    //   //     "extra_dataset_item_ids": [
    //   //         "643abcec4e5f53e869a2c020",
    //   //         "643abcec4e5f53e869a2c021",
    //   //         "643abcec4e5f53e869a2c022",
    //   //         "643abcec4e5f53e869a2c023",
    //   //         "643abcec4e5f53e869a2c024",
    //   //         "643abcec4e5f53e869a2c025",
    //   //         "643abcec4e5f53e869a2c026",
    //   //         "643abcec4e5f53e869a2c027",
    //   //         "643abcec4e5f53e869a2c028",
    //   //         "643abcec4e5f53e869a2c029"
    //   //     ],
    //   //     "annotation_type": "entity",
    //   //     "suggested": false,
    //   //     "content": {
    //   //         "ontology_item_id": "2d9a35cf",
    //   //         "start": 0,
    //   //         "end": 0,
    //   //         "surface_form": "hello"
    //   //     }
    //   // }

    //   // Single update response body:
    //   //   {
    //   //     "count": 1,
    //   //     "label_name": "Organisation",
    //   //     "entities": [
    //   //         {
    //   //             "id": "643abe512e3ea8d31467e901",
    //   //             "color": "#2119a1",
    //   //             "fullname": "Organisation",
    //   //             "name": "Organisation",
    //   //             "start": 0,
    //   //             "end": 0,
    //   //             "surface_form": "hello",
    //   //             "suggested": false,
    //   //             "created_at": "2023-04-15T15:10:10.075000",
    //   //             "updated_at": "2023-04-15T15:10:10.075000",
    //   //             "dataset_item_id": "643abcec4e5f53e869a2c025",
    //   //             "ontology_item_id": "2d9a35cf",
    //   //             "state": "active"
    //   //         }
    //   //     ],
    //   //     "annotation_type": "entity",
    //   //     "apply_all": false
    //   // }
    // }

    const res = await axiosInstance.post("/markup/", body, {
      params: params,
    });

    if (res.status === 200) {
      console.log("res.data", res.data);
      dispatch({ type: "APPLY_ANNOTATION", payload: res.data });

      // dispatch(updateOptimisticItemState({ entities: res.data.entities }));

      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message:
            res.data.count > 0
              ? `Applied ${res.data.count} ${
                  res.data.annotation_type
                } annotation${res.data.count > 1 ? "s" : ""}`
              : "No annotations applied",
          severity: "success",
        },
      });

      if (res.data.count > 0) {
        state.history.write(
          createHistoryObject("apply", {
            ...res.data,
            ontology_item_id: body.content.ontology_item_id,
          })
        );
      }
    } else {
      throw new Error("Failed to apply annotation(s)");
    }
  } catch (error) {
    snackbarDispatch({
      type: "UPDATE_SNACKBAR",
      payload: {
        message: "Failed to apply annotation(s)",
        severity: "error",
      },
    });
  } finally {
    dispatch(setValue({ submitting: false }));

    if (finallyFunction) {
      finallyFunction();
    }
  }
};

export const deleteMarkupOptimistically = async ({
  state,
  dispatch,
  snackbarDispatch,
  markupId,
  datasetItemId,
  params,
  finallyFunction,
}) => {
  // NOTE: THIS ONLY WORKS FOR SINGLE ENTITIES
  dispatch(setValue({ submitting: true }));

  // Create backup of the markup to be deleted
  const markupToDelete = state.entities[datasetItemId].filter(
    (e) => e.id === markupId
  )[0];
  // console.log("markupToDelete", markupToDelete);

  // Optimistically remove the markup from the state
  dispatch(deleteAnnotation({ entity_ids: markupId }));

  try {
    // Call the API to delete the markup
    // throw new Error(`API returned status code: ${res.status}`);

    const res = await axiosInstance.delete(`/markup/${markupId}`, {
      params: params,
    });
    // // Check if the response status is not 200, and throw an error if needed
    if (res.status !== 200) {
      throw new Error(`API returned status code: ${res.status}`);
    }

    snackbarDispatch({
      type: "UPDATE_SNACKBAR",
      payload: {
        message: `Deleted ${res.data.count} ${
          res.data.annotation_type
        } annotation${res.data.count > 1 ? "s" : ""}`,
        severity: "success",
      },
    });
    if (res.data.count > 0) {
      state.history.write(createHistoryObject("delete", res.data));
    }
  } catch (error) {
    // If the API call fails, restore the backup of the markup to the state
    dispatch(
      restoreMarkup({ entities: { [datasetItemId]: [markupToDelete] } })
    );

    snackbarDispatch({
      type: "UPDATE_SNACKBAR",
      payload: {
        message: "Failed to delete annotation(s)",
        severity: "error",
      },
    });
  } finally {
    dispatch(setValue({ submitting: false }));
    if (finallyFunction) {
      finallyFunction();
    }
  }
};

export const handleDelete = async ({
  state,
  dispatch,
  snackbarDispatch,
  markupId,
  params,
  finallyFunction,
}) => {
  try {
    dispatch(setValue({ submitting: true }));

    const res = await axiosInstance.delete(`/markup/${markupId}`, {
      params: params,
    });

    if (res.status === 200) {
      dispatch(
        deleteAnnotation({
          entity_ids: res.data.entity_ids,
          relation_ids: res.data.relation_ids,
        })
      );
      // dispatch({ type: "DELETE_ANNOTATION", payload: res.data });

      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: `Deleted ${res.data.count} ${
            res.data.annotation_type
          } annotation${res.data.count > 1 ? "s" : ""}`,
          severity: "success",
        },
      });
      if (res.data.count > 0) {
        state.history.write(createHistoryObject("delete", res.data));
      }
    } else {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to delete annotation(s)",
          severity: "error",
        },
      });

      //   Restore optimistic delete
      //   ...
    }
  } catch (error) {
    snackbarDispatch({
      type: "UPDATE_SNACKBAR",
      payload: {
        message: "Failed to delete annotation(s)",
        severity: "error",
      },
      //   Restore optimistic delete
      //   ...
    });
  } finally {
    dispatch({ type: "SET_VALUE", payload: { submitting: false } });
    if (finallyFunction) {
      finallyFunction();
    }
  }
};
