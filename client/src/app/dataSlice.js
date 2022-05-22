import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../features/utils/api-interceptor";

const initialState = {
  textsStatus: "idle",
  textsError: null,
  annotationMode: "entity",
  selectedTokens: {},
  relations: null,
  entities: null,
  selectMode: {
    active: false,
    tokenIds: [],
    tokenIndexes: [],
    textId: null,
    startIndex: null,
    endIndex: null,
  },
  sourceSpan: null,
  targetSpan: null,
  relatedSpans: null,
  texts: [],
  page: 1,
  pageLimit: 10,
  totalPages: null,
  pageBeforeViewChange: null,
  clusterPage: 1,
  clusterTotalPages: null,
  activeCluster: null,
  clusterMetrics: {},
  showToast: false,
  toastInfo: null,
  showCluster: false,
  showQuickView: false,
};

export const getTotalPages = createAsyncThunk(
  "/data/texts/getTotalPages",
  async ({ projectId, getPages, filters, pageLimit }) => {
    const response = await axios.post(
      "/api/text/filter",
      {
        projectId: projectId,
        filters: filters,
        getPages: getPages,
      },
      {
        params: { limit: pageLimit },
      }
    );
    return response.data;
  }
);

export const fetchTexts = createAsyncThunk(
  "/data/texts/fetchTexts",
  async ({ projectId, getPages, filters, pageLimit, page }) => {
    const response = await axios.post(
      "/api/text/filter",
      {
        projectId: projectId,
        filters: filters,
        getPages: getPages,
      },
      {
        params: { page: page, limit: pageLimit },
      }
    );
    return response.data;
  }
);

export const applyAnnotation = createAsyncThunk(
  "/data/texts/applyAnnotation",
  async ({
    entitySpanStart,
    entitySpanEnd,
    entityLabelId,
    sourceEntityId,
    targetEntityId,
    relationLabelId,
    relationStart,
    relationEnd,
    relationText,
    targetTokenIds,
    relationTokenIds,
    textId,
    projectId,
    applyAll,
    annotationType,
    suggested,
    textIds, // Ids of texts on current users page
    entityText,
  }) => {
    const response = await axios.post(`/api/text/annotation/apply`, {
      entitySpanStart,
      entitySpanEnd,
      entityLabelId,
      sourceEntityId,
      targetEntityId,
      relationLabelId,
      relationTokenIds, // Array of tokens for open relation extraction. Used to build relation label.
      relationStart,
      relationEnd,
      relationText, // Surface form of label for open relation annotation
      textId,
      projectId,
      applyAll,
      annotationType,
      suggested,
      textIds,
      entityText,
    });
    return {
      response: response.data,
      status: response.status,
      details: {
        applyAll,
        annotationType,
        targetEntityId,
        targetTokenIds,
        relationTokenIds,
        relationStart,
        relationEnd,
        relationText,
      },
    };
  }
);

export const deleteAnnotation = createAsyncThunk(
  "/data/texts/deleteAnnotation",
  async ({
    projectId,
    textId,
    relationLabelId,
    sourceEntityId,
    targetEntityId,
    spanId,
    applyAll,
    suggested,
    annotationType,
    textIds,
    entityText,
  }) => {
    const response = await axios.patch("/api/text/annotation/delete", {
      projectId,
      textId,
      relationLabelId,
      sourceEntityId,
      targetEntityId,
      spanId,
      applyAll,
      suggested,
      annotationType,
      textIds,
      entityText,
    });
    return {
      response: response.data,
      details: {
        textId,
        spanId,
        relationLabelId,
        sourceEntityId,
        targetEntityId,
        annotationType,
        applyAll,
      },
    };
  }
);

export const acceptAnnotation = createAsyncThunk(
  "/data/texts/acceptAnnotation",
  async ({
    projectId,
    textId,
    spanId,
    relationLabelId,
    sourceEntityId,
    targetEntityId,
    applyAll,
    suggested,
    annotationType,
    textIds,
    entityText,
  }) => {
    const response = await axios.patch("/api/text/annotation/accept", {
      projectId,
      textId,
      spanId,
      relationLabelId,
      sourceEntityId,
      targetEntityId,
      applyAll,
      suggested,
      annotationType,
      textIds,
      entityText,
    });
    return {
      response: response.data,
      details: {
        applyAll,
        annotationType,
      },
    };
  }
);

export const saveAnnotations = createAsyncThunk(
  "/data/texts/saveAnnotations",
  async ({ textIds }) => {
    const response = await axios.patch("/api/text/annotation/save", {
      textIds: textIds,
    });
    return response.data;
  }
);

export const fetchClusterMetrics = createAsyncThunk(
  "/data/texts/fetchClusterMetrics",
  async ({ projectId }) => {
    const response = await axios.get(
      `/api/project/clusters/metrics/${projectId}`
    );
    return response.data;
  }
);

export const dataSlice = createSlice({
  name: "data",
  initialState: initialState,
  reducers: {
    setTextsIdle: (state, action) => {
      state.textsStatus = "idle";
    },
    setPageLimit: (state, action) => {
      state.pageLimit = Number(action.payload);
    },
    setPage: (state, action) => {
      state.page = Number(action.payload);
    },
    setShowToast: (state, action) => {
      state.showToast = action.payload;
    },
    setShowCluster: (state, action) => {
      state.showCluster = action.payload;
    },
    setActiveCluster: (state, action) => {
      state.activeCluster = action.payload;
    },
    setPageBeforeViewChange: (state, action) => {
      state.pageBeforeViewChange = action.payload;
    },
    setShowQuickView: (state, action) => {
      state.showQuickView = action.payload;
    },
    setAnnotationMode: (state, action) => {
      state.annotationMode = action.payload;
      // Reset token states when toggling between modes
      state.sourceSpan = null;
      state.targetSpan = null;
      state.relatedSpans = null;
    },
    setSelectedTokens: (state, action) => {
      const token = action.payload;
      state.selectMode.textId = token.textId;

      if (state.selectMode.active) {
        // check textId to stop cross text token selection
        if (state.selectMode.textId === token.textId) {
          if (state.selectMode.startIndex === null) {
            state.selectMode.startIndex = token.index;
            state.selectMode.endIndex = token.index;
          } else if (token.index !== state.selectMode.startIndex) {
            state.selectMode.endIndex = token.index;
          }

          const selectedTokenIds = Object.values(
            state.texts[state.selectMode.textId].tokens
          )
            .slice(
              state.selectMode.startIndex > state.selectMode.endIndex
                ? state.selectMode.endIndex
                : state.selectMode.startIndex,
              state.selectMode.startIndex > state.selectMode.endIndex
                ? state.selectMode.startIndex + 1
                : state.selectMode.endIndex + 1
            )
            .map((t) => t._id);

          // console.log("selectedTokenIds", selectedTokenIds);

          state.selectMode.tokenIds = selectedTokenIds;

          // Update token selected state
          selectedTokenIds.forEach((tId) => {
            state.texts[state.selectMode.textId].tokens[tId] = {
              ...state.texts[state.selectMode.textId].tokens[tId],
              selected: true,
            };
          });
        }
      }
    },
    setSelectMode: (state, action) => {
      state.selectMode.active = action.payload;
      if (state.selectMode.active) {
        // Clear token cache
        state.selectMode.tokenIds = [];
        state.selectMode.startIndex = null;
        state.selectMode.endIndex = null;
      }
    },
    setSourceRel: (state, action) => {
      /**
       * Updates state of entities (source, related, unrelated) for contextual styling and
       * Sets source span for relation annotation
       */

      // console.log("DEBUG setSourceRel payload", action.payload);

      const span = action.payload.span;
      const textId = action.payload.textId;
      const textRelations = state.relations[textId]
        ? state.relations[textId].filter(
            (r) => r.source.toString() === span._id.toString()
          )
        : []; // Relations where span is source.

      // Apply states to entities; not tokens. Any token without an entity is by default unrelated.
      state.entities[textId] = state.entities[textId].map((entity) => {
        if (entity._id.toString() === span._id.toString()) {
          return { ...entity, state: "source" };
        } else if (
          textRelations.filter(
            (r) => r.target.toString() === entity._id.toString()
          ).length > 0
        ) {
          return { ...entity, state: "related" };
        } else {
          return { ...entity, state: "unrelated" };
        }
      });

      state.sourceSpan = {
        _id: span._id,
        start: span.start,
        end: span.end,
        labelId: action.payload.labelId,
        textId: action.payload.textId,
      };
    },
    setTargetRel: (state, action) => {
      const span = action.payload.span;
      const labelId = action.payload.labelId;
      state.targetSpan = {
        _id: span._id,
        start: span.start,
        end: span.end,
        labelId: labelId,
      };
    },
    unsetTargetRel: (state, action) => {
      state.targetSpan = null;
    },
    unsetSourceTargetRels: (state, action) => {
      // Will be used when user changes annotationMode
      state.entities = Object.assign(
        {},
        ...Object.keys(state.entities).map((textId) => ({
          [textId]: Array.isArray(state.entities[textId])
            ? state.entities[textId].map((e) => ({
                ...e,
                state: "active",
              }))
            : { ...state.entities[textId], state: "active" },
        }))
      );

      state.sourceSpan = null;
      state.targetSpan = null;
      state.relatedSpans = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTotalPages.fulfilled, (state, action) => {
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchTexts.pending, (state, action) => {
        state.textsStatus = "loading";
      })
      .addCase(fetchTexts.fulfilled, (state, action) => {
        state.textsStatus = "succeeded";
        state.texts = action.payload.texts;
        state.relations = action.payload.relations;
        state.entities = action.payload.entities;
      })
      .addCase(applyAnnotation.fulfilled, (state, action) => {
        const response = action.payload.response;
        const details = action.payload.details;
        let label;
        let updatedTextIds;

        //console.log("DATA SLICE response", response);
        //console.log("response", response.data);

        if (response.data !== null && response.count !== 0) {
          if (details.annotationType === "entity") {
            label = details.applyAll
              ? response.data[0].name
              : response.data.name;
            updatedTextIds = details.applyAll
              ? response.textIds
              : [response.data.textId];
            const entities = details.applyAll ? response.data : [response.data];

            entities.map((entity) => {
              const textId = entity.textId;
              if (Object.keys(state.entities).includes(textId)) {
                state.entities[textId] = [...state.entities[textId], entity];
              } else {
                state.entities[textId] = [entity];
              }
            });
          } else if (
            details.annotationType === "relation" ||
            details.annotationType === "openRelation"
          ) {
            // Apply relation action
            //console.log("applying relation");

            label = details.applyAll
              ? response.data[0].name
              : response.data.name;

            updatedTextIds = details.applyAll
              ? response.textIds
              : [response.data.textId];

            const relations = details.applyAll
              ? response.data
              : [response.data];

            relations.map((relation) => {
              const textId = relation.textId;
              const entityId = details.applyAll ? "x" : relation.target; // No entity for applyAll

              if (Object.keys(state.relations).includes(textId)) {
                state.relations[textId] = [
                  ...state.relations[textId],
                  details.applyAll
                    ? {
                        ...relation,
                        source: relation.source._id,
                        target: relation.target._id,
                      }
                    : relation,
                ];
              } else {
                state.relations[textId] = [
                  details.applyAll
                    ? {
                        ...relation,
                        source: relation.source._id,
                        target: relation.target._id,
                      }
                    : relation,
                ];
              }

              /*
                If textId isn't in the current store, then entities have been assigned
                and do not exist. They need to be made and added to the store.
              */
              // If apply all - need to update entities as they are also created
              // Do nothing; entities are already in the redux store...
              if (!Object.keys(state.entities).includes(textId)) {
                // Apply all state where entities are created through relation prop
                // Payload only gives relation entity _ids, so need to use redux store to find the entities...?
                // console.log("Apply all - but text has no entities - adding fresh ones!");
                state.entities[textId] = [relation.source, relation.target]; // These are backpopulated, not just _id's
              } else {
                if (details.applyAll) {
                  // New entities added to text with existing entities
                  const textEntityIds = state.entities[textId].map((e) =>
                    e._id.toString()
                  );

                  if (!textEntityIds.includes(relation.source._id.toString())) {
                    //console.log("Adding relation source to text entities");
                    state.entities[textId] = [
                      ...state.entities[textId],
                      relation.source,
                    ];
                  }
                  if (!textEntityIds.includes(relation.target._id.toString())) {
                    //console.log("Adding relation target to text entities");
                    state.entities[textId] = [
                      ...state.entities[textId],
                      relation.target,
                    ];
                  }
                }
              }

              // Update target entity states
              if (!details.applyAll) {
                state.entities[textId] = state.entities[textId].map((e) => ({
                  ...e,
                  ...(e._id === entityId ? { state: "target" } : {}),
                }));
              }
            });
          } else {
            // Apply open relation action
            console.log("hello");
            // TODO: Some reason this is missing.
          }

          // Set toast values and set toast to active for user to see
          state.toastInfo = {
            action: "apply",
            applyAll: details.applyAll,
            annotationType: details.annotationType,
            content: {
              label: label,
              count: response.count,
              textIds: updatedTextIds,
            },
          };
          state.showToast = true;
        }
      })
      .addCase(deleteAnnotation.fulfilled, (state, action) => {
        const response = action.payload.response;
        const details = action.payload.details;

        if (details.annotationType === "entity") {
          const entities = details.applyAll
            ? response.data
            : [{ textId: details.textId, _id: details.spanId }];

          entities.map((entity) => {
            state.entities[entity.textId] = state.entities[
              entity.textId
            ].filter((e) => e._id != entity._id);

            if (state.relations[entity.textId]) {
              state.relations[entity.textId] = state.relations[
                entity.textId
              ].filter(
                (r) =>
                  r.source.toString() != entity._id.toString() &&
                  r.target.toString() != entity._id.toString()
              );
            }
          });
        } else if (details.annotationType === "relation") {
          // Apply relation action
          // Don't have access to the relations _id so use other fields as proxy
          const relations = details.applyAll
            ? response.data
            : [
                {
                  textId: details.textId,
                  labelId: details.relationLabelId,
                  source: details.sourceEntityId,
                  target: details.targetEntityId,
                },
              ];

          relations.map((r1) => {
            state.relations[r1.textId] = state.relations[r1.textId].filter(
              (r2) =>
                !(
                  r1.source.toString() === r2.source.toString() &&
                  r1.target.toString() === r2.target.toString() &&
                  r1.labelId.toString() === r2.labelId.toString()
                )
            );
          });
        } else {
          // Apply open relation action
        }

        // if (details.applyAll) {

        //   const updatedTextIds = response.data.map((text) => text._id);
        //   // Update text and ensure position is kept
        //   state.texts = state.texts.map((text) => {
        //     if (updatedTextIds.includes(text._id)) {
        //       // Update relations object (changes if applying new rels)
        //       const updatedText = response.data.filter(
        //         (t) => t._id == text._id
        //       )[0];
        //       state.relations[text._id] = updatedText.relations;
        //       return response.data.filter((t) => t._id === text._id)[0];
        //     } else {
        //       return text;
        //     }
        //   });
        // } else {
        //   if (details.relationId) {
        //     state.entities[details.textId] = state.relations[
        //       details.textId
        //     ].filter((r) => r._id != details.relationId);
        //   }
        // }

        // Unset anything select on the span that the delete action was applied on
        // Will be used when user changes annotationMode
        // state.sourceSpan = null;
        // state.targetSpan = null;
        // state.relatedSpans = null;

        // Set toast values and set toast to active for user to see
        state.toastInfo = {
          action: "delete",
          applyAll: details.applyAll,
          annotationType: details.annotationType,
          content: {
            count: response.count,
            textIds: [],
          },
        };
        state.showToast = true;
      })
      .addCase(acceptAnnotation.fulfilled, (state, action) => {
        const response = action.payload.response;
        const details = action.payload.details;
        let updatedTextIds;

        //console.log("accept response", response.data);

        if (details.annotationType === "entity") {
          updatedTextIds = details.applyAll
            ? response.data.map((e) => e.textId)
            : [response.data.textId];
          const entities = details.applyAll ? response.data : [response.data];

          //console.log("accept entities dataSlice", entities);

          // Update entity markup cache
          entities.map((e1) => {
            if (
              state.entities[e1.textId] &&
              state.entities[e1.textId].length > 0
            ) {
              state.entities[e1.textId] = state.entities[e1.textId].map(
                (e2) => ({
                  ...e2,
                  suggested:
                    e2._id.toString() === e1._id.toString()
                      ? false
                      : e2.suggested,
                })
              );
            } else {
              state.entities[e1.textId] = e1;
            }
          });
        } else if (details.annotationType === "relation") {
          // Apply relation action - update state of relations and entities
          const markup = response.data;
          markup.map((m) => {
            if (m.isEntity) {
              //console.log(m.textId);

              state.entities[m.textId] = state.entities[m.textId].map((e) => ({
                ...e,
                suggested:
                  e._id.toString() === m._id.toString() ? false : e.suggested,
              }));
            } else {
              state.relations[m.textId] = state.relations[m.textId].map(
                (r) => ({
                  ...r,
                  suggested:
                    r._id.toString() === m._id.toString() ? false : r.suggested,
                })
              );
            }
          });
        } else {
          // Apply open relation action
        }

        // Set toast values and set toast to active for user to see
        state.toastInfo = {
          action: "accept",
          applyAll: details.applyAll,
          annotationType: details.annotationType,
          content: {
            count: response.count,
            textIds: updatedTextIds,
          },
        };

        state.showToast = true;
      })
      .addCase(saveAnnotations.fulfilled, (state, action) => {
        if (action.payload.count === 1) {
          state.texts[action.payload.data._id].saved =
            action.payload.data.saved;

          state.clusterMetrics[action.payload.data.cluster] =
            action.payload.data.saved
              .map((s) => s.createdBy)
              .includes(action.payload.userId)
              ? state.clusterMetrics[action.payload.data.cluster] + 1
              : state.clusterMetrics[action.payload.data.cluster] - 1;
        }
      })
      .addCase(fetchClusterMetrics.fulfilled, (state, action) => {
        state.clusterMetrics = action.payload;
      });
  },
});

export const {
  setTextsIdle,
  setPageLimit,
  setPage,
  setShowCluster,
  setSelectedTokens,
  setActiveCluster,
  setPageBeforeViewChange,
  setAnnotationMode,
  setShowToast,
  addTokens,
  setSourceRel,
  setTargetRel,
  unsetTargetRel,
  unsetSourceTargetRels,
  setSelectMode,
  setShowQuickView,
} = dataSlice.actions;

export const selectPageLimit = (state) => state.data.pageLimit;
export const selectPage = (state) => state.data.page;
export const selectTotalPages = (state) => state.data.totalPages;
export const selectTexts = (state) => state.data.texts;
export const selectToastInfo = (state) => state.data.toastInfo;
export const selectShowToast = (state) => state.data.showToast;
export const selectSelectedTokens = (state) => state.data.selectedTokens;
export const selectActiveCluster = (state) => state.data.activeCluster;
export const selectPageBeforeViewChange = (state) =>
  state.data.pageBeforeViewChange;
export const selectClusterMetrics = (state) => state.data.clusterMetrics;
export const selectShowCluster = (state) => state.data.showCluster;
export const selectRelations = (state) => state.data.relations;
export const selectEntities = (state) => state.data.entities;
export const selectAnnotationMode = (state) => state.data.annotationMode;
export const selectSourceSpan = (state) => state.data.sourceSpan;
export const selectTargetSpan = (state) => state.data.targetSpan;
export const selectSelectMode = (state) => state.data.selectMode;
export const selectShowQuickView = (state) => state.data.showQuickView;

export const selectTextsStatus = (state) => state.data.textsStatus;
export const selectTextsError = (state) => state.data.textsError;

export default dataSlice.reducer;
