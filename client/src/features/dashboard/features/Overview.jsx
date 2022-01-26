import { useEffect, useState } from "react";
import { Card, Col, Container, Nav, Row, Spinner } from "react-bootstrap";
import { GiProgression } from "react-icons/gi";
import { IoGitCommit, IoGitPullRequest, IoShareSocial } from "react-icons/io5";
import { useSelector } from "react-redux";
import { selectProject } from "../../project/projectSlice";
import axios from "../../utils/api-interceptor";
import "../Dashboard.css";
import { Labels } from "./Labels";

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
      name: "Progress",
      icon: <GiProgression />,
      content: null,
      key: "progress",
      title:
        "Progress made to date (only counts documents saved by the minimum number of annotators)",
      display: true,
    },
    {
      name: "Agreement",
      icon: <GiProgression />,
      content: null,
      key: "averageIAA",
      title: "Average overall inter-annotator agreement",
      display: true,
    },
    {
      name: "Entities",
      icon: <IoGitCommit />,
      content: null,
      key: "entities",
      title:
        "Count of agreed upon entities (silver and weak) created by annotators",
      display: true,
    },
    {
      name: "Triples",
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
  const [key, setKey] = useState("overall");
  const [graphLoaded, setGraphLoaded] = useState(false);

  useEffect(() => {
    const fetchMeasures = async () => {
      if (project._id && !metricsLoaded) {
        const response = await axios.get(
          `/api/project/dashboard/overview/${project._id}`
        );
        if (response.status === 200) {
          const data = response.data[0]; // Comes back as [<Object>]
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
                // m.key === "progress"
                //   ? `${Math.round(data[m.key])}%`
                //   : m.key === "averageIAA" &&
                //     !project.tasks.relationAnnotation
                //   ? `${data[m.key].entity}%`
                //   : m.key === "averageIAA" &&
                //     project.tasks.relationAnnotation
                //   ? data[m.key].overall === null
                //     ? "-"
                //     : `${data[m.key].overall}%`
                //   : data[m.key],
              };
            })
          );
          setMetricsLoaded(true);
        }
      }
    };
    fetchMeasures();
  }, [project, metricsLoaded]);

  return (
    <Container fluid style={{}}>
      <Row>
        <Col md={9}>
          <Card>
            <Card.Body style={{ borderBottom: "1px solid rgba(0,0,0,.125)" }}>
              <Nav className="justify-content-center">
                {measures
                  .filter((m) => !m.disabled)
                  .map((m) => (
                    <Nav.Item>
                      <Nav.Link
                        style={{
                          fontSize: "12px",
                          fontWeight: key === m.name ? "bolder" : "bold",
                          borderBottom:
                            key === m.name && "2px solid rgba(0,0,0,.25)",
                          padding: "8px 16px",
                        }}
                        title={m.description}
                        onClick={() => {
                          setKey(m.name);
                          setGraphLoaded(false);
                        }}
                      >
                        <span>
                          <span>{m.icon}</span>
                          <span>{m.title}</span>
                        </span>
                      </Nav.Link>
                    </Nav.Item>
                  ))}
              </Nav>
            </Card.Body>
            <Card.Body>
              <Labels
                projectId={project._id}
                type={key}
                graphLoaded={graphLoaded}
                setGraphLoaded={setGraphLoaded}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card>
            <Card.Body
              style={{
                margin: "1rem 0rem",
                borderBottom: "1px solid rgba(0,0,0,.125)",
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Nav>
                <Nav.Item style={{ padding: "0px 16px", fontWeight: "bold" }}>
                  Metrics
                </Nav.Item>
              </Nav>
            </Card.Body>
            <Card.Body>
              {!metricsLoaded ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <p>Loading...</p>
                  <Spinner animation="border" />
                </div>
              ) : (
                metrics
                  .filter((m) => m.display)
                  .map((m) => (
                    <div id="overview-metrics-container" title={m.title}>
                      <span id="overview-metrics-value">
                        {m.content === null ? "-" : m.content}
                      </span>
                      <span id="overview-metrics-name">{m.name}</span>
                    </div>
                  ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
