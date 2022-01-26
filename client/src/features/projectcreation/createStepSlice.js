import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  id: null,
  status: "idle",
  error: null,
  steps: {
    details: {
      number: 0,
      saved: false,
      data: {
        name: "",
        description: "",
        performRelationAnnotation: false,
        relationAnnotationType: "",
        performClustering: false,
      },
      valid: false,
    },
    upload: {
      number: 1,
      saved: false,
      data: {
        corpus: [],
        corpusFileName: null,
      },
      valid: false,
    },
    preprocessing: {
      number: 2,
      saved: false,
      data: {
        lowercase: false,
        removeDuplicates: false,
        removeChars: false,
        removeCharSet: '~",?;!:()[]_{}*.$',
      },
      valid: true, // No mandatory steps here, all optional.
    },
    schema: {
      number: 3,
      saved: false,
      data: {
        conceptName: "",
        conceptLabels: [],
        relationName: "",
        relationLabels: [],
      },
      valid: false,
    },
    preannotation: {
      number: 4,
      saved: false,
      data: {
        entityDictionary: [],
        entityDictionaryFileName: null,
        typedTripleDictionary: [],
        typedTripleDictionaryFileName: null,
      },
      valid: true, // No mandatory steps here, all optional.
    },
    review: {
      number: 5,
      saved: false,
      data: { name: "", description: "" },
      valid: false,
    },
  },
  activeStep: "details",
};

export const createStepSlice = createSlice({
  name: "create",
  initialState: initialState,
  reducers: {
    setStep: (state, action) => {
      state.steps = action.payload;
    },
    setStepData: (state, action) => {
      // Sets a value for a key in the data associated with a step
      const newData = {
        ...state.steps[state.activeStep].data,
        ...action.payload,
      };

      state.steps[state.activeStep] = {
        ...state.steps[state.activeStep],
        data: newData,
      };
    },
    setActiveStep: (state, action) => {
      state.activeStep = action.payload;
    },
    incrementActiveStep: (state, action) => {
      const currentStepNo = state.steps[state.activeStep].number;
      const nextStepNo = currentStepNo + 1;

      state.activeStep = Object.keys(state.steps).filter(
        (stepName) => state.steps[stepName].number === nextStepNo
      )[0];
    },
    decrementActiveStep: (state, action) => {
      const currentStepNo = state.steps[state.activeStep].number;
      const nextStepNo = currentStepNo - 1;

      state.activeStep = Object.keys(state.steps).filter(
        (stepName) => state.steps[stepName].number === nextStepNo
      )[0];
    },
    resetSteps: (state, action) => {
      state.steps = initialState.steps;
      state.activeStep = Object.keys(initialState.steps)[0];
    },
    saveStep: (state, action) => {
      state.steps[state.activeStep] = {
        ...state.steps[state.activeStep],
        saved: true,
      };
    },
    setStepValid: (state, action) => {
      state.steps[state.activeStep] = {
        ...state.steps[state.activeStep],
        valid: action.payload,
      };
    },
    addReplacement: (state, action) => {
      // Adds a new key-value pair to the replacements; {key:value}
      state.steps.upload.data.replacements = {
        ...state.steps.upload.data.replacements,
        ...action.payload,
      };
    },
    patchReplacement: (state, action) => {
      // Updates either the key or value of a replacement pair; removing the old one
      // state.steps["upload"].data.replacements =
    },
    deleteReplacement: (state, action) => {
      // Deletes a replacement pair
      delete state.steps.upload.data.replacements[action.payload];
    },
    setMetaTags: (state, action) => {
      // Sets a single meta-tag
      state.steps.schema.data.metaTags = {
        ...state.steps.schema.data.metaTags,
        ...action.payload,
      };
    },
    deleteMetaTag: (state, action) => {
      // Deletes a single meta tag
      delete state.steps.schema.data.metaTags[action.payload];
    },
    setMetaTagData: (state, action) => {
      // Adds external data (uploaded or entered manually) to meta tag
      state.steps.schema.data.metaTags[action.payload.name].data =
        action.payload.data;
      state.steps.schema.data.metaTags[action.payload.name].meta =
        action.payload.meta;
    },
  },
});

export const {
  setStep,
  setStepData,
  setActiveStep,
  resetSteps,
  saveStep,
  incrementActiveStep,
  decrementActiveStep,
  setStepValid,
  addReplacement,
  patchReplacement,
  deleteReplacement,
  setMetaTags,
  deleteMetaTag,
  setMetaTagData,
} = createStepSlice.actions;

export const selectSteps = (state) => state.create.steps;
export const selectActiveStep = (state) => state.create.activeStep;
export const selectCorpus = (state) => state.create.steps.upload.data.corpus;
export const selectReplacements = (state) =>
  state.create.steps.upload.data.replacements;
export const selectPreprocessingActions = (state) =>
  state.create.steps.preprocessing.data;
export const selectMetaTags = (state) =>
  state.create.steps.schema.data.metaTags;
export const selectPreannotationActions = (state) =>
  state.create.steps.preannotation.data;
export const selectPerformRelationAnnotation = (state) =>
  state.create.steps.details.data.performRelationAnnotation;

export default createStepSlice.reducer;
