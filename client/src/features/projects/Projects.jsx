import { useEffect, useState } from "react";
import {
  Grid,
  Button,
  Stack,
  Typography,
  Skeleton,
  Box,
  Paper,
  Tooltip,
  Avatar,
  AvatarGroup,
  LinearProgress,
} from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import { Link, useNavigate } from "react-router-dom";
import useProjects from "../../shared/hooks/api/projects";
import moment from "moment";
import { useTheme } from "@mui/material/styles";
import MainContainer from "../../shared/components/Layout/MainContainer";
import Filter from "./Filter";
import { alpha } from "@mui/material/styles";
import TimelineIcon from "@mui/icons-material/Timeline";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const Projects = () => {
  const { error, fetchProjects, data: projects, loading } = useProjects();
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (loading) {
      fetchProjects();
    }
  }, [loading]);

  useEffect(() => {
    setFilteredData(projects);
  }, [projects]);

  if (error) {
    // : {error.message}
    return <div>Error</div>;
  }

  return (
    <MainContainer>
      <Grid item container xs={12} p="1rem 0rem">
        <Filter
          loading={loading}
          data={projects}
          filteredData={filteredData}
          setFilteredData={setFilteredData}
        />
      </Grid>
      <Grid
        item
        sx={{
          height: "calc(100vh - 297px)",
          overflowY: "auto",
        }}
      >
        {loading ? (
          <Grid
            item
            container
            xs={12}
            spacing={4}
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <CreateProjectCard />
            {Array(5)
              .fill()
              .map((_, index) => (
                <Grid
                  item
                  container
                  xs={12}
                  md={12}
                  lg={6}
                  xl={4}
                  key={`skeleton-grid-${index}`}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Box as={Paper} variant="outlined">
                    <Skeleton
                      key={`skeleton-${index}`}
                      variant="rectangular"
                      height={295}
                      width={400}
                    />
                  </Box>
                </Grid>
              ))}
          </Grid>
        ) : (
          <ProjectList projects={filteredData} />
        )}
      </Grid>
    </MainContainer>
  );
};

const ProjectList = ({ projects }) => {
  return (
    <Grid container direction="row" spacing={4}>
      <CreateProjectCard />
      {projects &&
        Array.isArray(projects) &&
        projects.map((project, index) => (
          <ProjectCard project={project} index={index} />
        ))}
    </Grid>
  );
};

const CreateProjectCard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Grid item xs={12} md={12} lg={6} xl={4}>
      <Box
        as={Button}
        variant="outlined"
        p={2}
        sx={{
          height: "100%",
          minHeight: 295,
          width: "100%",
          borderStyle: "dashed",
          borderColor: theme.palette.primary.main,
        }}
        onClick={() => navigate("/project-creator/details")}
      >
        Create New Project
      </Box>
    </Grid>
  );
};

const ProjectCard = ({ project, index }) => {
  const theme = useTheme();

  const kFormatter = (num) => {
    return Math.abs(num) > 999
      ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "k"
      : Math.sign(num) * Math.abs(num);
  };

  const inProgress = project.saved_items !== project.total_items;

  return (
    <Grid
      item
      xs={12}
      md={12}
      lg={6}
      xl={4}
      key={`project-grid-item-${project._id}`}
    >
      <Box as={Paper} variant="outlined">
        <Box style={{ textAlign: "left" }} p={2}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="h5"
              sx={{ color: theme.palette.neutral.main, fontWeight: 300 }}
            >
              #{index + 1}
            </Typography>
            <Typography fontSize={22} fontWeight={700}>
              {project.name.length > 40
                ? project.name.slice(0, 40) + "..."
                : project.name}
            </Typography>
          </Stack>
        </Box>
        <Box>
          <LinearProgress
            title={`The number of documents annotated (saved by minimum annotators): ${kFormatter(
              project.saved_items
            )} of ${kFormatter(project.total_items)}`}
            value={(project.saved_items / project.total_items) * 100}
            variant="determinate"
          />
        </Box>
        <Box p={2}>
          <Stack direction="column" spacing={2}>
            <IconTypography
              icon={<TimelineIcon fontSize="small" color="primary" />}
              value={`Status: ${inProgress ? "In progress" : "Complete"}`}
              title={`This project is ${
                inProgress ? "in progress." : "complete"
              }`}
            />
            <IconTypography
              icon={<AssignmentIndIcon fontSize="small" color="primary" />}
              value={`Role: ${
                project.user_is_pm ? "Project Manager" : "Annotator"
              }`}
              title={`You are ${
                project.user_is_pm
                  ? " the manager of this"
                  : "an annotator on this"
              } project`}
            />
            <IconTypography
              icon={<LayersIcon fontSize="small" color="primary" />}
              value={`Task(s): ${
                !project.tasks.relation
                  ? "Entity Annotation Only"
                  : "Entity and Closed Relation Annotation"
              }
              `}
              title="The task configuration for this project"
            />
            <IconTypography
              icon={<AccessTimeIcon fontSize="small" color="primary" />}
              value={`Last updated: ${moment
                .utc(project.created_at)
                .fromNow()}`}
              title="The time since project was created"
            />
          </Stack>
        </Box>
        <Box
          p={2}
          display="flex"
          alignItems="center"
          justifyContent="right"
          sx={{ bgcolor: alpha("#f3e5f5", 0.25) }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
          >
            <AvatarGroup max={4}>
              {project.active_annotators.map((a) => (
                <Avatar
                  alt={a.username}
                  title={a.username}
                  sx={{
                    cursor: "help",
                    width: 28,
                    height: 28,
                  }}
                >
                  {a.username[0]}
                </Avatar>
              ))}
            </AvatarGroup>
            <Stack direction="row" spacing={2}>
              <Button
                as={Link}
                color="primary"
                variant="outlined"
                size="small"
                to={`/dashboard/${project._id}/overview`}
                sx={{
                  textDecoration: "none",
                  bgcolor: "white",
                }}
                disableElevation
                title="Click to navigate to this projects dashboard"
              >
                Dashboard
              </Button>
              <Button
                as={Link}
                to={`/annotation/${project._id}/?page=1`}
                sx={{ textDecoration: "none" }}
                color="primary"
                variant="contained"
                size="small"
                disableElevation
                title="Click to annotate this projects"
              >
                Annotate
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Grid>
  );
};

const IconTypography = ({ value, icon, title }) => {
  return (
    <Tooltip title={title}>
      <Stack
        direction="row"
        alignItems="top"
        spacing={0.5}
        sx={{
          fontSize: 12,
          color: "rgba(0,0,0,0.75)",
          cursor: "help",
        }}
      >
        {icon}
        <Typography fontSize="inherit" fontWeight={500}>
          {value}
        </Typography>
      </Stack>
    </Tooltip>
  );
};

export default Projects;
