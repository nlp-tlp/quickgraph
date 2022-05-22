import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TreeItem, { useTreeItem } from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import PropTypes from "prop-types";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { selectProject } from "../../../../project/projectSlice";
import {
  fetchGraph,
  selectFilteredOntology,
  selectGraphFilters,
  setFilters,
} from "../graphSlice";
import { getFlatOntology } from "../../../../project/utils";

export const FilterSelectHierarchy = ({ ontology }) => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const graphFilters = useSelector(selectGraphFilters);
  const filteredOntology = useSelector(selectFilteredOntology);

  // console.log("select hierarchy ontology", filteredOntology);

  const renderTree = (nodes) => {
    return (
      <CustomTreeItem
        key={nodes._id}
        nodeId={nodes._id}
        label={nodes.name}
        style={{
          color: nodes.colour,
        }}
      >
        {Array.isArray(nodes.children)
          ? nodes.children.map((node) => renderTree(node))
          : null}
      </CustomTreeItem>
    );
  };

  const CustomContent = React.forwardRef(function CustomContent(props, ref) {
    const {
      classes,
      className,
      label,
      nodeId,
      icon: iconProp,
      expansionIcon,
      displayIcon,
    } = props;

    const {
      disabled,
      expanded,
      selected,
      focused,
      handleExpansion,
      handleSelection,
      preventSelection,
    } = useTreeItem(nodeId);

    const icon = iconProp || expansionIcon || displayIcon;

    const handleMouseDown = (event) => {
      preventSelection(event);
    };

    const handleExpansionClick = (event) => {
      handleExpansion(event);
    };

    const handleSelectionClick = (event, nodeId) => {
      handleSelection(event);

      // console.log("labelIds before filter", graphFilters.labelIds.length);

      // Get descendents of nodeId as these will be also added/removed from labelIds in filter
      const branch = getFlatOntology(filteredOntology).filter(
        (item) => item._id === nodeId
      );
      // console.log("branch", branch);
      const flatBranch = getFlatOntology(branch);
      // console.log("flat branch", flatBranch);

      // Update labelId filter
      let newLabelIds = graphFilters.labelIds;
      flatBranch.map((item) => {
        if (newLabelIds.includes(item._id)) {
          newLabelIds = newLabelIds.filter((c) => c !== item._id);
        } else {
          newLabelIds = [...newLabelIds, item._id];
        }
      });

      // console.log("labelIds after filter", newLabelIds.length);

      dispatch(
        setFilters({
          ...graphFilters,
          labelIds: newLabelIds,
        })
      );
      dispatch(fetchGraph({ projectId: projectId }));
    };

    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className={clsx(className, classes.root, {
          [classes.expanded]: expanded,
          [classes.selected]: selected,
          [classes.focused]: focused,
          [classes.disabled]: disabled,
        })}
        onMouseDown={handleMouseDown}
        ref={ref}
      >
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
        <div onClick={handleExpansionClick} className={classes.iconContainer}>
          {icon}
        </div>
        <Typography component="div" className={classes.label}>
          {label}
        </Typography>
        <div onClick={(e) => handleSelectionClick(e, nodeId)}>
          {graphFilters.labelIds.includes(nodeId) ? (
            <CheckBoxOutlineBlankIcon />
          ) : (
            <CheckBoxIcon />
          )}
        </div>
      </div>
    );
  });

  CustomContent.propTypes = {
    /**
     * Override or extend the styles applied to the component.
     */
    classes: PropTypes.object.isRequired,
    /**
     * className applied to the root element.
     */
    className: PropTypes.string,
    /**
     * The icon to display next to the tree node's label. Either a parent or end icon.
     */
    displayIcon: PropTypes.node,
    /**
     * The icon to display next to the tree node's label. Either an expansion or collapse icon.
     */
    expansionIcon: PropTypes.node,
    /**
     * The icon to display next to the tree node's label.
     */
    icon: PropTypes.node,
    /**
     * The tree node label.
     */
    label: PropTypes.node,
    /**
     * The id of the node.
     */
    nodeId: PropTypes.string.isRequired,
  };

  const CustomTreeItem = (props) => (
    <TreeItem ContentComponent={CustomContent} {...props} />
  );

  if (!project) {
    return <span>Loading entities...</span>;
  } else {
    return (
      <TreeView
        aria-label="icon expansion"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{
          maxHeight: 240,
          flexGrow: 1,
          maxWidth: 400,
          overflowY: "auto",
          marginBottom: "1rem",
        }}
      >
        {ontology.map((parent) => renderTree(parent))}
      </TreeView>
    );
  }
};
