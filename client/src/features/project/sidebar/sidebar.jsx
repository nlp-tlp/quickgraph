import "./Sidebar.css";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  applyAnnotation,
  selectAnnotationMode,
  selectSelectMode,
  selectTexts,
} from "../../../app/dataSlice";
import {
  selectKeyBinding,
  selectProject,
  selectProjectStatus,
} from "../projectSlice";
import { GiClick } from "react-icons/gi";
import { SelectHierarchy } from "./SelectHierarchy";

export const Sidebar = () => {
  return <LabelContainer />;
};

const LabelContainer = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const projectStatus = useSelector(selectProjectStatus);
  const selectMode = useSelector(selectSelectMode);
  const texts = useSelector(selectTexts);
  const keyBinding = useSelector(selectKeyBinding);
  const annotationMode = useSelector(selectAnnotationMode);
  const [currentLabel, setCurrentLabel] = useState();
  const [currentKeybinding, setCurrentKeybinding] = useState();
  const [showSettings, setShowSettings] = useState(false);
  const [labelHierarchy, setLabelHierarchy] = useState();
  const [expanded, setExpanded] = useState(false);

  const [treeExpanded, setTreeExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);

  useEffect(() => {
    if (projectStatus === "succeeded") {
      setLabelHierarchy(project.entityOntology);
      // Set initial selected label
      setCurrentLabel(project.entityOntology[0].name);
    }
  }, [projectStatus]);

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
