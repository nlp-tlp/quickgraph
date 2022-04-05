import "../Graph.css";
import { IoDocuments, IoGitCommit, IoShareSocial } from "react-icons/io5";
import { useSelector } from "react-redux";
import { selectGraphMetrics, selectGraphStatus } from "../graphSlice";
import { Spinner } from "react-bootstrap";

export const Overview = () => {
  const metrics = useSelector(selectGraphMetrics);
  const graphStatus = useSelector(selectGraphStatus);
  return (
    <div id="graph-overview-container">
      {graphStatus === "loading" ? (
        <Spinner animation="border" />
      ) : (
        <>
          <div
            id="metric-container"
            title="Number of documents graph is built from."
          >
            <span>
              <IoDocuments />
            </span>
            <span>{metrics && metrics.totalDocs}</span>
          </div>
          <div id="metric-container" title="Number of nodes in the graph.">
            <span>
              <IoGitCommit />
            </span>
            <span>{metrics && metrics.totalNodes}</span>
          </div>
          <div id="metric-container" title="Number of edges in the graph.">
            <span>
              <IoShareSocial />
            </span>
            <span>{metrics && metrics.totalEdges}</span>
          </div>
        </>
      )}
    </div>
  );
};
