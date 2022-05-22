import "./Dashboard.css";
import { useEffect, useState } from "react";
import history from "../utils/history";
import { BiNetworkChart } from "react-icons/bi";
import { FaDownload, FaUsers } from "react-icons/fa";
import { IoBarChart, IoLayers, IoPulse, IoSettings } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { selectUserId } from "../auth/userSlice";
import { fetchProject, selectProject } from "../project/projectSlice";
import { Annotators } from "./features/Annotators";
import { Downloads } from "./features/Downloads";
import { CustomGraph } from "./features/graph/Graph";
import { Overview } from "./features/Overview";
import { Settings } from "./features/Settings";
import { Adjudicator } from "./features/Adjudicator";
import { Corrector } from "./features/Corrector";

// New
import { Grid, Tabs, Tab, Card, CardContent, Button } from "@mui/material";
import { Loader } from "../common/Loader";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

export const Dashboard = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const projectStatus = useSelector((state) => state.project.status);
  const { projectId, viewKey } = useParams();
  const [components, setComponents] = useState({});
  const userId = useSelector(selectUserId);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [userIsPM, setUserIsPM] = useState();

  useEffect(() => {
    if (projectId && projectStatus === "idle") {
      dispatch(fetchProject({ projectId: projectId }));
    }
    if (project && userId && !roleLoaded && projectStatus === "succeeded") {
      setUserIsPM(userId === project.projectManager);
      setRoleLoaded(true);
    }
  }, [roleLoaded, userIsPM, userId, project, projectId, projectStatus]);

  useEffect(() => {
    if (roleLoaded) {
      setComponents({
        overview: {
          icon: <IoBarChart />,
          title: "Overview",
          description: "View project progress and statistics",
          body: <Overview projectId={projectId} />,
          disabled: false,
          show: true,
        },
        graph: {
          icon: <BiNetworkChart />,
          title: "Knowledge Graph",
          description:
            "View and interact with knowledge graph as its constructed",
          body: <CustomGraph />,
          disabled:
            (project && !project.tasks.relationAnnotation) ||
            project.tasks.relationAnnotationType === "open",
          show: true,
        },
        annotators: {
          icon: <FaUsers />,
          title: `Annotators (${
            project.annotators && project.annotators.length
          })`,
          description: "Manage project annotators",
          body: <Annotators />,
          disabled: project && project.tasks.relationAnnotationType === "open",
          show: userIsPM,
        },
        adjudicator: {
          icon: <IoLayers />,
          title: "Adjudicator",
          description: "hello world",
          body: <Adjudicator />,
          disabled: project && project.tasks.relationAnnotationType === "open",
          show: true,
        },
        corrector: {
          icon: <IoPulse />,
          title: "Corrector",
          description: "hello world",
          body: <Corrector />,
          disabled: true,
          show: false,
        },
        downloads: {
          icon: <FaDownload />,
          title: "Downloads",
          description: "View and download annotation resources",
          body: <Downloads project={project} />,
          disabled: false,
          show: userIsPM,
        },
        settings: {
          icon: <IoSettings />,
          title: "Settings",
          description: "Manage project settings",
          body: <Settings />,
          disabled: false,
          show: userIsPM,
        },
      });
    }
  }, [roleLoaded]);

  const [value, setValue] = useState("overview");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  if (roleLoaded && Object.keys(components).length > 0) {
    return (
      <Grid item style={{ width: "75vw", maxWidth: "1600px" }}>
        <Grid item style={{ margin: "1rem 0rem" }}>
          <Card variant="outlined">
            <CardContent
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h3>{project.name}</h3>
                <span>{project.description}</span>
              </div>
              <Button
                variant="outlined"
                onClick={() =>
                  history.push(`/annotation/${project._id}/page=1`)
                }
                endIcon={<ArrowRightIcon />}
              >
                Annotate
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item style={{ margin: "1rem 0rem" }}>
          <Card variant="outlined">
            <CardContent>
              <Tabs
                centered
                value={value}
                onChange={handleChange}
                textColor="primary"
                indicatorColor="primary"
                // scrollButtons="auto"
                // variant="scrollable"
              >
                {Object.keys(components)
                  .filter((key) => components[key].show)
                  .map((key) => {
                    return (
                      <Tab
                        icon={components[key].icon}
                        iconPosition="start"
                        value={key}
                        label={components[key].title}
                        disabled={components[key].disabled}
                      />
                    );
                  })}
              </Tabs>
            </CardContent>
          </Card>
        </Grid>
        <Grid item>
          <Card variant="outlined">
            <CardContent>{components[value].body}</CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  } else {
    return <Loader message={"Dashboard loading"} />;
  }
};
