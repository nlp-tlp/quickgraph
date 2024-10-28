import * as React from "react";
import { getFlatOntology } from "../utils/tools";
import { defaultGraphData } from "../demo/data";

const initialState = {
  demo: true,
  loading: false, // For CRUD operations
  projectLoading: true,
  tasks: {},
  disablePropagation: true,
  activeEntityClass: 0,
  flatOntology: [],
  entityAnnotationMode: true,
  texts: [],
  relations: null,
  entities: null,
  selectedTokens: {},
  currentTextSelected: null,
  selectedTokenIds: [],
  selectedTextId: null,
  selectModeActive: false,
  sourceSpan: null,
  targetSpan: null,
  totalPages: 0,
  totalTexts: 0,
  pageBeforeViewChange: null,
  showToast: false,
  showQuickView: false,
  savedTextsOnPage: 0, // Used for triggering progress updates for UI
  graphData: defaultGraphData,
};

export const LandingContext = React.createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_DEMO": {
      return {
        ...state,
        projectId: state.projectId,
        tasks: action.payload.tasks,
        ontology: action.payload.ontology,
        ...(action.payload.tasks.relation
          ? {
              flatRelationOntology: getFlatOntology(
                action.payload.ontology.relation
              ).filter((i) => i.active),
            }
          : {}),
        texts: action.payload.dataset_items,
        totalPages: action.payload.total_pages,
        totalTexts: action.payload.total_dataset_items,
        textsLoading: false,
        projectLoading: false,
        relations: action.payload.relations,
        entities: action.payload.entities,
      };
    }
    case "SET_VALUE": {
      return { ...state, ...action.payload };
    }

    case "APPLY_ANNOTATION": {
      console.log("APPLY ANNOTATION", action.payload);

      // User is applying an entity
      const updatedEntityTextIds = Object.keys(action.payload.entities);
      const newEntities = Object.assign(
        {},
        ...Object.keys(state.entities).map((textId) => {
          if (updatedEntityTextIds.includes(textId)) {
            // Filters out any weak entities before inserting patched entities.
            const filteredEntities = state.entities[textId].filter(
              (e) =>
                !action.payload.entities[textId]
                  .map((e2) => e2._id.toString())
                  .includes(e._id.toString())
            );

            console.log(action.payload.entities);

            return {
              [textId]: [
                ...filteredEntities,
                ...action.payload.entities[textId],
              ],
            };
          } else {
            return { [textId]: state.entities[textId] };
          }
        })
      );

      // User is applying a relation
      const updatedRelationTextIds = Object.keys(action.payload.relations);
      const newRelations = Object.assign(
        {},
        ...Object.keys(state.relations).map((textId) => {
          if (updatedRelationTextIds.includes(textId)) {
            return {
              [textId]: [
                ...state.relations[textId],
                ...action.payload.relations[textId],
              ],
            };
          } else {
            return { [textId]: state.relations[textId] };
          }
        })
      );

      const toastInfo = {
        action: "apply",
        applyAll: action.payload.applyAll, // TODO: get from action.payload
        annotationType: "entity", // TODO: get from action payload details.annotationType,
        content: {
          label: action.payload.labelName,
          count: action.payload.count,
          textIds: [],
        },
      };

      return {
        ...state,
        entities: newEntities,
        relations: newRelations,
        toastInfo: toastInfo,
        showToast: true,
      };
    }
    case "ACCEPT_ANNOTATION": {
      // console.log("Accepting annotation", action.payload);

      // User is applying an entity
      const updatedEntityTextIds = Object.keys(action.payload.entities);
      const newEntities = Object.assign(
        {},
        ...Object.keys(state.entities).map((textId) => {
          if (updatedEntityTextIds.includes(textId)) {
            return {
              [textId]: state.entities[textId].map((e) => ({
                ...e,
                suggested: action.payload.entities[textId].includes(
                  e._id.toString()
                )
                  ? false
                  : e.suggested,
              })),
            };
          } else {
            return { [textId]: state.entities[textId] };
          }
        })
      );

      // console.log("new entities", newEntities);

      // User is applying a relation
      const updatedRelationTextIds = Object.keys(action.payload.relations);
      const newRelations = Object.assign(
        {},
        ...Object.keys(state.relations).map((textId) => {
          if (updatedRelationTextIds.includes(textId)) {
            return {
              [textId]: state.relations[textId].map((r) => ({
                ...r,
                suggested: action.payload.relations[textId].includes(
                  r._id.toString()
                )
                  ? false
                  : r.suggested,
              })),
            };
          } else {
            return { [textId]: state.relations[textId] };
          }
        })
      );

      // console.log("new relations", newRelations);

      const toastInfo = {
        action: "accept",
        applyAll: false,
        annotationType: "entity",
        content: {
          count: action.payload.count,
          textIds: [],
        },
      };

      return {
        ...state,
        entities: newEntities,
        relations: newRelations,
        toastInfo: toastInfo,
        showToast: true,
      };
    }
    case "DELETE_ANNOTATION": {
      /**
       * Whenever an entity is deleted, relations connected to that entity are deleted as well.
       */
      // {'entities': {'textId: ['entityIdDeleted']}, 'relations': {textId: []}}

      if (state.entityAnnotationMode) {
        const entityTextIdsToDelete = Object.keys(action.payload.entities);

        const newEntities = Object.assign(
          {},
          ...Object.keys(state.entities)
            .filter((textId) => entityTextIdsToDelete.includes(textId))
            .map((textId) => ({
              [textId]: state.entities[textId].filter(
                (e) => !action.payload.entities[textId].includes(e._id)
              ),
            }))
        );

        const newRelations = Object.assign(
          {},
          ...Object.keys(state.relations)
            .filter((textId) => entityTextIdsToDelete.includes(textId))
            .map((textId) => ({
              [textId]: state.relations[textId].filter(
                (r) =>
                  !action.payload.entities[textId].includes(
                    r.source.toString()
                  ) &&
                  !action.payload.entities[textId].includes(r.target.toString())
              ),
            }))
        );

        const toastInfo = {
          action: "delete",
          applyAll: false,
          annotationType: "entity",
          content: {
            count: action.payload.count,
            textIds: [],
          },
        };

        return {
          ...state,
          entities: { ...state.entities, ...newEntities },
          relations: { ...state.relations, ...newRelations },
          toastInfo: toastInfo,
          showToast: true,
        };
      } else {
        const relationTextIdsToDelete = Object.keys(action.payload.relations);
        const filteredRelations = Object.assign(
          {},
          ...Object.keys(state.relations).map((textId) => {
            if (relationTextIdsToDelete.includes(textId)) {
              return {
                [textId]: state.relations[textId].filter(
                  (r) =>
                    !action.payload.relations[textId].includes(
                      `${r.source}${r.target}${r.labelId}`
                    )
                ),
              };
            } else {
              return { [textId]: state.relations[textId] };
            }
          })
        );

        const toastInfo = {
          action: "delete",
          applyAll: false,
          annotationType: "relation",
          content: {
            count: action.payload.count,
            textIds: [],
          },
        };

        return {
          ...state,
          relations: filteredRelations,
          toastInfo: toastInfo,
          showToast: true,
        };
      }
    }
    case "SET_SOURCE_SPAN": {
      // console.log("SETTING SOURCE SPAN");
      /**
       * Updates state of entities (source, related, unrelated) for contextual styling and
       * Sets source span for relation annotation
       */

      const span = action.payload.span;
      const textId = action.payload.textId;
      const textRelations = state.relations[textId]
        ? state.relations[textId].filter(
            (r) => r.source.toString() === span._id.toString()
          )
        : []; // Relations where span is source.

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

      return {
        ...state,
        sourceSpan: {
          _id: span._id,
          start: span.start,
          end: span.end,
          labelId: action.payload.labelId,
          textId: action.payload.textId,
        },
      };
    }
    case "REMOVE_SOURCE_TARGET_RELS": {
      // console.log("REMOVE_SOURCE_TARGET_RELS");
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

      return {
        ...state,
        sourceSpan: null,
        targetSpan: null,
      };
    }
    case "TOGGLE_ANNOTATION_MODE": {
      if (state.entityAnnotationMode) {
        // User goes from entity -> relation
        return { ...state, entityAnnotationMode: !state.entityAnnotationMode };
      } else {
        // User goes from relation -> entity
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

        return {
          ...state,
          entityAnnotationMode: !state.entityAnnotationMode,
          sourceSpan: null,
          targetSpan: null,
        };
      }
    }
    case "SAVE_ANNOTATIONS": {
      const updatedTexts = {
        ...state.texts,
        ...Object.assign(
          {},
          ...action.payload.data.map((t) => ({
            [t._id]: { ...state.texts[t._id], saved: t.saved },
          }))
        ),
      };

      return {
        ...state,
        texts: updatedTexts,
        savedTextsOnPage: Object.keys(updatedTexts).filter(
          (textId) => updatedTexts[textId].saved
        ).length,
      };
    }
    default:
      return null;
  }
};

export const LandingProvider = (props) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return (
    <LandingContext.Provider value={[state, dispatch]}>
      {props.children}
    </LandingContext.Provider>
  );
};
