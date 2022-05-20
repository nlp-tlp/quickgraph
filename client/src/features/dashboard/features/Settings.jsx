import { useState } from "react";
import { Col, Row, Form, Spinner } from "react-bootstrap";
import { IoCheckmarkCircleSharp, IoCloseCircle } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  selectProject,
  setActiveModal,
  patchProjectDetails,
} from "../../project/projectSlice";
import "./../Dashboard.css";

import { Grid, Card, CardContent, TextField, Button } from "@mui/material";
import { grey, red, teal } from "@mui/material/colors";
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

  const handleUpdate = () => {
    if (description !== project.description) {
      dispatch(
        patchProjectDetails({
          projectId: project._id,
          field: "description",
          value: description,
        })
      );
    }

    if (name !== project.name) {
      dispatch(
        patchProjectDetails({
          projectId: project._id,
          field: "name",
          value: name,
        })
      );
    }
  };

  return (
    <Grid item container spacing={2}>
      <Grid item xs={6}>
        <Card variant="outlined">
          <CardContent>
            <Grid item container>
              <Grid item xs={12}>
                <h5>Project Details</h5>
                <span style={{ fontSize: "0.75rem", color: grey[700] }}>
                  Review or update this projects details
                </span>
              </Grid>
              <Grid item xs={12} sx={{ mt: 4 }}>
                <TextField
                  required
                  id="project-name-text-field"
                  label="Project Name"
                  placeholder={project.name}
                  variant="standard"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  multiline
                />
              </Grid>
            </Grid>
            <Grid item xs={12} sx={{ mt: 4 }}>
              <TextField
                required
                id="project-description-text-field"
                label="Project Description"
                placeholder={project.description}
                variant="standard"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoComplete="off"
                multiline
              />
            </Grid>
            <Grid
              item
              container
              xs={12}
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 4 }}
            >
              <span style={{ fontSize: "0.75rem", color: grey[700] }}>
                Last updated: {new Date(project.updatedAt).toDateString()}
              </span>
              <Button
                variant="contained"
                disableElevation
                onClick={handleUpdate}
                disabled={
                  project.description === description && project.name === name
                }
              >
                Update
              </Button>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={6}>
        <Card variant="outlined">
          <CardContent>
            <Grid item container>
              <Grid item xs={12}>
                <h5>Preprocessing Operations</h5>
                <span style={{ fontSize: "0.75rem", color: grey[700] }}>
                  Review the pre-processing operations applied to this projects
                  corpus
                </span>
              </Grid>
              {project &&
                Object.keys(project.preprocessing)
                  .filter((measure) => Object.keys(MAPPING).includes(measure))
                  .map((measure) => (
                    <Grid item xs={12} sx={{ mt: 4 }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {project.preprocessing[measure] ? (
                          <IoCheckmarkCircleSharp
                            style={{ color: teal[500] }}
                          />
                        ) : (
                          <IoCloseCircle style={{ color: red[500] }} />
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
                      </div>
                    </Grid>
                  ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* <Row style={{ marginTop: "1rem" }}>
        <Col>
          <Card>
            <CardContent style={{ borderBottom: "1px solid rgba(0,0,0,.125)" }}>
              <Card.Title>Ontologies</Card.Title>
              <Card.Subtitle
                style={{ fontSize: "0.8125rem", color: "#607d8b" }}
              >
                Review or modify this projects ontologies.
              </Card.Subtitle>
            </CardContent>
            <CardContent>
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
            </CardContent>
          </Card>
        </Col>
      </Row> */}
      <Grid item xs={12}>
        <Card variant="outlined" style={{ border: `1px solid ${red[500]}` }}>
          <CardContent>
            <Grid item container>
              <Grid item xs={12}>
                <h5 style={{ color: red[500] }}>Danger Zone</h5>
              </Grid>
              <Grid item container xs={12} sx={{ mt: 4 }}>
                <Grid item xs={6}>
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "bold" }}>
                      Delete this project
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: grey[700] }}>
                      Once you delete this project, there is no going back.{" "}
                      <strong>Please be certain.</strong>
                    </span>
                  </span>
                </Grid>
                <Grid
                  item
                  container
                  xs={6}
                  alignItems="center"
                  justifyContent="right"
                >
                  <Button
                    disableElevation
                    variant="contained"
                    color="error"
                    onClick={() => dispatch(setActiveModal("delete"))}
                  >
                    Delete this project
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
