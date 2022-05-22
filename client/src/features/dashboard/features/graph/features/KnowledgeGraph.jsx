import Graph from "react-graph-vis";
import { useDispatch, useSelector } from "react-redux";
import "../Graph.css";
import {
  resetGraph,
  selectGraphData,
  selectGraphKey,
  selectGraphOptions,
  setSelectedNode,
} from "../graphSlice";

export const KnowledgeGraph = ({ dimensions }) => {
  const dispatch = useDispatch();
  const graphKey = useSelector(selectGraphKey);
  const graphData = useSelector(selectGraphData);
  const graphOptions = useSelector(selectGraphOptions);

  // const handleNodeSelect = (e) => {
  //   console.log("node selected", e);
  // };

  return (
    <Graph
      graph={graphData}
      options={graphOptions} //{{ ...options, groups: graphGroups }}
      key={graphKey} // See: https://github.com/crubier/react-graph-vis/issues/92 // Doesn't allow interactivity...
      events={{
        // selectNode: handleNodeSelect,
        // selectNode: (e) => dispatch(setSelectedNode({ params: e })), //handleNodeSelect,
        doubleClick: (e) => dispatch(resetGraph()), //handleGraphReset,
      }}
      style={{
        height: 800, //dimensions.height ,
        border: "1px solid rgba(0,0,0,.125)",
        borderRadius: ".25rem",
      }}
    />
  );
};
