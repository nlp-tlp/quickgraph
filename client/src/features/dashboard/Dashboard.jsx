import "./Dashboard.css";
import { useEffect, useState } from "react";
import history from "../utils/history";
import { Card, Col, Container, Nav, Row } from "react-bootstrap";
import { BiNetworkChart } from "react-icons/bi";
import { FaDownload, FaUsers } from "react-icons/fa";
import { IoBarChart, IoLayers, IoPulse, IoSettings } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { selectUserId } from "../auth/userSlice";
import { fetchProject, selectProject } from "../project/projectSlice";
import { Annotators } from "./features/Annotators";
import { Downloads } from "./features/Downloads";
import { CustomGraph } from "./graph/Graph";
import { Overview } from "./features/Overview";
import { Settings } from "./features/Settings";
import { Adjudicator } from "./features/Adjudicator";
import { Corrector } from "./features/Corrector";

export const Dashboard = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const projectStatus = useSelector((state) => state.project.status);
  const { projectId, viewKey } = useParams();
  const [key, setKey] = useState(viewKey); //  === "" ? "overview" : viewKey;
  const [components, setComponents] = useState();
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
          disabled: project && !project.tasks.relationAnnotation,
          show: true,
        },
        annotators: {
          icon: <FaUsers />,
          title: `Annotators (${
            project.annotators && project.annotators.length
          })`,
          description: "Manage project annotators",
          body: <Annotators />,
          disabled: false,
          show: userIsPM,
        },
        adjudicator: {
          icon: <IoLayers />,
          title: "Adjudicator",
          description: "hello world",
          body: <Adjudicator />,
          disabled: false,
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

  return (
    <Container fluid className="dashboard-container">
      <Row>
        <Col>
          <Card>
            {components && (
              <>
                <Card.Body
                  style={{
                    margin: 0,
                    borderBottom: "1px solid rgba(0,0,0,.125)",
                  }}
                >
                  <Nav
                    defaultActiveKey={key}
                    className="justify-content-center"
                    onSelect={(k) => setKey(k)}
                  >
                    {Object.keys(components)
                      .filter((c) => components[c].show)
                      .map((name) => (
                        <Nav.Item>
                          <Nav.Link
                            // href={`/dashboard/${project._id}/${name}`}
                            onClick={() => setKey(name)}
                            style={{
                              fontSize: "12px",
                              fontWeight: key === name ? "bolder" : "bold",
                              borderBottom:
                                key === name && "2px solid rgba(0,0,0,.25)",
                              padding: "8px 16px",
                            }}
                            eventKey={name}
                            disabled={components[name].disabled}
                          >
                            <span
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ marginRight: "0.25rem" }}>
                                {components[name].icon}
                              </span>
                              {components[name].title}
                            </span>
                          </Nav.Link>
                        </Nav.Item>
                      ))}
                  </Nav>
                </Card.Body>
                <Card.Body id="dashboard-content-container">
                  <Container fluid>
                    <Row>
                      <Col>
                        <div className="title">
                          {components[key].title}
                          <span id="underline" />
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col style={{ margin: "0.25rem" }}>
                        {components[key].body}
                      </Col>
                    </Row>
                  </Container>
                </Card.Body>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
