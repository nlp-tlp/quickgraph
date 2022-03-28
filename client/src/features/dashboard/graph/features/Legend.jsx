import "../Graph.css";
import "react-complex-tree/lib/style.css";
import { getFontColour } from "../../../project/utils";
import { useSelector } from "react-redux";
import { selectNodeClasses } from "../graphSlice";

export const Legend = () => {
  const nodeClasses = useSelector(selectNodeClasses);

  console.log("legend", nodeClasses);
  if (!nodeClasses) {
    return <div>Loading legend...</div>;
  } else {
    return (
      <div id="graph-legend-container">
        <p id="graph-legend-title">Legend</p>
        <div id="graph-legend-list">
          {Object.keys(nodeClasses).map((group) => (
            <span
              id="graph-legend-item"
              title={`${group}`}
              style={{
                backgroundColor: nodeClasses[group].color,
                color: getFontColour(nodeClasses[group].color),
              }}
            >
              {group}
            </span>
          ))}
        </div>
      </div>
    );
  }
};
