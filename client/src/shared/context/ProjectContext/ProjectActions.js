export const ActionTypes = {
  SET_PROJECT_ID: "SET_PROJECT_ID",
  SET_PROJECT: "SET_PROJECT",
  SET_TEXTS: "SET_TEXTS",
  SET_VALUE: "SET_VALUE",
  SET_PAGE: "SET_PAGE",
  SET_TEXTS_LOADING: "SET_TEXTS_LOADING",
  SAVE_DATASET_ITEMS: "SAVE_DATASET_ITEMS",
  APPLY_ANNOTATION: "APPLY_ANNOTATION",
  ACCEPT_ANNOTATION: "ACCEPT_ANNOTATION",
  DELETE_ANNOTATION: "DELETE_ANNOTATION",
  UPDATE_OPTIMISTIC_ITEM_STATE: "UPDATE_OPTIMISTIC_ITEM_STATE",
  RESTORE_MARKUP: "RESTORE_MARKUP",
  SET_SOURCE_SPAN: "SET_SOURCE_SPAN",
  REMOVE_SOURCE_TARGET_RELS: "REMOVE_SOURCE_TARGET_RELS",
  TOGGLE_ANNOTATION_MODE: "TOGGLE_ANNOTATION_MODE",
  TOGGLE_SOCIAL_MENU: "TOGGLE_SOCIAL_MENU",
  TOGGLE_MENU: "TOGGLE_MENU",
};

export const setValue = (payload) => ({
  type: ActionTypes.SET_VALUE,
  payload: payload,
});

export const updateOptimisticItemState = ({
  entities = null,
  relations = null,
}) => ({
  type: ActionTypes.UPDATE_OPTIMISTIC_ITEM_STATE,
  payload: { entities, relations },
});

export const applyAnnotation = ({ entities = null, relations = null }) => ({
  type: ActionTypes.APPLY_ANNOTATION,
  payload: { entities, relations },
});

export const deleteAnnotation = ({
  entity_ids = null,
  relation_ids = null,
}) => ({
  type: ActionTypes.DELETE_ANNOTATION,
  payload: { entity_ids, relation_ids },
});

export const restoreMarkup = ({ entities = null, relations = null }) => ({
  type: ActionTypes.RESTORE_MARKUP,
  payload: { entities, relations },
});
