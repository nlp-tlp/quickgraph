import "../Graph.css";
import { Button } from "react-bootstrap";
import Graph from "react-graph-vis";

import { useSelector, useDispatch } from "react-redux";
import {
  selectGraphData,
  selectGraphOptions,
  setSelectedNode,
  selectAggregate,
  setAggregate,
  resetGraph,
  fetchGraph,
  selectGraphKey,
} from "../graphSlice";

export const KnowledgeGraph = ({ options, projectId, searchTerm }) => {
  const dispatch = useDispatch();
  const graphKey = useSelector(selectGraphKey);
  const aggregate = useSelector(selectAggregate);
  const graphData = useSelector(selectGraphData);
  const graphOptions = useSelector(selectGraphOptions);

  const handleGraphAggregation = (aggregate) => {
    dispatch(setAggregate(aggregate));
    dispatch(fetchGraph({ projectId: projectId, searchTerm: searchTerm }));
  };
  return (
    <>
      <Button
        size="sm"
        variant={!aggregate ? "success" : "secondary"}
        onClick={() => handleGraphAggregation(!aggregate)}
        style={{ position: "absolute", right: 25, top: 10, zIndex: 100 }}
      >
        {!aggregate ? "Aggregate" : "Separate"}
      </Button>
      <Graph
        graph={graphData}
        options={graphOptions} //{{ ...options, groups: graphGroups }}
        key={graphKey} // See: https://github.com/crubier/react-graph-vis/issues/92 // Doesn't allow interactivity...
        events={{
          selectNode: (e) => dispatch(setSelectedNode({ params: e })), //handleNodeSelect,
          doubleClick: (e) => dispatch(resetGraph()), //handleGraphReset,
        }}
        style={{
          height: "600px",
          border: "1px solid rgba(0,0,0,.125)",
          borderRadius: ".25rem",
        }}
      />
    </>
  );
};
