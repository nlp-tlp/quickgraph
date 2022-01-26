import "../Create.css";
import { useEffect } from "react";
import { Card, Col, Form, Row, OverlayTrigger, Tooltip } from "react-bootstrap";
import { IoInformationCircle, IoWarning } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveStep,
  selectSteps,
  setStepData,
  setStepValid,
} from "../createStepSlice";

const information = [
  {
    title: "Details",
    content: "Enter project details including task type and clustering",
  },
  {
    title: "Upload",
    content: "Create or upload a corpus",
  },
  {
    title: "Preprocessing",
    content: "Apply text preprocessing to your corpus",
  },
  {
    title: "Schema",
    content: "Build a schema of concepts/labels for annotation",
  },
  {
    title: "Preannotation",
    content: "Upload data for pre-annotation",
  },
  {
    title: "Review",
    content: "Review project before commencing annotation",
  },
];

export const Details = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);

  useEffect(() => {
    const valid = steps[activeStep].valid;
    const data = steps[activeStep].data;

    if (!valid && data.name !== "" && data.description !== "") {
      dispatch(setStepValid(true));
    }
    if (valid && (data.name === "" || data.description === "")) {
      dispatch(setStepValid(false));
    }
  }, [steps]);

  return (
    <Row id="details">
      <Col>
        <Row>
          <Col sm={12} md={6}>
            <Card>
              <Card.Header id="section-subtitle">
                <IoInformationCircle /> Information
              </Card.Header>
              <Card.Body className="create-details-card-body">
                The project creation process involves:
                {information.map((info, index) => (
                  <p style={{ padding: "0", margin: "0" }}>
                    <span>
                      <strong>
                        {index + 1}. {info.title}
                      </strong>
                    </span>
                    <br />
                    <span>{info.content}</span>
                  </p>
                ))}
              </Card.Body>
            </Card>
          </Col>
          <Col sm={12} md={6}>
            <Card>
              <Card.Header id="section-subtitle">Details</Card.Header>
              <Card.Body className="create-details-card-body">
                <Row>
                  <Col>
                    <Form.Group>
                      <p id="section-subtitle">Name</p>
                      <Form.Control
                        type="text"
                        placeholder="Enter project name"
                        name="projectName"
                        value={steps[activeStep].data.name}
                        onChange={(e) =>
                          dispatch(setStepData({ name: e.target.value }))
                        }
                        autoComplete="off"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Group>
                      <p id="section-subtitle">Description</p>
                      <Form.Control
                        type="text"
                        placeholder="Enter project description"
                        name="projectDescription"
                        value={steps[activeStep].data.description}
                        onChange={(e) =>
                          dispatch(setStepData({ description: e.target.value }))
                        }
                        autoComplete="off"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Group>
                      <p id="section-subtitle">Multi-task Options</p>
                      <Form.Check
                        id="radio-et-cre"
                        type="radio"
                        label="Entity and Closed Relation Annotation"
                        name="relationAnnotationGroup"
                        title="Enables project annotators to perform entity and closed relation annotation."
                        style={{ fontSize: "14px", marginBottom: "0.5rem" }}
                        checked={
                          steps[activeStep].data.performRelationAnnotation &&
                          steps[activeStep].data.relationAnnotationType ===
                            "closed"
                        }
                        onChange={(e) => {
                          dispatch(
                            setStepData({
                              performRelationAnnotation: true,
                              relationAnnotationType: "closed",
                            })
                          );
                        }}
                      />

                      <Form.Check
                        id="radio-et-ore"
                        type="radio"
                        label="Entity and Open Relation Annotation"
                        name="relationAnnotationGroup"
                        title="Enables project annotators to perform entity and open relation annotation"
                        style={{ fontSize: "14px", marginBottom: "0.5rem" }}
                        checked={
                          steps[activeStep].data.performRelationAnnotation &&
                          steps[activeStep].data.relationAnnotationType ===
                            "open"
                        }
                        onChange={(e) => {
                          dispatch(
                            setStepData({
                              performRelationAnnotation: true,
                              relationAnnotationType: "open",
                            })
                          );
                        }}
                      />
                      <Form.Check
                        id="radio-et-nre"
                        type="radio"
                        label="Entity Annotation Only"
                        name="relationAnnotationGroup"
                        title="Disables project annotators from performing relation annotation"
                        style={{
                          fontSize: "14px",
                          marginBottom: "0.5rem",
                        }}
                        checked={
                          !steps[activeStep].data.performRelationAnnotation
                        }
                        onChange={(e) => {
                          dispatch(
                            setStepData({
                              performRelationAnnotation: false,
                            })
                          );
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Group>
                      <p id="section-subtitle">
                        Document Clustering
                        <OverlayTrigger
                          // placement="top"
                          overlay={
                            <Tooltip id="cluster-tooltip-info">
                              For large-scale corpora, the clustering process
                              may take a few minutes.
                            </Tooltip>
                          }
                        >
                          <IoWarning
                            style={{
                              marginLeft: "0.25rem",
                              color: "orange",
                              cursor: "help",
                            }}
                          />
                        </OverlayTrigger>
                      </p>
                      <Form.Check
                        id="check-clustering"
                        type="checkbox"
                        label="Perform Rank Order Clustering"
                        name="performClustering"
                        title="Performs agglomerative clustering using sentence embeddings (SBERT) to enhance annotation rate and consistency."
                        style={{
                          fontSize: "14px",
                          marginBottom: "0.5rem",
                        }}
                        checked={steps[activeStep].data.performClustering}
                        onChange={(e) => {
                          dispatch(
                            setStepData({
                              performClustering:
                                !steps[activeStep].data.performClustering,
                            })
                          );
                        }}
                      />
                    </Form.Group>
                    {/* {actions.cluster && (
                <>
                  <Form.Group>
                    <Form.Label>Clustering Method</Form.Label>
                    <Form as="select">
                      <option id="1">
                        Sentence Embeddings (SBERT) + Agglomerative Clustering
                      </option>
                      <option id="2">Latent Dirichlet Allocation (LDA)</option>
                    </Form>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Parameters</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Clusters"
                      name="projectName"
                      // value={steps[activeStep].data.name}
                      // onChange={(e) =>
                      //   dispatch(setStepData({ name: e.target.value }))
                      // }
                      autoComplete="off"
                    />
                  </Form.Group>
                </>
              )} */}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};
