import { useEffect, useRef, useLayoutEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Filters } from "./features/Filters";
import { KnowledgeGraph } from "./features/KnowledgeGraph";
import { Overview } from "./features/Overview";
import "./Graph.css";
import {
  fetchGraph,
  selectGraphData,
  selectGraphStatus,
  selectGraphMetrics,
} from "./graphSlice";
import { Grid } from "@mui/material";

export const CustomGraph = () => {
  const dispatch = useDispatch();
  const { projectId } = useParams();
  const graphStatus = useSelector(selectGraphStatus);
  const graphData = useSelector(selectGraphData);
  const targetRef = useRef();
  const [dimensions, setDimensions] = useState(null);
  const [disabled, setDisabled] = useState(true);
  const metrics = useSelector(selectGraphMetrics);

  useLayoutEffect(() => {
    if (targetRef.current) {
      setTimeout(() => {
        setDimensions({
          width: targetRef.current.offsetWidth,
          height: targetRef.current.offsetHeight,
        });
      }, 500);
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

    if (graphStatus === "succeeded") {
      setDisabled(metrics.totalDocs === 0); // Disables filters etc if no documents returned.
    }
  }, [graphStatus]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={3} ref={targetRef}>
        <Grid item xs={12}>
          <Filters disabled={disabled} />
          <Overview />
        </Grid>
      </Grid>

      <Grid item xs={9}>
        {graphStatus === "succeeded" &&
        graphData.nodes.length > 0 &&
        dimensions ? (
          <KnowledgeGraph projectId={projectId} dimensions={dimensions} />
        ) : (
          <div
            style={{
              height: dimensions ? dimensions.height : "100px",
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
                {disabled ? "Graph requires annotations" : "Graph not loaded"}
              </span>
              <span style={{ display: "flex", alignItems: "center" }}>
                {disabled ? (
                  <span>
                    Annotations must be made before the graph can be constructed
                  </span>
                ) : (
                  <>
                    <IoArrowBack
                      style={{ fontSize: "1rem", textAlign: "center" }}
                    />
                    <span>
                      Click and apply class filters to visualise graph
                    </span>
                  </>
                )}
              </span>
            </span>
          </div>
        )}
      </Grid>
    </Grid>
  );
};
