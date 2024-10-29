/**
 * Demo API - emulates project interaction; similar calls as `/hooks/api/project.js` however no data is persisted.
 */
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axiosInstance from "../../utils/api";

const useLanding = ({ state, dispatch }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    // Fetches demo project for landing page - no auth required.
    console.log("Fetching demo data");
    axiosInstance
      .get("/demo")
      .then((res) => {
        console.log(res.data);
        dispatch({
          type: "SET_DEMO",
          payload: res.data,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  const deleteAction = (payload) => {
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
  const applyAction = (payload) => {
    console.log("demo apply payload", payload);
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
      label = state.ontology.filter((i) => i.id === payload.relationLabelId)[0];
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
  const acceptAction = (payload) => {
    console.log("demo accept payload", payload);

    // dispatch({ type: "ACCEPT_ANNOTATION", payload: "" });
  };

  const saveAction = (textId) => {
    dispatch({
      type: "SAVE_DATASET_ITEMS",
      payload: {
        data: [{ ...state.texts[textId], saved: !state.texts[textId].saved }],
      },
    });
  };

  return {
    loading,
    error,
    fetchData,
    applyAction,
    acceptAction,
    deleteAction,
    saveAction,
  };
};

export default useLanding;
