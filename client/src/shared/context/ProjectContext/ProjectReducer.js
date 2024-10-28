import CircularBuffer from "../CircularBuffer";
import { getFlatOntology } from "../../utils/tools";
import { ActionTypes } from "./ProjectActions";

export const initialState = {
  loading: false, // For CRUD operations
  projectLoading: true,
  progress: { dataset_size: 0, dataset_items_saved: 0, value: 0 },
  tasks: {},
  activeEntityClass: 0,
  keyBinding: {},
  flatOntology: [],
  name: "",
  description: "",
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
  settings: {},
  flags: {},
  social: {},
  discussionDatasetItemId: null,
  showMenu: false,
  menuView: "insights",
  submitting: false,
  showSearchModel: false,
  showFilterModel: false,
  showShortcutModal: false,
  history: new CircularBuffer(20),
};

export const reducer = (state, action) => {
  switch (action.type) {
    case "SET_PROJECTID": {
      return { ...state, projectId: action.payload };
    }
    case "SET_PROJECT": {
      return {
        ...initialState,
        history: new CircularBuffer(20),
        projectId: state.projectId,
        tasks: action.payload.tasks,
        name: action.payload.name,
        description: action.payload.description,
        ontology: action.payload.ontology,
        settings: action.payload.settings,
        projectLoading: false,
        textsLoading: true,
        guidelines: action.payload.guidelines,
        relationCounts: action.payload.relation_counts,
        flatOntology: [
          ...getFlatOntology(action.payload.ontology.entity).map((i) => ({
            ...i,
            classification: "entity",
          })),
          ...(action.payload.tasks.relation
            ? getFlatOntology(action.payload.ontology.relation).map((i) => ({
                ...i,
                classification: "relation",
              }))
            : []),
        ],
        keyBinding: Object.assign(
          {},
          ...action.payload.ontology.entity
            .filter((item) => item.active)
            .map((label, index) => ({
              [index + 1]: label,
            }))
        ), // TODO: Compute key assignment on the backend
        ...(action.payload.tasks.relation
          ? {
              flatRelationOntology: getFlatOntology(
                action.payload.ontology.relation
              ).filter((i) => i.active),
            }
          : {}),
      };
    }
    case "SET_TEXTS": {
      return {
        ...state,
        texts: action.payload.dataset_items,
        relations: action.payload.relations,
        entities: action.payload.entities,
        totalTexts: action.payload.total_dataset_items, // TODO: change to totalTexts in API
        textsLoading: false,
        social: action.payload.social,
        flags: action.payload.flags,
      };
    }
    case "SET_VALUE": {
      return { ...state, ...action.payload };
    }
    case "SET_PAGE": {
      return {
        ...state,
        pageNumber: action.payload,
        textsLoading: true,
      };
    }
    case "SET_TEXTS_LOADING": {
      return { ...state, textsLoading: true };
    }
    case "SAVE_DATASET_ITEMS": {
      const updatedDatasetItems = { ...state.texts }; // create a copy of the data object
      let numSaved = 0;
      if (action.payload.count > 0) {
        for (const id of action.payload.datasetItemIds) {
          if (id in updatedDatasetItems) {
            const isSaved = updatedDatasetItems[id].saved;
            const newSavedState =
              action.payload.datasetItemIds.length > 1 ? true : !isSaved;
            if (isSaved !== newSavedState) {
              updatedDatasetItems[id] = {
                ...updatedDatasetItems[id],
                saved: newSavedState,
              }; // update the 'saved' key to the opposite value unless "save many"
              if (newSavedState) {
                numSaved++;
              } else {
                numSaved--;
              }
            }
          }
        }
      }

      // Optimsitic update progress
      const updatedDatasetItemsSaved =
        state.progress.dataset_items_saved + numSaved;

      const updateProgress = {
        dataset_items_saved: updatedDatasetItemsSaved,
        value: Math.ceil(
          (updatedDatasetItemsSaved / state.progress.dataset_size) * 100
        ),
      };

      return {
        ...state,
        texts: updatedDatasetItems,
        progress: { ...state.progress, ...updateProgress },
      };
    }
    case ActionTypes.APPLY_ANNOTATION: {
      // Applies a new annotations only if it does not already exist.

      const updatedEntities = { ...state.entities }; // create a copy of the target object
      if (action.payload.entities) {
        action.payload.entities.forEach((item) => {
          const { dataset_item_id, ...newItem } = item;
          if (updatedEntities.hasOwnProperty(dataset_item_id)) {
            const existingItemIndex = updatedEntities[
              dataset_item_id
            ].findIndex(
              (existingItem) =>
                existingItem.ontology_item_id === newItem.ontology_item_id &&
                existingItem.start === newItem.start &&
                existingItem.end === newItem.end
            );

            if (existingItemIndex === -1) {
              updatedEntities[dataset_item_id] = [
                ...updatedEntities[dataset_item_id],
                newItem,
              ];
            }
          } else {
            updatedEntities[dataset_item_id] = [newItem];
          }
        });
      }

      const updatedRelations = { ...state.relations }; // create a copy of the target object
      if (action.payload.relations) {
        action.payload.relations.forEach((item) => {
          const { dataset_item_id, ...newItem } = item;
          if (updatedRelations.hasOwnProperty(dataset_item_id)) {
            const existingItemIndex = updatedRelations[
              dataset_item_id
            ].findIndex(
              (existingItem) =>
                existingItem.source_id === newItem.source_id &&
                existingItem.target_id === newItem.target_id &&
                existingItem.ontology_item_id === newItem.ontology_item_id
            );

            if (existingItemIndex === -1) {
              updatedRelations[dataset_item_id] = [
                ...updatedRelations[dataset_item_id],
                newItem,
              ];
            }
          } else {
            updatedRelations[dataset_item_id] = [newItem];
          }
        });
      }

      return {
        ...state,
        entities: updatedEntities,
        relations: updatedRelations,
      };
    }
    case ActionTypes.UPDATE_OPTIMISTIC_ITEM_STATE: {
      //   console.log("update markup status", action.payload);

      const updatedEntities = { ...state.entities }; // create a copy of the target object
      if (action.payload.entities) {
        action.payload.entities.forEach((item) => {
          const { dataset_item_id, ...newItem } = item;
          if (updatedEntities.hasOwnProperty(dataset_item_id)) {
            updatedEntities[dataset_item_id] = updatedEntities[
              dataset_item_id
            ].map((e) => {
              if (
                e.start === newItem.start &&
                e.end === newItem.end &&
                e.ontology_item_id === newItem.ontology_item_id
              ) {
                return { ...e, id: newItem.id, status: "success", error: null };
              } else {
                return e;
              }
            });
          }
        });
      }

      return { ...state, entities: updatedEntities };
    }
    case "ACCEPT_ANNOTATION": {
      const updatedEntities = Object.entries(state.entities).reduce(
        (acc, [key, value]) => {
          acc[key] = value.map((item) => {
            if (action.payload.entity_ids.includes(item.id)) {
              return { ...item, suggested: false };
            }
            return item;
          });
          return acc;
        },
        {}
      );

      let updatedRelations = { ...state.relations }; // Create copy.
      if (action.payload.relation_ids) {
        updatedRelations = Object.entries(state.relations).reduce(
          (acc, [key, value]) => {
            acc[key] = value.map((item) => {
              if (
                // action.payload.relation_ids == null ||
                action.payload.relation_ids.includes(item.id)
              ) {
                return { ...item, suggested: false };
              }
              return item;
            });
            return acc;
          },
          {}
        );
      }

      // Update history

      return {
        ...state,
        entities: updatedEntities,
        relations: updatedRelations,
      };
    }
    case ActionTypes.DELETE_ANNOTATION: {
      try {
        const filteredEntities = { ...state.entities };
        if (action.payload.entity_ids) {
          Object.keys(filteredEntities).forEach((key) => {
            filteredEntities[key] = filteredEntities[key].filter(
              (e) => !action.payload.entity_ids.includes(e.id)
            );
          });
        }

        const filteredRelations = { ...state.relations };
        if (action.payload.relation_ids) {
          Object.keys(filteredRelations).forEach((key) => {
            filteredRelations[key] = filteredRelations[key].filter(
              (e) => !action.payload.relation_ids.includes(e.id)
            );
          });
        }

        return {
          ...state,
          entities: filteredEntities,
          relations: filteredRelations,
        };
      } catch (error) {
        console.log("error DELETE_ANNOTATION", error);
        break;
      }
    }
    case ActionTypes.RESTORE_MARKUP: {
      console.log(action.payload);

      let restoredEntities = { ...state.entities };
      if (action.payload.entities) {
        Object.keys(restoredEntities).forEach((key) => {
          if (action.payload.entities.hasOwnProperty(key)) {
            restoredEntities[key] = [
              ...restoredEntities[key],
              ...action.payload.entities[key],
            ];
          }
        });
      }

      const restoredRelations = { ...state.relations };
      if (action.payload.relations) {
        Object.keys(restoredRelations).forEach((key) => {
          if (action.payload.relations.hasOwnProperty(key)) {
            restoredRelations[key] = [
              ...restoredRelations[key],
              ...action.payload.relations[key],
            ];
          }
        });
      }

      return {
        ...state,
        entities: restoredEntities,
        relations: restoredRelations,
      };
    }
    case ActionTypes.SET_SOURCE_SPAN: {
      // console.log("SETTING SOURCE SPAN");
      /**
       * Updates state of entities (source, related, unrelated) for contextual styling and
       * Sets source span for relation annotation
       */

      const span = action.payload.span;
      const textId = action.payload.textId;
      const textRelations = state.relations[textId]
        ? state.relations[textId].filter((r) => r.source_id === span.id)
        : []; // Relations where span is source.

      state.entities[textId] = state.entities[textId].map((entity) => {
        if (entity.id === span.id) {
          return { ...entity, state: "source" };
        } else if (
          textRelations.filter((r) => r.target_id === entity.id).length > 0
        ) {
          return { ...entity, state: "related" };
        } else {
          return { ...entity, state: "unrelated" };
        }
      });

      return {
        ...state,
        sourceSpan: {
          id: span.id,
          start: span.start,
          end: span.end,
          ontologyItemId: span.ontology_item_id, //action.payload.labelId,
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
    case "TOGGLE_ENTITY_ANNOTATION_MODE": {
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
        entityAnnotationMode: true,
        sourceSpan: null,
        targetSpan: null,
      };
    }
    case "TOGGLE_SOCIAL_MENU": {
      return {
        ...state,
        showMenu: true,
        menuView: "social",
        discussionDatasetItemId: action.payload.datasetItemId,
        discussionDatasetItemText: state.texts[
          action.payload.datasetItemId
        ].tokens
          .map((t) => t.value)
          .join(" "),
      };
    }
    case "TOGGLE_MENU": {
      if (state.showMenu && state.menuView === "social") {
        // Turn off the active discussion.
        return {
          ...state,
          showMenu: false,
          discussionDatasetItemId: null,
          discussionDatasetItemText: null,
        };
      }
      return { ...state, showMenu: !state.showMenu };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
};
