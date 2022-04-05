import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../features/utils/api-interceptor";

const initialState = {
  textsStatus: "idle",
  textsError: null,
  annotationMode: "concept", // Two types: concept (entity annotation) and relation (relation extraction)
  tokens: null,
  selectedTokens: {},
  relations: null,
  selectMode: { active: false, tokenIds: [], tokenIndexes: [], textId: null },
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
    entityLabel,
    entityLabelId,
    sourceEntityId,
    sourceEntityLabel,
    targetEntityId,
    targetEntityLabel,
    relationLabel,
    relationLabelId,
    relationStart,
    relationEnd,
    targetTokenIds,
    relationTokenIds,
    textId,
    projectId,
    applyAll,
    annotationType,
    suggested,
  }) => {
    const response = await axios.post(`/api/text/annotation/apply`, {
      entitySpanStart,
      entitySpanEnd,
      entityLabel,
      entityLabelId,
      sourceEntityId,
      sourceEntityLabel,
      targetEntityId,
      targetEntityLabel,
      relationLabel,
      relationLabelId,
      relationTokenIds, // Array of tokens for open relation extraction. Used to build relation label.
      relationStart,
      relationEnd,
      textId,
      projectId,
      applyAll,
      annotationType,
      suggested,
    });
    return {
      response: response.data,
      status: response.status,
      details: {
        entityLabel,
        relationLabel,
        applyAll,
        annotationType,
        targetEntityId,
        targetEntityLabel,
        targetTokenIds,
        relationTokenIds,
        relationStart,
        relationEnd,
      },
    };
  }
);

export const deleteAnnotation = createAsyncThunk(
  "/data/texts/deleteAnnotation",
  async ({
    projectId,
    textId,
    spanId,
    entityLabel,
    relationId,
    relationLabel,
    sourceEntityLabel,
    targetEntityLabel,
    applyAll,
    suggested,
    annotationType,
  }) => {
    const response = await axios.patch("/api/text/annotation/delete", {
      projectId: projectId,
      textId: textId,
      spanId: spanId,
      entityLabel: entityLabel,
      relationId: relationId,
      relationLabel: relationLabel,
      sourceEntityLabel: sourceEntityLabel,
      targetEntityLabel: targetEntityLabel,
      applyAll: applyAll,
      suggested: suggested,
      annotationType: annotationType,
    });
    return {
      response: response.data,
      details: {
        entityLabel,
        relationLabel,
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
    entityLabel,
    relationId,
    relationLabel,
    sourceEntityLabel,
    sourceEntityId,
    targetEntityLabel,
    targetEntityId,
    applyAll,
    suggested,
    annotationType,
  }) => {
    const response = await axios.patch("/api/text/annotation/accept", {
      projectId: projectId,
      textId: textId,
      spanId: spanId,
      entityLabel: entityLabel,
      relationId: relationId,
      relationLabel: relationLabel,
      sourceEntityLabel: sourceEntityLabel,
      targetEntityLabel: targetEntityLabel,
      sourceEntityId: sourceEntityId,
      targetEntityId: targetEntityId,
      applyAll: applyAll,
      suggested: suggested,
      annotationType: annotationType,
    });
    return {
      response: response.data,
      details: {
        entityLabel,
        relationLabel,
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
      state.tokens = state.tokens.map((token) => ({ ...token, state: null }));
      state.sourceSpan = null;
      state.targetSpan = null;
      state.relatedSpans = null;
    },
    setSelectedTokens: (state, action) => {
      const token = action.payload;
      console.log("token", token);
      if (state.selectMode.active) {
        //
        if (state.selectMode.textId === token.text_id) {
          // If tokens already selected, only allow adjacents to be also selected
          state.selectMode.tokenIds = [...state.selectMode.tokenIds, token._id];
          state.selectMode.tokenIndexes = [
            ...new Set([...state.selectMode.tokenIndexes, token.index]),
          ].sort((a, b) => a - b);

          // Add new token attributes based on current text
          const newTokens = state.tokens
            .filter((t) => t.text_id == state.selectMode.textId)
            .map((t) => (t._id === token._id ? { ...t, selected: true } : t));

          state.tokens = [
            ...state.tokens.filter((t) => t.text_id != state.selectMode.textId),
            ...newTokens,
          ];
        }
      }
    },
    setSelectMode: (state, action) => {
      state.selectMode.active = action.payload.active;
      if (state.selectMode.active) {
        // Clear token cache
        state.selectMode.tokenIds = [];
        state.selectMode.textId = action.payload.textId;
        state.selectMode.textIndexes = action.payload.textIndexes;
      }
    },
    setSourceRel: (state, action) => {
      // There can be n focusTokenIds across a span of n-tokens
      const focusTokenIds = action.payload.tokenIds;
      const textId = action.payload.textId;
      const textTokens = state.tokens.filter((t) => t.text_id === textId);
      const textTokenIds = textTokens.map((t) => t._id);

      // Need to check for related span
      const relatedTokenIds = action.payload.relatedTokenIds;

      const updateTokens = textTokens.map((token) => {
        if (focusTokenIds.includes(token._id)) {
          console.log("token includes", token._id);
          return { ...token, state: "source" };
        } else if (relatedTokenIds.includes(token._id)) {
          console.log("related token", token._id);
          return { ...token, state: "related" };
        } else {
          return { ...token, state: "unrelated" };
        }
      });

      state.tokens = state.tokens.map((token) => {
        if (textTokenIds.includes(token._id)) {
          return updateTokens.filter((t) => t._id === token._id)[0];
        } else {
          return token;
        }
      });

      const span = action.payload.span;
      const label = action.payload.label; // User only clicks one label at a time
      const labelId = action.payload.labelId;
      const relatedSpanIdLabelMap = action.payload.relatedSpanIdLabelMap; // Contains mapping to render labels onto spans

      state.sourceSpan = {
        _id: span._id,
        start: span.start,
        end: span.end,
        label: label,
        labelId: labelId,
        relatedSpanIdLabelMap: relatedSpanIdLabelMap,
        textId: textId,
        value: textTokens
          .filter((token) => focusTokenIds.includes(token._id))
          .map((token) => token.value)
          .join(" "),
      };
    },
    setTargetRel: (state, action) => {
      const focusTokenIds = action.payload.tokenIds;
      const textId = action.payload.textId;
      const textTokens = state.tokens.filter((t) => t.text_id === textId);

      state.tokens = state.tokens.map((token) => {
        if (token.text_id != textId) {
          return token;
        } else if (focusTokenIds.includes(token._id)) {
          return { ...token, state: "target" };
        } else if (token.state && token.state === "target") {
          // Remove any previous target
          return { ...token, state: "unrelated" };
        } else {
          return token;
        }
      });

      const span = action.payload.span;
      const label = action.payload.label; // User only clicks one label at a time
      const labelId = action.payload.labelId;

      state.targetSpan = {
        _id: span._id,
        start: span.start,
        end: span.end,
        label: label,
        labelId: labelId,
        value: textTokens
          .filter((token) => focusTokenIds.includes(token._id))
          .map((token) => token.value)
          .join(" "),
      };
    },
    setMatchedSpans: (state, action) => {
      // Identifies spans that are targets of the focus source span
    },
    unsetSorceRel: (state, action) => {
      const focusTokenId = action.payload.tokenId;
      const textId = action.payload.textId;
      const textTokens = state.tokens.filter((t) => t.text_id === textId);
      const textTokenIds = textTokens.map((t) => t._id);

      const updateTokens = textTokens.map((token) => {
        if (token._id === focusTokenId) {
          return { ...token, state: null };
        } else {
          return { ...token, state: null };
        }
      });

      state.tokens = state.tokens.map((token) => {
        if (textTokenIds.includes(token._id)) {
          return updateTokens.filter((t) => t._id === token._id)[0];
        } else {
          return token;
        }
      });

      state.sourceSpan = null;
      state.targetSpan = null;
      state.selectMode = { active: false, tokensIds: [], textId: null };
    },
    unsetTargetRel: (state, action) => {
      const focusTokenIds = action.payload.tokenIds;
      const textId = action.payload.textId;

      state.tokens = state.tokens.map((token) => {
        if (token.text_id != textId) {
          return token;
        }
        if (focusTokenIds.includes(token._id) && action.payload.hasRelations) {
          return { ...token, state: "related" };
        } else if (focusTokenIds.includes(token._id)) {
          return { ...token, state: "unrelated" };
        } else {
          return token;
        }
      });

      state.targetSpan = null;
    },
    unsetSourceTargetRels: (state, action) => {
      // Will be used when user changes annotationMode
      state.tokens = state.tokens.map((token) => ({ ...token, state: null }));
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
        state.texts = action.payload;

        console.log(action.payload);

        // Add tokens and relations
        state.tokens = action.payload.flatMap((text) =>
          text.tokens.flatMap((token) => ({ ...token, text_id: text._id }))
        );
        // Add relations from texts into their own object
        state.relations = Object.assign(
          {},
          ...action.payload.map((text) => ({ [text._id]: text.relations }))
        );
      })
      .addCase(applyAnnotation.fulfilled, (state, action) => {
        const response = action.payload.response;
        const details = action.payload.details;
        console.log("response", response, "details", details);

        let updatedTextIds;
        if (details.applyAll) {
          updatedTextIds = response.data.map((text) => text._id);

          // console.log('updatedTextIds', updatedTextIds)

          // Update text and ensure position is kept
          state.texts = state.texts.map((text) => {
            if (updatedTextIds.includes(text._id)) {
              // Update relations object (changes if applying new rels)
              const updatedText = response.data.filter(
                (t) => t._id == text._id
              )[0];

              // console.log('updatedText', updatedText)

              state.relations[text._id] = updatedText.relations;

              return updatedText;
            } else {
              return text;
            }
          });
        } else {
          // Update single text object
          updatedTextIds = [response.data._id];
          state.texts = state.texts.map((text) => {
            if (text._id === response.data._id) {
              return response.data;
            } else {
              return text;
            }
          });

          if (
            details.annotationType === "relation" ||
            details.annotationType === "openRelation"
          ) {
            console.log("Applyin relation specific state changes");
            state.relations[response.data._id] = response.data.relations;

            // Update state on tokens (can be a span of n tokens)
            const targetTokenIds = details.targetTokenIds;
            state.tokens = state.tokens.map((token) => {
              if (targetTokenIds.includes(token._id)) {
                return { ...token, state: "related" };
              } else {
                return token;
              }
            });

            // Add new relation item to relatedSpanIdLabelMap
            const newRelatedSpanIdLabelMapItem = {
              span_id: details.targetEntityId,
              label: details.targetEntityLabel,
            };
            const updatedRelatedSpanIdLabelMap = [
              ...state.sourceSpan.relatedSpanIdLabelMap,
              newRelatedSpanIdLabelMapItem,
            ];
            state.sourceSpan = {
              ...state.sourceSpan,
              relatedSpanIdLabelMap: updatedRelatedSpanIdLabelMap,
            };
          }
        }

        // Set toast values and set toast to active for user to see
        state.toastInfo = {
          action: "apply",
          applyAll: details.applyAll,
          annotationType: details.annotationType,
          content: {
            label:
              details.annotationType === "entity"
                ? details.entityLabel
                : details.relationLabel,
            count: response.count,
            textIds: updatedTextIds,
          },
        };
        state.showToast = true;
      })
      .addCase(deleteAnnotation.fulfilled, (state, action) => {
        const response = action.payload.response;
        const details = action.payload.details;

        if (details.applyAll) {
          const updatedTextIds = response.data.map((text) => text._id);
          // Update text and ensure position is kept
          state.texts = state.texts.map((text) => {
            if (updatedTextIds.includes(text._id)) {
              // Update relations object (changes if applying new rels)
              const updatedText = response.data.filter(
                (t) => t._id == text._id
              )[0];
              state.relations[text._id] = updatedText.relations;
              return response.data.filter((t) => t._id === text._id)[0];
            } else {
              return text;
            }
          });
        } else {
          state.texts = state.texts.map((text) => {
            if (text._id === response.data._id) {
              state.relations[response.data._id] = response.data.relations;
              return response.data;
            } else {
              return text;
            }
          });
        }

        // Unset anything select on the span that the delete action was applied on
        // Will be used when user changes annotationMode
        state.tokens = state.tokens.map((token) => ({ ...token, state: null }));
        state.sourceSpan = null;
        state.targetSpan = null;
        state.relatedSpans = null;

        // Set toast values and set toast to active for user to see
        state.toastInfo = {
          action: "delete",
          applyAll: details.applyAll,
          annotationType: details.annotationType,
          content: {
            label:
              details.annotationType === "entity"
                ? details.entityLabel
                : details.relationLabel,
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

        if (details.applyAll) {
          updatedTextIds = response.data.map((text) => text._id);
          // Update text and ensure position is kept
          state.texts = state.texts.map((text) => {
            if (updatedTextIds.includes(text._id)) {
              // Update relations object (changes if applying new rels)
              const updatedText = response.data.filter(
                (t) => t._id == text._id
              )[0];
              state.relations[text._id] = updatedText.relations;
              return response.data.filter((t) => t._id === text._id)[0];
            } else {
              return text;
            }
          });
        } else {
          updatedTextIds = [response.data._id];
          state.texts = state.texts.map((text) => {
            if (text._id === response.data._id) {
              state.relations[response.data._id] = response.data.relations;
              return response.data;
            } else {
              return text;
            }
          });
        }

        // Set toast values and set toast to active for user to see
        state.toastInfo = {
          action: "accept",
          applyAll: details.applyAll,
          annotationType: details.annotationType,
          content: {
            label:
              details.annotationType === "entity"
                ? details.entityLabel
                : details.relationLabel,
            count: response.count,
            textIds: updatedTextIds,
          },
        };

        state.showToast = true;
      })
      .addCase(saveAnnotations.fulfilled, (state, action) => {
        console.log("Saving document(s)");

        if (action.payload.count === 1) {
          state.texts = state.texts.map((text) => {
            if (text._id === action.payload.data._id) {
              return { ...text, saved: action.payload.data.saved };
            } else {
              return text;
            }
          });

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
  unsetSorceRel,
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
export const selectTokens = (state) => state.data.tokens;
export const selectRelations = (state) => state.data.relations;
export const selectAnnotationMode = (state) => state.data.annotationMode;
export const selectSourceSpan = (state) => state.data.sourceSpan;
export const selectTargetSpan = (state) => state.data.targetSpan;
export const selectSelectMode = (state) => state.data.selectMode;
export const selectShowQuickView = (state) => state.data.showQuickView;

export const selectTextsStatus = (state) => state.data.textsStatus;
export const selectTextsError = (state) => state.data.textsError;
export const selectTokensStatus = (state) => state.data.tokensStatus;
export const selectTokensError = (state) => state.data.tokensError;

export default dataSlice.reducer;
