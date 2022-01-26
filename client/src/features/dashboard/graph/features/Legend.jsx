import "../Graph.css";
import "react-complex-tree/lib/style.css";
import { getFontColour } from "../../../project/utils";
import { useSelector } from "react-redux";
import { selectGraphGroups } from "../graphSlice";

export const Legend = () => {
  const groups = useSelector(selectGraphGroups);

  console.log("legend", groups);
  if (!groups) {
    return <div>Loading legend...</div>;
  } else {
    return (
      <div id="graph-legend-container">
        <p id="graph-legend-title">Legend</p>
        <div id="graph-legend-list">
          {Object.keys(groups).map((group) => (
            <span
              id="graph-legend-item"
              title={`${group}`}
              style={{
                backgroundColor: groups[group].color,
                color: getFontColour(groups[group].color),
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
