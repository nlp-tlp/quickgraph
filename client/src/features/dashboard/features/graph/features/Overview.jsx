import { useSelector } from "react-redux";
import {
  selectGraphMetrics,
  selectGraphStatus,
  selectAggregate,
} from "../graphSlice";
import { grey } from "@mui/material/colors";

export const Overview = () => {
  const metrics = useSelector(selectGraphMetrics);
  const graphStatus = useSelector(selectGraphStatus);
  const aggregate = useSelector(selectAggregate);
  return (
    <div
      style={{ display: "flex", justifyContent: "center", padding: "0.5rem" }}
    >
      <span style={{ color: grey[800], fontSize: "0.7rem" }}>
        {graphStatus === "loading" || !metrics
          ? "Graph loading..."
          : `Showing ${metrics.totalNodes} nodes and ${
              metrics.totalEdges
            } edges ${aggregate ? "aggregated" : "created"} from ${
              metrics.totalDocs
            } texts`}
      </span>
    </div>
  );
};
