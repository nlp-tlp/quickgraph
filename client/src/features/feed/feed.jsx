import React, { useEffect } from "react";
import { Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { MdDashboard, MdEdit } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { setProject } from "../project/projectSlice";
import history from "../utils/history";
import "./Feed.css";
import {
  fetchProjects,
  selectFeedStatus,
  selectFeedError,
  selectProjects,
} from "./feedSlice";

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

  return (
    <>
      <Container className="feed-container">
        {feedStatus !== "succeeded" ? (
          <div id="loader">
            <Spinner animation="border" />
            <p>Loading...</p>
          </div>
        ) : projects.length === 0 ? (
          <div id="create-project">
            <p>No projects</p>
            <Button variant="dark" size="lg" href="/project/new">
              Create Project
            </Button>
          </div>
        ) : (
          <ProjectList />
        )}
      </Container>
    </>
  );
};

const ProjectList = () => {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const feedStatus = useSelector(selectFeedStatus);

  const kFormatter = (num) => {
    return Math.abs(num) > 999
      ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "k"
      : Math.sign(num) * Math.abs(num);
  };

  const handleDashboard = (project) => {
    dispatch(setProject(project));
    history.push(`/dashboard/${project._id}/overview`);
  };

  return (
    <>
      <Container fluid className="project-list-container">
        {feedStatus === "succeeded" ? (
          projects.map((project, index) => {
            return (
              <>
                <Row className="feed-item">
                  <Col key={index}>
                    <Row>
                      <Col
                        sm={12}
                        md={12}
                        lg={4}
                        className="details-col"
                        key={index}
                      >
                        <Row>
                          <Col>
                            <h1 id="project-name">{project.name}</h1>
                          </Col>
                        </Row>
                        <Row>
                          <Col>
                            <p id="project-description">
                              {project.description}
                            </p>
                          </Col>
                        </Row>
                        <Row>
                          <Col>
                            <p id="project-creation-date">
                              {new Date(project.createdAt).toDateString()}
                            </p>
                          </Col>
                        </Row>
                      </Col>

                      <Col
                        sm={12}
                        md={12}
                        lg={6}
                        className="metrics-col"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <Row>
                          <Col>
                            <div id="metrics-text-container">
                              <div>
                                <p id="metric-number">
                                  {kFormatter(project.savedTexts)}/
                                  {kFormatter(project.totalTexts)}
                                </p>
                                <p id="metric-title">Documents<br/>Annotated</p>
                              </div>
                            </div>
                          </Col>
                          <Col>
                            <div id="metrics-text-container">
                              <div>
                                <p id="metric-number">
                                  {project.annotatorCount}
                                </p>
                                <p id="metric-title">Active<br/>Annotators</p>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Col>
                      <Col
                        sm={12}
                        md={12}
                        lg={2}
                        className="actions-col"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <div id="action-container">
                          <MdEdit
                            id="action-icon"
                            title="Click to commence annotation"
                            onClick={() =>
                              history.push(`/annotation/${project._id}/page=1`)
                            }
                          />
                          <MdDashboard
                            id="action-icon"
                            title="Click to go to dashboard"
                            onClick={() => handleDashboard(project)}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </>
            );
          })
        ) : (
          <div>
            <Spinner animation="border" variant="secondary" size="sm" />
          </div>
        )}
      </Container>
    </>
  );
};
