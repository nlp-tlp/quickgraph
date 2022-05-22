import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../utils/api-interceptor";
import { getFlatOntology } from "./utils";

const initialState = {
  details: {},
  id: null,
  status: "idle",
  error: null,
  filters: {
    search: {
      name: "Search",
      title: "Filter for searching document contents",
      value: "",
      defaultValue: "",
      display: true,
    },
    saved: {
      name: "Saved",
      title: "Filter for saved state on documents",
      value: "all",
      options: ["all", "yes", "no"],
      defaultValue: "all",
      display: true,
    },
    // annotated: {
    //   name: "Annotated",
    //   title: "Filter for annotation state of documents",
    //   value: "all",
    //   options: ["all", "silver", "weak", "none"], // "silver and weak",
    //   defaultValue: "all",
    //   display: true,
    // },
    cluster: {
      name: "Cluster",
      title: "Filter for clusters based on top-n terms",
      value: { all: "all" },
      options: { all: "all" }, // key is the cluster number and the value is the top_n_terms; {'all': 'all'} is for no filter.
      defaultValue: { all: "all" },
      display: true,
    },
    textIds: {
      display: false,
      value: [],
    },
  },
  sorting: {
    cluster: "",
    sasved: "",
    annotated: "",
  },
  savePending: false,
  metrics: null,
  metricsStatus: "idle",
  activeModal: null,
  modalInfo: null,
  schema: null,
  activeEntityClass: 0,
  keyBinding: {},
  deleteProjectStatus: "idle",
  flatOntology: [],
};

export const fetchProject = createAsyncThunk(
  "/project/fetchProject",
  async ({ projectId }) => {
    const response = await axios.get(`/api/project/${projectId}`);
    return response.data;
  }
);

export const deleteProject = createAsyncThunk(
  "/feed/deleteProject",
  async ({ projectId }) => {
    const response = await axios.delete(`/api/project/${projectId}`);
    return { response: response.data, details: { projectId: projectId } };
  }
);

export const fetchMetrics = createAsyncThunk(
  "/project/fetchMetrics",
  async ({ projectId }) => {
    const response = await axios.get(`/api/project/metrics/${projectId}`);
    return response.data;
  }
);

export const patchProjectSchema = createAsyncThunk(
  "/project/patchProjectSchema",
  async ({ projectId, metaTag, colour }) => {
    const response = await axios.post("/api/map", {
      project_id: projectId,
      type: metaTag,
      colour: colour,
    });
    return {
      response: response.data,
      details: {
        metaTag: metaTag,
        colour: colour,
      },
    };
  }
);

export const inviteAnnotators = createAsyncThunk(
  "/project/inviteAnnotators",
  async ({ projectId, userIds, docDistributionMethod }) => {
    const response = await axios.post(
      `/api/user/management/invite/${projectId}`,
      {
        user_ids: userIds,
        doc_distribution_method: docDistributionMethod,
      }
    );
    return response.data;
  }
);

export const updateAnnotator = createAsyncThunk(
  "/project/updateAnnotator",
  async ({ projectId, userId, action }) => {
    const response = await axios.post("/api/user/management/user", {
      project_id: projectId,
      user_id: userId,
      action: action,
    });
    return response.data;
  }
);

export const patchProjectDetails = createAsyncThunk(
  "/project/patchProjectDetails",
  async ({ projectId, field, value }) => {
    const response = await axios.patch(`/api/project/${projectId}`, {
      field: field,
      value: value,
    });
    return response.data;
  }
);

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    resetFilters: (state, action) => {
      // Reset filters to initial state except clusters as they are data driven.
      state.filters = {
        ...initialState.filters,
        cluster: { ...state.filters.cluster, value: { all: "all" } },
      };
    },
    setActiveModal: (state, action) => {
      state.activeModal = action.payload;
    },
    setModalInfo: (state, action) => {
      state.modalInfo = action.payload;
    },
    setProject: (state, action) => {
      state.metrics = null;
      state.details = action.payload;
    },
    setActiveEntityClass: (state, action) => {
      // Sets the active entity class
      state.activeEntityClass = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProject.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.status = "succeeded";
        // console.log("Fetch project response", action.payload);
        // Add fetched project to details
        state.details = action.payload;
        state.id = action.payload._id;

        // Flatten entity and relation ontologies
        // src: https://stackoverflow.com/questions/58908893/flatten-array-of-objects-with-nested-children

        // TODO: Add keybinding to each item
        state.flatOntology = getFlatOntology(action.payload.ontology);

        state.keyBinding = Object.assign(
          {},
          ...action.payload.ontology
            .filter((item) => item.isEntity)
            .map((label, index) => ({
              [index + 1]: label,
            }))
        );

        // Set cluster filter (if applicable)
        if (action.payload.settings.performClustering) {
          state.filters.cluster.options = Object.assign(
            {},
            ...[
              initialState.filters.cluster.options,
              ...Object.keys(action.payload.clusterDetails).map(
                (clusterNo) => ({
                  [clusterNo]:
                    action.payload.clusterDetails[clusterNo].top_n_terms,
                })
              ),
            ]
          );
        }
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.deleteProjectStatus = "failed";
      })
      .addCase(deleteProject.pending, (state, action) => {
        state.deleteProjectStatus = "loading";
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        // console.log("deleted project", action.payload);
        state.deleteProjectStatus = "succeeded";
      })
      .addCase(fetchMetrics.pending, (state, action) => {
        state.metricsStatus = "loading";
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        // Fetches aggregate metrics of project progess
        state.metricsStatus = "succeeded";
        state.metrics = action.payload[0];
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.metricsStatus = "failed";
      })
      .addCase(patchProjectSchema.fulfilled, (state, action) => {
        // Adds a new meta tag to the project schema
        const details = action.payload.details;
        state.schema.contents = {
          ...state.schema.contents,
          [details.metaTag]: action.payload.response,
        };
        state.schema.map_keys = [...state.schema.map_keys, details.metaTag];
        state.schema.colour_map = {
          ...state.schema_colour_map,
          [details.metaTag]: details.colour,
        };

        // Need to update other dependent state values... (this is redudant...)
        state.bgColourMap = {
          ...state.bgColourMap,
          [details.metaTag]: details.colour,
        };
        state.activeMaps = [...state.activeMaps, details.metaTag];
      })
      .addCase(inviteAnnotators.fulfilled, (state, action) => {
        // Update project details with invited annotators
        state.details = action.payload;
      })
      .addCase(updateAnnotator.fulfilled, (state, action) => {
        // Update annotator state (or remove entirely)
        state.details = action.payload;
      })
      .addCase(patchProjectDetails.fulfilled, (state, action) => {
        // Update project details
        state.details = action.payload;
      });
  },
});

export const {
  setActiveModal,
  setModalInfo,
  setProject,
  setFilters,
  resetFilters,
  setActiveEntityClass,
  setActiveKey,
} = projectSlice.actions;

export const selectProject = (state) => state.project.details;
export const selectProjectStatus = (state) => state.project.status;
export const selectDeleteProjectStatus = (state) =>
  state.project.deleteProjectStatus;
export const selectProjectMetrics = (state) => state.project.metrics;
export const selectProjectMetricsStatus = (state) =>
  state.project.metricsStatus;
export const selectActiveModal = (state) => state.project.activeModal;
export const selectModalInfo = (state) => state.project.modalInfo;
export const selectProjectSchema = (state) => state.project.schema;
export const selectFilters = (state) => state.project.filters;
export const selectActiveEntityClass = (state) =>
  state.project.activeEntityClass;
export const selectKeyBinding = (state) => state.project.keyBinding;
export const selectFlatOntology = (state) => state.project.flatOntology;

export default projectSlice.reducer;
