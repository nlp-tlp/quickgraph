import { useState } from "react";
import { Button, Col, Row, Form, Card, Spinner } from "react-bootstrap";
import { IoCheckmarkCircleSharp, IoCloseCircle } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  selectProject,
  setActiveModal,
  patchProjectDetails,
} from "../../project/projectSlice";
import "./../Dashboard.css";

/* 
  Component for project settings
*/
export const Settings = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [changeLoading, setChangeLoading] = useState(false);

  const MAPPING = {
    lowerCase: "Lower cased",
    removeDuplicates: "Duplicate documents removed",
    charsRemoved: "Characters removed from corpus",
  };

  const handleDetailUpdate = (field, value) => {
    dispatch(
      patchProjectDetails({
        projectId: project._id,
        field: field,
        value: value,
      })
    );
  };

  return (
    <>
      <Row>
        <Col>
          <Card>
            <Card.Body style={{ borderBottom: "1px solid rgba(0,0,0,.125)" }}>
              <Card.Title>Preprocessing Operations</Card.Title>
              <Card.Subtitle
                style={{ fontSize: "0.8125rem", color: "#607d8b" }}
              >
                Review the pre-processing operations applied to this projects
                corpus.
              </Card.Subtitle>
            </Card.Body>
            <Card.Body>
              {project &&
                Object.keys(project.preprocessing)
                  .filter((measure) => Object.keys(MAPPING).includes(measure))
                  .map((measure) => (
                    <span
                      style={{
                        display: "flex",
                        padding: "0.25rem 0rem",
                        alignItems: "center",
                      }}
                    >
                      {project.preprocessing[measure] ? (
                        <IoCheckmarkCircleSharp style={{ color: "#1b5e20" }} />
                      ) : (
                        <IoCloseCircle style={{ color: "#f44336" }} />
                      )}
                      <p
                        style={{
                          margin: "0rem 0.25rem",
                          alignItems: "center",
                          padding: "0",
                        }}
                      >
                        {MAPPING[measure]}
                        {measure === "charsRemoved" &&
                          " (" + project.preprocessing["charset"] + ")"}
                      </p>
                    </span>
                  ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: "1rem" }}>
        <Col>
          <Card>
            <Card.Body style={{ borderBottom: "1px solid rgba(0,0,0,.125)" }}>
              <Card.Title>Project Details</Card.Title>
              <Card.Subtitle
                style={{ fontSize: "0.8125rem", color: "#607d8b" }}
              >
                Review or update this projects details.
              </Card.Subtitle>
            </Card.Body>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Label
                    style={{ fontWeight: "bold" }}
                    htmlFor="projectNameForm"
                  >
                    Project Name
                  </Form.Label>
                </Col>
                <Col md={6}>
                  <Form.Control
                    type="text"
                    size="sm"
                    id="projectNameForm"
                    placeholder={project.name}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Col>
                <Col
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "right",
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDetailUpdate("name", name)}
                    disabled={project.name === name}
                  >
                    {/* {!changeLoading ? (
                      <span style={{display: 'flex'}}>
                        <Spinner animation="border" size="sm" />
                      </span>
                    ) : (
                      "Update"
                    
                    )} */}
                    Update
                  </Button>
                </Col>
              </Row>
              <Row style={{ marginTop: "1rem" }}>
                <Col md={4}>
                  <Form.Label
                    style={{ fontWeight: "bold" }}
                    htmlFor="projectDescription"
                  >
                    Project Description
                  </Form.Label>
                </Col>
                <Col md={6}>
                  <Form.Control
                    size="sm"
                    type="text"
                    id="projectDescription"
                    placeholder={project.description}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Col>
                <Col
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "right",
                  }}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      handleDetailUpdate("description", description)
                    }
                    disabled={project.description === description}
                  >
                    Update
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: "1rem" }}>
        <Col>
          <Card>
            <Card.Body style={{ borderBottom: "1px solid rgba(0,0,0,.125)" }}>
              <Card.Title>Ontologies</Card.Title>
              <Card.Subtitle
                style={{ fontSize: "0.8125rem", color: "#607d8b" }}
              >
                Review or modify this projects ontologies.
              </Card.Subtitle>
            </Card.Body>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "bold" }}>
                      Update entity ontology
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: "#607d8b" }}>
                      Click to add, remove or modify the existing entity
                      ontology.
                    </span>
                  </span>
                </Col>
                <Col
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "right",
                  }}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    // onClick={() => modalHandler(project, "delete")}
                  >
                    Update entities
                  </Button>
                </Col>
              </Row>
              {project && project.tasks.relationAnnotation && (
                <Row style={{ marginTop: "1rem" }}>
                  <Col md={8}>
                    <span style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: "bold" }}>
                        Update relation ontology
                      </span>
                      <span style={{ fontSize: "0.8125rem", color: "#607d8b" }}>
                        Click to add, remove or modify the existing relation
                        ontology.
                      </span>
                    </span>
                  </Col>
                  <Col
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "right",
                    }}
                  >
                    <Button variant="secondary" size="sm">
                      Update relations
                    </Button>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: "1rem" }}>
        <Col>
          <Card style={{ border: "1px solid #dc3545" }}>
            <Card.Body style={{ borderBottom: "1px solid #dc3545" }}>
              <Card.Title style={{ margin: 0, padding: 0, color: "#dc3545" }}>
                Danger Zone
              </Card.Title>
            </Card.Body>
            <Card.Body>
              <Row>
                <Col>
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "bold" }}>
                      Delete this project
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: "black" }}>
                      Once you delete this project, there is no going back.{" "}
                      <strong>Please be certain.</strong>
                    </span>
                  </span>
                </Col>
                <Col
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "right",
                  }}
                >
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => dispatch(setActiveModal("delete"))}
                  >
                    Delete this project
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};
