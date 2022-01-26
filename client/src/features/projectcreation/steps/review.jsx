import { Badge, Col, Row } from "react-bootstrap";
import { useSelector } from "react-redux";
import { selectSteps } from "../createStepSlice";
import { IoWarning } from "react-icons/io5";

export const Review = () => {
  const steps = useSelector(selectSteps);

  const keyToNaturalMap = {
    lowercase: "Lower Case",
    removeDuplicates: "Remove Duplicates",
    removeChars: "Remove Special Characters",
  };

  return (
    <Col>
      <Row
        style={{
          borderBottom: "1px solid lightgrey",
          margin: "1rem 4rem",
          padding: "0.5rem 0rem",
        }}
      >
        <Col sm={12} md={4}>
          <p id="section-subtitle">Details</p>
        </Col>
        <Col sm={12} md={8}>
          <Row>
            <Badge style={{ backgroundColor: "#cfd8dc", margin: "0.125rem" }}>
              Name: {steps.details.data.name}
            </Badge>
            <Badge style={{ backgroundColor: "#cfd8dc", margin: "0.125rem" }}>
              Description: {steps.details.data.description}
            </Badge>
            <Badge style={{ backgroundColor: "#cfd8dc", margin: "0.125rem" }}>
              Task:{" "}
              {!steps.details.data.performRelationAnnotation
                ? "Entity Typing"
                : steps.details.data.relationAnnotationType === "closed"
                ? "Entity Typing and Closed Relation Extraction"
                : steps.details.data.relationAnnotationType === "open"
                ? "Entity Typing and Open Relation Extraction"
                : null}
            </Badge>
            <Badge
              variant={steps.details.data.performClustering && "success"}
              style={{
                margin: "0.125rem",
                backgroundColor:
                  !steps.details.data.performClustering && "#eceff1",
              }}
            >
              {steps.details.data.performClustering
                ? "Perfoming Clustering"
                : "No Clustering"}
            </Badge>
          </Row>
        </Col>
      </Row>
      <Row
        style={{
          borderBottom: "1px solid lightgrey",
          margin: "1rem 4rem",
          padding: "0.5rem 0rem",
        }}
      >
        <Col sm={12} md={4}>
          <p id="section-subtitle">Uploads</p>
        </Col>

        <Col sm={12} md={8}>
          <Row>
            <Badge style={{ backgroundColor: "#cfd8dc", margin: "0.125rem" }}>
              {steps.upload.data.corpus.length} Documents
            </Badge>
          </Row>
        </Col>
      </Row>
      <Row
        style={{
          borderBottom: "1px solid lightgrey",
          margin: "1rem 4rem",
          padding: "0.5rem 0rem",
        }}
      >
        <Col sm={12} md={4}>
          <p id="section-subtitle">Preprocessing</p>
        </Col>

        <Col sm={12} md={8}>
          <Row>
            {Object.keys(steps.preprocessing.data).filter(
              (action) =>
                steps.preprocessing.data[action] && action !== "removeCharSet"
            ).length === 0 ? (
              <Badge style={{ backgroundColor: "#eceff1", margin: "0.125rem" }}>
                No Actions Applied
              </Badge>
            ) : (
              Object.keys(steps.preprocessing.data)
                .filter((action) => steps.preprocessing.data[action])
                .map((action) => {
                  return (
                    <Badge
                      style={{
                        backgroundColor: "#cfd8dc",
                        margin: "0.125rem",
                      }}
                    >
                      {keyToNaturalMap[action]}
                    </Badge>
                  );
                })
            )}
          </Row>
        </Col>
      </Row>
      <Row
        style={{
          borderBottom: "1px solid lightgrey",
          margin: "1rem 4rem",
          padding: "0.5rem 0rem",
        }}
      >
        <Col sm={12} md={4}>
          <p id="section-subtitle">Ontologies</p>
        </Col>

        <Col sm={12} md={8}>
          <Row>
            {Object.values(steps.schema.data.conceptLabels).length <= 6 ? (
              Object.values(steps.schema.data.conceptLabels).map((label) => {
                return (
                  <Badge
                    style={{
                      backgroundColor: "#cfd8dc",
                      margin: "0.125rem",
                    }}
                  >
                    e: {label.name}
                  </Badge>
                );
              })
            ) : (
              <Badge
                style={{
                  backgroundColor: "#cfd8dc",
                  margin: "0.125rem",
                }}
              >
                {Object.values(steps.schema.data.conceptLabels).length} entity
                types created
              </Badge>
            )}

            {!steps.details.data.performRelationAnnotation ? (
              <></>
            ) : Object.values(steps.schema.data.relationLabels).length <= 6 ? (
              Object.values(steps.schema.data.relationLabels).map((label) => {
                return (
                  <Badge
                    style={{
                      backgroundColor: "#cfd8dc",
                      margin: "0.125rem",
                    }}
                  >
                    r: {label.name}
                  </Badge>
                );
              })
            ) : (
              <Badge
                style={{
                  backgroundColor: "#cfd8dc",
                  margin: "0.125rem",
                }}
              >
                {Object.values(steps.schema.data.relationLabels).length}{" "}
                relation types created
              </Badge>
            )}
          </Row>
        </Col>
      </Row>
      <Row
        style={{
          borderBottom: "1px solid lightgrey",
          margin: "1rem 4rem",
          padding: "0.5rem 0rem",
        }}
      >
        <Col sm={12} md={4}>
          <p id="section-subtitle">Pre-annotation</p>
        </Col>

        <Col sm={12} md={8}>
          <Row>
            {Object.keys(steps.preannotation.data.entityDictionary).length === 0 ? (
              <Badge style={{ backgroundColor: "#eceff1", margin: "0.125rem" }}>
                No entity pre-annotation performed
              </Badge>
            ) : (
              <Badge
                style={{
                  backgroundColor: "#cfd8dc",
                  margin: "0.125rem",
                }}
              >
                Entity Pairs Uploaded:{" "}
                {Object.keys(steps.preannotation.data.entityDictionary).length}
              </Badge>
            )}
            {steps.preannotation.data.typedTripleDictionary.length === 0 ? (
              <Badge style={{ backgroundColor: "#eceff1", margin: "0.125rem" }}>
                No typed triple pre-annotation performed
              </Badge>
            ) : (
              <Badge
                style={{
                  backgroundColor: "#cfd8dc",
                  margin: "0.125rem",
                }}
              >
                Typed Triple Sets Uploaded:{" "}
                {steps.preannotation.data.typedTripleDictionary.length}
              </Badge>
            )}
          </Row>
        </Col>
      </Row>
      <Row>
        <Col>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.75rem",
              fontStyle: "italic",
            }}
          >
            <IoWarning style={{ fontSize: "1.25rem", color: "orange" }} />{" "}
            Project creation may take a few minutes if your corpus is large and
            you are performing semantic clustering
          </p>
        </Col>
      </Row>
    </Col>
  );
};
