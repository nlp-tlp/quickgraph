import React, { useState, useEffect } from "react";
import axios from "../utils/api-interceptor";
import {
  Form,
  Tab,
  Row,
  Col,
  ListGroup,
  Button,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { MdFileDownload, MdLibraryBooks } from "react-icons/md";
import "./Modals.css";

import { useSelector } from "react-redux";
import { selectProject, selectModalInfo } from "../project/projectSlice";

export const Download = ({ projectId, projectName }) => {
  const modalInfo = useSelector(selectModalInfo);
  const [filter, setFilter] = useState({
    saved: "all",
    include_weak_entities: "yes",
  });

  // useEffect(() => {
  //   console.log(filter);
  // });

  const handleDownload = async () => {
    const response = await axios.post("/api/project/dashboard/download", {
      user_id: modalInfo.userId,
      project_id: projectId,
      download_type: modalInfo.downloadType,
      aggregate: modalInfo.aggregate,
      filter: filter,
    });
    if (response.status === 200) {
      // Prepare for file download
      // console.log(response.data);

      // const fileName = `${projectName}_annotations`;
      // const json = JSON.stringify(resultRes.data.results, null, 4);
      // const blob = new Blob([json], { type: "application/json" });
      // const href = await URL.createObjectURL(blob);
      // const link = document.createElement("a");
      // link.href = href;
      // link.download = fileName + ".json";
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
    }
  };

  let formFilters;
  switch (modalInfo.downloadType) {
    case "triples":
      formFilters = (
        <>
          <Col xs="auto" className="my-1">
            <Form.Check
              type="checkbox"
              id="autoSizingCheck2"
              label="Saved Triples Only"
              checked={filter.saved === "yes"}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  saved: filter.saved === "all" ? "yes" : "all",
                })
              }
            />
          </Col>
        </>
      );

      break;
    case "entities":
      formFilters = (
        <>
          <Col>
            <Form.Check
              type="checkbox"
              id="autoSizingCheck2"
              label="Saved Entities Only"
              checked={filter.saved === "yes"}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  saved: filter.saved === "all" ? "yes" : "all",
                })
              }
            />
            <Form.Check
              type="checkbox"
              id="autoSizingCheck2"
              label="Include Weak Entities"
              checked={filter.include_weak_entities === "yes"}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  saved: filter.include_weak_entities === "no" ? "yes" : "no",
                })
              }
            />
          </Col>
        </>
      );
      break;

    default:
      break;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Form>
        <p style={{ fontWeight: "bold", textAlign: "center" }}>Options</p>
        <Row>{formFilters}</Row>
      </Form>
      <Row style={{ marginTop: "1rem" }}>
        <Col>
          <Button
            type="submit"
            size="sm"
            variant="success"
            onClick={handleDownload}
          >
            Download {modalInfo.downloadType}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export const Downloads1 = ({ projectId, projectName }) => {
  const project = useSelector(selectProject); // Will fail if accessed via Feed; TODO: FIX
  const labels = project.labels;

  const [includeWeakLabels, setIncludeWeakLabels] = useState(false); // true/false

  const [resultAnnotationState, setResultAnnotationState] = useState("all"); // all/annotated/unannotated

  const [previewContent, setPreviewContent] = useState("");
  // const [annotated, setAnnotated] = useState(false);
  const [resultCount, setResultCount] = useState();

  // useEffect(() => {
  //   console.log(includeWeakLabels);
  // }, [includeWeakLabels]);

  const downloadResults = async (project) => {
    // Fetch results
    const resultRes = await axios.post("/api/project/download/result", {
      project_id: projectId,
      include_weak_labels: includeWeakLabels,
      annotated: false, //annotated,
    });
    if (resultRes.status === 200) {
      // Prepare for file download
      const fileName = `${projectName}_annotations`;
      const json = JSON.stringify(resultRes.data.results, null, 4);
      const blob = new Blob([json], { type: "application/json" });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName + ".json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const previewResults = async () => {
    const response = await axios.post("/api/project/download/result", {
      project_id: projectId,
      preview: true,
      include_weak_labels: includeWeakLabels,
      annotation_state: resultAnnotationState, // TODO: make button based
    });
    if (response.status === 200) {
      setPreviewContent(JSON.stringify(response.data.results, null, 4));
      setResultCount(response.data.count);
    }
  };

  const previewLabel = async (labelName) => {
    const response = await axios.post(
      `/api/project/download/labels/${labelName}`,
      {
        project_id: projectId,
        preview: true,
        include_weak_labels: includeWeakLabels,
        annotation_state: "all", // TODO: make button based
      }
    );
    if (response.status === 200) {
      // Format JSON
      if (Object.keys(response.data).length === 0) {
        setPreviewContent("No labels applied");
      } else {
        setPreviewContent(JSON.stringify(response.data, null, 2));
      }
    }
  };

  const downloadLabels = async (labelName) => {
    const response = await axios.post(
      `/api/project/download/labels/${labelName}`,
      {
        project_id: projectId,
        preview: false,
        include_weak_labels: includeWeakLabels,
        annotation_state: "all", // TODO: make button based
      }
    );

    if (response.status === 200) {
      // Prepare for file download
      const fileName = `${projectName}-labels_${labelName.toLowerCase()}`;
      const json = JSON.stringify(response.data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName + ".json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resultTypeCheckBoxes = (header, resources, item) => {
    // Input arguments are used to help control the re-render of the preview
    // as this component is used for both results and labels.
    return (
      <div className="download" id="checkbox-container">
        <Form.Check
          inline
          type="checkbox"
          label="Include weak labels"
          className="download"
          id="checkbox"
          checked={includeWeakLabels}
          onChange={() => {
            setIncludeWeakLabels(true);
            header === "results"
              ? previewResults()
              : previewLabel(resources[header][item].title);
          }}
        />
        <Form.Check
          inline
          className="download"
          id="checkbox"
          type="checkbox"
          label="Exclude weak labels"
          checked={!includeWeakLabels}
          onChange={() => {
            setIncludeWeakLabels(false);
            // previewResults();
            header === "results"
              ? previewResults()
              : previewLabel(resources[header][item].title);
          }}
        />
      </div>
    );
  };

  const downloadOptionsContainer = (
    <Form.Group>
      <Row>
        <Col>
          <Form.Check
            inline
            type="checkbox"
            label="Annotated Only"
            className="download"
            id="checkbox"
            // checked={annotated}
            // onChange={() => {
            //   setAnnotated(!annotated);
            //   previewResults();
            // }}
          />
        </Col>
        <Col>
          {/* <Form.Control
        as="select"
        multiple
        value={downloadSchema}
        onChange={(e) =>
          setDownloadSchema(
            [].slice.call(e.target.selectedOptions).map((item) => item.value)
          )
        }
      >
        {schema.map_keys
          .filter((key) => !DEFAULT_MAPS_EN.includes(key))
          .map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
      </Form.Control> */}
        </Col>
      </Row>
    </Form.Group>
  );

  const resources = {
    results: {
      annotations: {
        title: "Annotations",
        description:
          "Results of the information extraction project in json format. Each entity mention will indicate its type as either silver (accepted) or weak (active suggestion).",
        colour: "black",
        function: () => downloadResults(),
        preview: () => previewResults(),
      },
    },
    labels: labels
      ? Object.assign(
          {},
          ...labels.map((label, index) => ({
            [index]: {
              title: label.name,
              description:
                "Frequency of entity labels applied throughout the project. This is downloadable in json format.",
              colour: label.colour,
              function: () => downloadLabels(label.name),
              preview: () => previewLabel(label.name),
            },
          }))
        )
      : {},
  };

  return (
    <div className="download">
      <p id="main-description">
        <strong>Info:</strong> Results and resources obtained through the
        project. Select any of the tabs on the right hand side to preview the
        results and resources before downloading.
      </p>

      <Tab.Container id="results-resources-group">
        <Row>
          <Col sm={5}>
            <ListGroup>
              {Object.keys(resources).map((header) => {
                return (
                  <>
                    <ListGroup.Item
                      // variant="secondary"
                      className="list-header"
                      style={{ textTransform: "capitalize" }}
                    >
                      {header}
                    </ListGroup.Item>
                    {Object.keys(resources[header]).map((item) => {
                      return (
                        <ListGroup.Item
                          action
                          className="list-item"
                          href={`#${resources[header][item].title}`}
                          style={{
                            color: resources[header][item].colour,
                            fontWeight: "bold",
                            textTransform: "capitalize",
                          }}
                          onClick={resources[header][item].preview}
                        >
                          {resources[header][item].title}
                        </ListGroup.Item>
                      );
                    })}
                  </>
                );
              })}
            </ListGroup>
          </Col>
          <Col sm={7}>
            <Tab.Content>
              {Object.keys(resources).map((header) => {
                return Object.keys(resources[header]).map((item) => {
                  return (
                    <Tab.Pane eventKey={`#${resources[header][item].title}`}>
                      <div style={{ display: "flex", width: "100%" }}>
                        <p style={{ fontSize: "1em", fontWeight: "bold" }}>
                          Details
                        </p>
                      </div>
                      <p>{resources[header][item].description}</p>
                      <p style={{ fontSize: "1em", fontWeight: "bold" }}>
                        Filter
                      </p>
                      <p>{resultTypeCheckBoxes(header, resources, item)}</p>
                      <p style={{ fontSize: "1em", fontWeight: "bold" }}>
                        Preview
                      </p>
                      <div
                        style={{
                          backgroundColor: "rgba(0,0,0,0.025)",
                          padding: "0.5em",
                          overflowY: "scroll",
                          maxHeight: "50vh",
                          height: "40vh",
                        }}
                      >
                        <pre>{previewContent}</pre>
                      </div>
                      {item === "annotations" ? (
                        <>
                          {/* <p
                            style={{
                              marginTop: "0.5em",
                              fontSize: "1em",
                              fontWeight: "bold",
                              cursor: "pointer",
                              color: "black",
                            }}
                          >
                            Download Options
                          </p>
                          {downloadOptionsContainer} */}
                          <Button
                            variant="dark"
                            size="sm"
                            style={{
                              marginTop: "1em",
                            }}
                            onClick={resources[header][item].function}
                          >
                            <MdFileDownload
                              style={{
                                fontSize: "22px",
                                margin: "auto",
                              }}
                            />
                            Download ({resultCount})
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="dark"
                          size="sm"
                          style={{
                            marginTop: "1em",
                          }}
                          onClick={resources[header][item].function}
                        >
                          <MdFileDownload
                            style={{
                              fontSize: "22px",
                              margin: "auto",
                            }}
                          />
                          Download
                        </Button>
                      )}
                    </Tab.Pane>
                  );
                });
              })}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </div>
  );
};
