import { useEffect, useState } from "react";
import { GiProgression } from "react-icons/gi";
import { IoGitCommit, IoGitPullRequest, IoShareSocial } from "react-icons/io5";
import { useSelector } from "react-redux";
import { selectProject } from "../../project/projectSlice";
import axios from "../../utils/api-interceptor";
import "../Dashboard.css";
import { Labels } from "./Labels";
import { Grid, Tab, Tabs } from "@mui/material";
import { Loader } from "../../common/Loader";

export const Overview = () => {
  const project = useSelector(selectProject);
  const DEFAULT_MEASURES = [
    {
      title: "Overall",
      name: "overall",
      icon: <GiProgression />,
      description: "Overall project progress to date",
      disabled: false,
    },
    {
      title: "Entities",
      name: "entity",
      icon: <IoGitCommit />,
      description:
        "Number of entities applied by all annotators (silver and weak)",
      disabled: false,
    },
    {
      title: "Relations",
      name: "relation",
      icon: <IoShareSocial />,
      description:
        "Number of relations applied by all annotators (silver and weak) - equal to the number of triples created.",
      disabled: project && !project.tasks.relationAnnotation,
    },
    {
      title: "Triples",
      name: "triple",
      icon: <IoGitPullRequest />,
      description: "Number of triples created", //(silver and weak)
      disabled: project && !project.tasks.relationAnnotation,
    },
  ];

  const DEFAULT_METRICS = [
    {
      name: "Project Progress",
      icon: <GiProgression />,
      content: null,
      key: "progress",
      title:
        "Progress made to date (only counts documents saved by the minimum number of annotators)",
      display: true,
    },
    {
      name: "Annotator Agreement",
      icon: <GiProgression />,
      content: null,
      key: "averageIAA",
      title: "Average overall inter-annotator agreement",
      display: true,
    },
    {
      name: "Entities Created",
      icon: <IoGitCommit />,
      content: null,
      key: "entities",
      title:
        "Count of agreed upon entities (silver and weak) created by annotators",
      display: true,
    },
    {
      name: "Triples Created",
      icon: <IoGitPullRequest />,
      content: null,
      key: "triples",
      title: "Count of agreed upon triples created by annotators",
      display: project && project.tasks.relationAnnotation,
    },
  ];
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [measures, setMeasures] = useState(DEFAULT_MEASURES);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [value, setValue] = useState("overall");
  const handleChange = (event, newValue) => {
    setValue(newValue);
    setGraphLoaded(false);
  };
  const [graphLoaded, setGraphLoaded] = useState(false);

  useEffect(() => {
    const fetchMeasures = async () => {
      if (project._id && !metricsLoaded) {
        const response = await axios.get(
          `/api/project/dashboard/overview/${project._id}`
        );
        if (response.status === 200) {
          const data = response.data; // Comes back as [<Object>]
          setMetrics((prevState) =>
            prevState.map((m) => {
              let value;
              switch (m.key) {
                case "progress":
                  value = `${Math.round(data[m.key])}%`;
                  break;
                case "averageIAA":
                  if (data[m.key].overall === null) {
                    value = "-";
                  } else if (data[m.key].entity === null) {
                    value = "-";
                  } else if (!project.tasks.relationAnnotation) {
                    value = `${data[m.key].entity}%`;
                  } else if (project.tasks.relationAnnotation) {
                    value = `${data[m.key].overall}%`;
                  } else {
                    value = "error";
                  }
                  break;
                default:
                  value = data[m.key];
                  break;
              }
              return {
                ...m,
                content: value,
              };
            })
          );
          setMetricsLoaded(true);
        }
      }
    };
    fetchMeasures();
  }, [project, metricsLoaded]);

  if (!metricsLoaded) {
    return <Loader message={"Loading metrics"} />;
  } else {
    return (
      <>
        <Grid item xs={12}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-evenly",
            }}
          >
            {metrics
              .filter((m) => m.display)
              .map((m) => (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "1rem",
                    cursor: "help",
                  }}
                  title={m.title}
                >
                  <span id="overview-metrics-value">
                    {m.content === null ? "-" : m.content}
                  </span>
                  <span id="overview-metrics-name">{m.name}</span>
                </div>
              ))}
          </div>
          <hr />
        </Grid>
        <Grid item xs={12} container>
          <Grid item xs={12} sx={{ mb: 4 }}>
            <Tabs
              centered
              value={value}
              onChange={handleChange}
              textColor="primary"
              indicatorColor="primary"
              aria-label="secondary tabs example"
            >
              {measures
                .filter((m) => !m.disabled)
                .map((m) => (
                  <Tab
                    icon={m.icon}
                    iconPosition="start"
                    value={m.name}
                    label={m.title}
                  />
                ))}
            </Tabs>
          </Grid>
          <Grid item xs={12}>
            <Labels
              projectId={project._id}
              type={value}
              graphLoaded={graphLoaded}
              setGraphLoaded={setGraphLoaded}
            />
          </Grid>
        </Grid>
      </>
    );
  }
};
