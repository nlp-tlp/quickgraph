import "./Graph.css";
import { useEffect, useState } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import "react-complex-tree/lib/style.css";
import { IoArrowBack } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { KnowledgeGraph } from "./features/KnowledgeGraph";
import { Legend } from "./features/Legend";
import { Overview } from "./features/Overview";
import { Text } from "./features/Text";
import { Filters } from "./features/Filters";

import {
  selectGraphData,
  selectGraphMetrics,
  selectGraphStatus,
  fetchGraph,
  resetGraph,
  setSelectedNode,
  selectSelectedNode,
  selectAggregate,
} from "./graphSlice";
import { useDispatch, useSelector } from "react-redux";

export const CustomGraph = () => {
  const dispatch = useDispatch();
  const { projectId } = useParams();
  const aggregate = useSelector(selectAggregate);
  const graphStatus = useSelector(selectGraphStatus);
  const graphData = useSelector(selectGraphData);
  const graphMetrics = useSelector(selectGraphMetrics);
  const selectedNode = useSelector(selectSelectedNode);

  useEffect(() => {
    if (graphStatus === "idle") {
      dispatch(
        fetchGraph({
          projectId: projectId,
        })
      );
    }
  }, [graphStatus]);

  if (graphStatus === "loading") {
    return (
      <div>
        <Spinner animation="border" />
        Loading graph...
      </div>
    );
  } else {
    return (
      <>
        <Row>
          <Col
            xs={4}
            sm={4}
            md={4}
            lg={3}
            xl={3}
            xxl={3}
            style={{ maxWidth: "300px !important" }}
          >
            <Overview />
            {/* <Filters /> */}
            {/* <Legend /> */}
          </Col>
          <Col>
            <Row>
              <Col>
                {graphStatus === "succeeded" && graphData.nodes.length > 0 ? (
                  <KnowledgeGraph projectId={projectId} />
                ) : (
                  <div
                    style={{
                      height: "500px",
                      border: "1px solid rgba(0,0,0,.125)",
                      borderRadius: ".25rem",
                      textAlign: "center",
                      color: "#607d8b",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: "bold",
                          padding: "0",
                          margin: "0",
                        }}
                      >
                        Graph not loaded
                      </span>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <IoArrowBack
                          style={{ fontSize: "1rem", textAlign: "center" }}
                        />
                        <span>
                          Click and apply class filters to visualise graph
                        </span>
                      </span>
                    </span>
                  </div>
                )}
              </Col>
            </Row>
            {!aggregate && (
              <Row>
                <Col>
                  <Text />
                </Col>
              </Row>
            )}
            <Row>
              <Col>
                <p style={{ fontSize: "0.6125rem", padding: "0", margin: "0" }}>
                  <strong>Information:</strong> The <strong>aggregate</strong>{" "}
                  knowledge graph only shows: documents meeting the required
                  minimum annotations, and accepted (silver) annotations. The
                  graph is limited to <strong>5000 nodes</strong> at once. The{" "}
                  <strong>separated</strong> graph is currently limited to your
                  own annotations.
                </p>
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  }
};
