import { useState, useContext } from "react";
import {
  Grid,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Typography,
  Stack,
  Box,
  Chip,
  Divider,
  Tooltip,
  Checkbox,
  MenuItem,
} from "@mui/material";
import { DashboardContext } from "../../../shared/context/dashboard-context";
import useDashboard from "../../../shared/hooks/api/dashboard";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import moment from "moment";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import DeleteIcon from "@mui/icons-material/Delete";
import { isEquivalent } from "../../../shared/utils/dashboard";
import LoadingAlert from "../../../shared/components/LoadingAlert";
import DownloadIcon from "@mui/icons-material/Download";

const Settings = () => {
  const { state } = useContext(DashboardContext);

  if (!state) {
    return <LoadingAlert message="Loading project settings" />;
  }
  return (
    <>
      <ProjectDetails />
      <Box sx={{ width: "100%" }} p="2rem 0rem">
        <Divider />
      </Box>
      <ProjectDownload />
      <Box sx={{ width: "100%" }} p="2rem 0rem">
        <Divider />
      </Box>
      <ProjectDelete />
    </>
  );
};

const ProjectDetails = () => {
  const { state, handleUpdate } = useContext(DashboardContext);
  const [values, setValues] = useState({
    name: state.name,
    description: state.description,
    settings: {
      annotators_per_item: state.settings.annotators_per_item,
      disable_propagation: state.settings.disable_propagation,
      disable_discussion: state.settings.disable_discussion,
    },
  });

  const hasChanges = !isEquivalent(values, state);
  const maxActiveAnnotators =
    state && state.annotators.filter((a) => a.state === "accepted").length;

  return (
    <>
      <Grid item xs={12} container alignItems="center" spacing={2}>
        <Grid item xs={4}>
          <Stack direction="column">
            <Typography variant="h6">Name</Typography>
            <Typography variant="caption">Update the project name</Typography>
          </Stack>
        </Grid>
        <Grid item xs={8} xl={6}>
          <TextField
            required
            id="project-name-textfield"
            type="text"
            margin="normal"
            placeholder={state.name}
            fullWidth
            value={values.name}
            onChange={(e) =>
              setValues((prevState) => ({ ...prevState, name: e.target.value }))
            }
            autoComplete="false"
            error={values.name === ""}
          />
        </Grid>
      </Grid>
      <Grid item xs={12} container alignItems="center" spacing={2}>
        <Grid item xs={4}>
          <Stack direction="column">
            <Typography variant="h6">Description</Typography>
            <Typography variant="caption">
              Update the project description
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={8} xl={6}>
          <TextField
            required
            id="project-description-textfield"
            type="text"
            margin="normal"
            placeholder={state.description}
            fullWidth
            value={values.description}
            onChange={(e) =>
              setValues((prevState) => ({
                ...prevState,
                description: e.target.value,
              }))
            }
            autoComplete="false"
            error={values.description === ""}
          />
        </Grid>
      </Grid>
      <Grid item container xs={12} alignItems="center" spacing={2}>
        <Grid item xs={4}>
          <Stack direction="column">
            <Typography variant="h6">Project Controls</Typography>
            <Typography variant="caption">
              Set controls used on this project
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={6} xl={6}>
          <Stack
            direction="column"
            justifyContent="flex-start"
            alignItems="flex-start"
            // spacing={2}
            rowGap={2}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.settings.disable_propagation}
                  onChange={(e) =>
                    setValues((prevState) => ({
                      ...prevState,
                      settings: {
                        ...prevState.settings,
                        disable_propagation: e.target.checked,
                      },
                    }))
                  }
                  name="disable-propagation-checkbox"
                />
              }
              label="Disable annotation propagation"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.settings.disable_discussion}
                  onChange={(e) =>
                    setValues((prevState) => ({
                      ...prevState,
                      settings: {
                        ...prevState.settings,
                        disable_discussion: e.target.checked,
                      },
                    }))
                  }
                  name="disable-discussions-checkbox"
                />
              }
              label="Disable dataset item discussions"
            />
            <TextField
              key="project-settings-min-annotators-select"
              select
              sx={{ width: 260 }}
              size="small"
              label="Minimum annotators per dataset item"
              value={values.settings.annotators_per_item}
              onChange={(e) =>
                setValues((prevState) => ({
                  ...prevState,
                  settings: {
                    ...prevState.settings,
                    annotators_per_item: e.target.value,
                  },
                }))
              }
            >
              {Array.from({ length: maxActiveAnnotators }, (_, i) => i + 1).map(
                (value) => (
                  <MenuItem key={`min-annotator-item-${value}`} value={value}>
                    {value}
                  </MenuItem>
                )
              )}
            </TextField>
          </Stack>
        </Grid>
      </Grid>
      <Grid
        item
        xs={12}
        container
        sx={{ width: "100%" }}
        justifyContent="right"
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Tooltip
            title={"Time since project was last updated"}
            arrow
            placement="bottom"
          >
            <Chip
              icon={<AccessTimeIcon />}
              label={`${moment.utc(state.updatedAt).fromNow()}`}
              size="small"
            />
          </Tooltip>
          <Button
            variant="contained"
            onClick={() => handleUpdate({ body: values })}
            disabled={!hasChanges}
          >
            Update
          </Button>
        </Stack>
      </Grid>
    </>
  );
};

const ProjectDownload = () => {
  const { state, downloadProject } = useContext(DashboardContext);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    downloadProject({ projectId: state.projectId });
    setDownloading(false);
  };

  return (
    <Grid
      item
      xs={12}
      container
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
    >
      <Grid item xs={4}>
        <Stack direction="column">
          <Typography variant="h6">Download Project</Typography>
          <Typography variant="caption">
            Download the entire project including its dataset, resources, and
            annotations.
          </Typography>
        </Stack>
      </Grid>
      <Grid
        item
        xs={8}
        xl={8}
        container
        sx={{ display: "flex", justifyContent: "right" }}
      >
        <LoadingButton
          variant="contained"
          loadingPosition="start"
          loading={downloading}
          color="primary"
          onClick={handleDownload}
          startIcon={<DownloadIcon />}
        >
          Download
        </LoadingButton>
      </Grid>
    </Grid>
  );
};

const ProjectDelete = () => {
  const theme = useTheme();
  const [deleting, setDeleting] = useState(false);

  const { state, handleDeleteProject: deleteProject } =
    useContext(DashboardContext);
  const [valueMatched, setValueMatched] = useState(false);
  const checkValueMatch = (value) => {
    setValueMatched(value === state.name);
  };

  const handleDelete = () => {
    setDeleting(true);
    deleteProject();
  };

  return (
    <Grid
      item
      xs={12}
      container
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
    >
      <Grid item xs={4}>
        <Stack direction="column">
          <Typography variant="h6" color="error">
            Delete Project
          </Typography>
          <Typography variant="caption">
            Enter the projects name to delete. Once you delete this project,
            there is no going back.{" "}
            <strong style={{ color: theme.palette.error.main }}>
              Please be certain.
            </strong>
          </Typography>
        </Stack>
      </Grid>
      <Grid
        item
        xs={8}
        xl={8}
        container
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <Grid item xs={8}>
          <TextField
            fullWidth
            id="delete-project-textfield"
            type="text"
            placeholder={state.name}
            autoComplete="false"
            onChange={(e) => checkValueMatch(e.target.value)}
            color="error"
          />
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ display: "flex", justifyContent: "right" }}>
            <LoadingButton
              variant="contained"
              loadingPosition="start"
              loading={deleting}
              color="error"
              disabled={!valueMatched}
              onClick={handleDelete}
              startIcon={<DeleteIcon />}
            >
              Delete
            </LoadingButton>
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Settings;
