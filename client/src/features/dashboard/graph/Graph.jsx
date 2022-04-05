import { useEffect, useRef, useLayoutEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { IoArrowBack } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Filters } from "./features/Filters";
import { KnowledgeGraph } from "./features/KnowledgeGraph";
import { Overview } from "./features/Overview";
import { Text } from "./features/Text";
import "./Graph.css";
import {
  fetchGraph,
  selectGraphData,
  selectGraphStatus,
} from "./graphSlice";

export const CustomGraph = () => {
  const dispatch = useDispatch();
  const { projectId } = useParams();
  const graphStatus = useSelector(selectGraphStatus);
  const graphData = useSelector(selectGraphData);

  const targetRef = useRef();
  const [dimensions, setDimensions] = useState(null);

  useLayoutEffect(() => {
    if (targetRef.current) {
      setDimensions({
        width: targetRef.current.offsetWidth,
        height: targetRef.current.offsetHeight,
      });
    }
  }, []);

  useEffect(() => {
    if (graphStatus === "idle") {
      dispatch(
        fetchGraph({
          projectId: projectId,
        })
      );
    }
  }, [graphStatus]);

  return (
    <>
      <Row>
        <Col sm={3} md={3}>
          <Overview />
        </Col>
        <Col sm={9} md={9}>
          <Text />
        </Col>
      </Row>
      <Row>
        <Col xs={4} sm={4} md={4} lg={3} xl={3} xxl={3}>
          <Filters />
        </Col>
        <Col ref={targetRef}>
          {graphStatus === "succeeded" &&
          graphData.nodes.length > 0 &&
          dimensions ? (
            <KnowledgeGraph projectId={projectId} dimensions={dimensions} />
          ) : (
            <div
              style={{
                height: dimensions ? dimensions.height : "500px",
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
                  <span>Click and apply class filters to visualise graph</span>
                </span>
              </span>
            </div>
          )}
        </Col>
      </Row>
    </>
  );
};
