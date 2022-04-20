import "./Sidebar.css";
import { GiClick } from "react-icons/gi";
import { useSelector } from "react-redux";
import { selectProjectStatus } from "../projectSlice";
import { SelectHierarchy } from "./SelectHierarchy";

export const Sidebar = () => {
  return <LabelContainer />;
};

const LabelContainer = () => {
  const projectStatus = useSelector(selectProjectStatus);

  if (projectStatus !== "succeeded") {
    return <div>loading...</div>;
  } else {
    return (
      <div className="complex-tree-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0rem 1rem",
            fontWeight: "bold",
            color: "rgb(55, 71, 79)",
            userSelect: "none",
          }}
        >
          <span>Entities</span>
          <GiClick />
        </div>
        <div style={{ marginLeft: "1rem" }}>
          <SelectHierarchy />
        </div>
      </div>
    );
  }
};
