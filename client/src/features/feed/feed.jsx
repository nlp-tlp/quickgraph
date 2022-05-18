import { Button, Grid } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "../common/Loader";
import history from "../utils/history";
import "./Feed.css";
import {
  fetchProjects,
  selectFeedError,
  selectFeedStatus,
  selectProjects,
} from "./feedSlice";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ArticleIcon from "@mui/icons-material/Article";
import GroupIcon from "@mui/icons-material/Group";
import LayersIcon from "@mui/icons-material/Layers";

export const Feed = () => {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const feedStatus = useSelector(selectFeedStatus);
  const feedError = useSelector(selectFeedError);

  useEffect(() => {
    if (feedStatus === "idle") {
      dispatch(fetchProjects());
    }
  }, [feedStatus]);

  if (feedStatus !== "succeeded") {
    return <Loader message={"Projects loading"} />;
  } else if (projects.length === 0) {
    return (
      <Grid
        item
        xs={12}
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <h2>No Projects</h2>
        <Button
          variant="contained"
          color="primary"
          onClick={() => history.push("/project/new")}
        >
          Create One
        </Button>
      </Grid>
    );
  } else {
    return <ProjectList />;
  }
};

const ProjectList = () => {
  const projects = useSelector(selectProjects);

  const kFormatter = (num) => {
    return Math.abs(num) > 999
      ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "k"
      : Math.sign(num) * Math.abs(num);
  };

  return (
    <Grid
      container
      direction="row"
      columnSpacing={4}
      rowSpacing={4}
      sx={{ p: 8 }}
    >
      {projects.map((project) => (
        <Grid item xs={4} style={{ maxWidth: "700px" }}>
          <Card variant="outlined">
            <CardContent>
              <Grid container item spacing={3}>
                <Grid item xs={12}>
                  <span style={{ fontSize: "0.75rem" }}>
                    Created: {new Date(project.createdAt).toDateString()}
                  </span>
                </Grid>
                <Grid item xs={12} style={{ textAlign: "left" }}>
                  <h3>{project.name}</h3>
                  <h5 style={{ fontWeight: "normal", fontSize: "1rem" }}>
                    {project.description}
                  </h5>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions
              style={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<ArticleIcon />}
                  label={`${kFormatter(project.savedTexts)} of ${kFormatter(
                    project.totalTexts
                  )}`}
                  title="The number of documents annotated"
                />
                <Chip
                  icon={<GroupIcon />}
                  label={project.annotatorCount}
                  title="The number of active annotators"
                />
                <Chip
                  icon={<LayersIcon />}
                  label={
                    !project.tasks.relationAnnotation
                      ? "Entity Only"
                      : project.tasks.relationAnnotationType.toLowerCase() ===
                        "closed"
                      ? "Entity + Closed Relation"
                      : "Entity + Open Relation"
                  }
                  title="The task configuration for this project"
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  color="primary"
                  sx={{
                    ":hover": {
                      bgcolor: "primary.light",
                      color: "white",
                    },
                    mr: 1,
                  }}
                  href={`/annotation/${project._id}/page=1`}
                >
                  Annotate
                </Button>
                <Button
                  color="primary"
                  sx={{ ":hover": { color: "primary.main" }, ml: 1 }}
                  href={`/dashboard/${project._id}`}
                >
                  Dashboard
                </Button>
              </Stack>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
