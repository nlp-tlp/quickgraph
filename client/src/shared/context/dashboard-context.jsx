import { createContext, useReducer, useEffect, useContext } from "react";
import axiosInstance from "../utils/api";
import { SnackbarContext } from "./snackbar-context";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const initialState = {
  loading: true,
  projectId: null,
  name: "",
  description: "",
  userIsPM: false,
  preprocessing: {},
  tasks: {},
  settings: {},
  annotators: [],
  dataset_items: [],
  showAnnotatorInviteModal: false,
};

export const DashboardContext = createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_PROJECT_ID":
      return { ...state, projectId: action.payload };
    case "SET_DASHBOARD":
      return {
        ...state,
        userIsPM: action.payload.user_is_pm,
        name: action.payload.name,
        description: action.payload.description,
        tasks: action.payload.tasks,
        preprocessing: action.payload.preprocessing,
        settings: action.payload.settings,
        annotators: action.payload.annotators,
        createdAt: action.payload.created_at,
        updatedAt: action.payload.updated_at,
        ontology: {
          entity: action.payload.entity_ontology.content,
          relation: action.payload.relation_ontology?.content || null,
        },
        entity_ontology_id: action.payload.entity_ontology._id,
        relation_ontology_id: action.payload.relation_ontology?._id || null,
        loading: false,
        datasetSize: action.payload.dataset_size,
        datasetId: action.payload.dataset_id,
        guidelines: action.payload.guidelines,
      };
    case "SET_VALUE":
      return { ...state, ...action.payload };
    case "SET_DISABLE_PROPAGATION":
      return {
        ...state,
        settings: { ...state.settings, disablePropagation: action.payload },
      };
    case "SET_GRAPH_DATA":
      return { ...state, ...action.payload };
    default:
      break;
  }
};

export const DashboardProvider = (props) => {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);

  useEffect(() => {
    if (state.projectId) {
      fetchDashboardInfo(state.projectId);
    }
  }, [state.projectId]);

  const fetchDashboardInfo = async (projectId) => {
    try {
      const token = await getAccessToken();

      const res = await axiosInstance.get(`/dashboard/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        dispatch({ type: "SET_DASHBOARD", payload: res.data });
      } else {
        throw new Error("Failed to retrieve dashboard information");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to retrieve dashboard information",
          severity: "error",
        },
      });
    }
  };

  const handleUpdateGuidelines = async ({ content }) => {
    try {
      const token = await getAccessToken();

      const res = await axiosInstance.patch(
        `/project/${state.projectId}/guidelines`,
        { content: content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        dispatch({
          type: "SET_VALUE",
          payload: {
            guidelines: { ...res.data.guidelines },
            updatedAt: res.data.updated_at,
          },
        });
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully updated project information",
            severity: "success",
          },
        });
      } else {
        throw new Error("Failed to update project guidelines");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to update project guidelines",
          severity: "error",
        },
      });
    }
  };

  const handleUpdate = async ({ body }) => {
    try {
      const token = await getAccessToken();

      const res = await axiosInstance.patch(
        `/project/${state.projectId}`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        // Do something
        dispatch({
          type: "SET_VALUE",
          payload: { ...body, updatedAt: res.data.updated_at },
        });
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully updated project information",
            severity: "success",
          },
        });
      } else {
        throw new Error("Failed to update project information");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to update project information",
          severity: "error",
        },
      });
    }
  };

  const handleDeleteProject = async () => {
    try {
      const token = await getAccessToken();

      const res = await axiosInstance.delete(`/project/${state.projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        navigate("/projects-explorer");
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully deleted project",
            severity: "success",
          },
        });
      } else {
        throw new Error("Failed to delete project");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to delete project",
          severity: "error",
        },
      });
    }
  };

  const handleRemoveAnnotator = async ({
    username,
    projectId,
    removeAnnotations,
    userIsLeaving = false,
  }) => {
    try {
      const token = await getAccessToken();

      const res = await axiosInstance.delete("/project/user", {
        params: {
          project_id: projectId,
          username: username,
          remove_annotations: removeAnnotations,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        dispatch({
          type: "SET_VALUE",
          payload: {
            annotators: state.annotators.filter((a) => a.username !== username),
          },
        });
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: `Successfully ${
              userIsLeaving ? "left" : "removed user from"
            } project`,
            severity: "success",
          },
        });
      } else {
        throw new Error();
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: `Unable to ${
            userIsLeaving ? "leave" : "remove annotator from"
          } project`,
          severity: "error",
        },
      });
    }
  };

  const handleInviteAnnotators = async ({
    usernames,
    docDistributionMethod = "all",
  }) => {
    try {
      const token = await getAccessToken();

      const res = await axiosInstance.post(
        `/project/user/invite/${state.projectId}`,
        {
          usernames: usernames,
          distribution_method: docDistributionMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        const validUsernames = res.data.valid;
        const invalidUsernames = res.data.invalid;

        if (validUsernames.length > 0) {
          dispatch({
            type: "SET_VALUE",
            payload: { annotators: validUsernames },
          });
          snackbarDispatch({
            type: "UPDATE_SNACKBAR",
            payload: {
              message: "Annotator(s) successfully invited to this project",
              severity: "success",
            },
          });
        }

        if (invalidUsernames.length > 0) {
          snackbarDispatch({
            type: "UPDATE_SNACKBAR",
            payload: {
              message: `Unable to invite annotator(s) to this project: ${invalidUsernames.join(
                ", "
              )}`,
              severity: "error",
            },
          });
        }
      } else {
        throw new Error("Unable to invite annotator(s) to this project");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to invite annotator(s) to this project",
          severity: "error",
        },
      });
    }
  };

  const fetchAnnotators = async ({ projectId }) => {
    try {
      const token = await getAccessToken();

      const res = await axiosInstance.get(`/project/${projectId}/annotators`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        // console.log(res.data);
        dispatch({ type: "SET_VALUE", payload: res.data });
        return res.data;
      } else {
        throw new Error("Failed to retrieve annotator information");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to retrieve annotator information",
          severity: "error",
        },
      });
    } finally {
    }
  };

  const fetchAnnotatorEfforts = async ({ projectId, params }) => {
    // Used to show the progress annotators have made on the project before downloading.
    try {
      const token = await getAccessToken();
      const res = await axiosInstance.get(`/dashboard/effort/${projectId}`, {
        params: params,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error("Failed to retrieve download information");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to retrieve download information",
          severity: "error",
        },
      });
    }
  };

  const handleUpdateAssignment = async ({
    projectId,
    datasetItemIds,
    username,
  }) => {
    try {
      const token = await getAccessToken();

      const res = await axiosInstance.patch(
        `/project/${projectId}/annotators/assignment`,
        { dataset_item_ids: datasetItemIds, username: username },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        const annotatorData = state.annotators.filter(
          (a) => a.username === username
        )[0];
        const updatedAnnotators = [
          ...state.annotators.filter((a) => a.username !== username),
          {
            ...annotatorData,
            scope_size: datasetItemIds.length,
            scope: datasetItemIds,
          },
        ];

        dispatch({
          type: "SET_VALUE",
          payload: { annotators: updatedAnnotators },
        });
        snackbarDispatch({
          type: "UPDATE_SNACKBAR",
          payload: {
            message: "Successfully updated annotator assignment(s)",
            severity: "success",
          },
        });
      } else {
        throw new Error("Failed to update annotator assignment(s)");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Failed to update annotator assignment(s)",
          severity: "error",
        },
      });
    }
  };

  const downloadProject = async ({ projectId }) => {
    try {
      const token = await getAccessToken();

      const res = await axiosInstance.get(`/project/download/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        // Prepare for file download
        const fileName = `project_download-${state.name}`;
        const json = JSON.stringify(res.data, null, 4);
        const blob = new Blob([json], { type: "application/json" });
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = fileName + ".json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error("Unable to download project");
      }
    } catch (error) {
      snackbarDispatch({
        type: "UPDATE_SNACKBAR",
        payload: {
          message: "Unable to download project",
          severity: "error",
        },
      });
    } finally {
      // setIsDownloading(false);
    }
  };

  const value = {
    state,
    dispatch,
    handleUpdate,
    handleUpdateGuidelines,
    handleDeleteProject,
    handleRemoveAnnotator,
    handleInviteAnnotators,
    fetchAnnotators,
    handleUpdateAssignment,
    fetchAnnotatorEfforts,
    downloadProject,
  };

  return (
    <DashboardContext.Provider value={value}>
      {props.children}
    </DashboardContext.Provider>
  );
};
