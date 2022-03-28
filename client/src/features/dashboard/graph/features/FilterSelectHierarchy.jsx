import * as React from "react";
import { useState } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import PropTypes from "prop-types";
import TreeItem, { useTreeItem } from "@mui/lab/TreeItem";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { useParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveEntityClass,
  selectProject,
} from "../../../project/projectSlice";

import { selectGraphFilters, setFilters, fetchGraph } from "../graphSlice";

import {
  selectSelectMode,
  selectTexts,
  applyAnnotation,
} from "../../../../app/dataSlice";

export const FilterSelectHierarchy = ({ontology, rootName}) => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const selectMode = useSelector(selectSelectMode);
  const texts = useSelector(selectTexts);
  const activeEntityClass = useSelector(selectActiveEntityClass);

  const graphFilters = useSelector(selectGraphFilters);

  console.log(graphFilters);

  const renderTree = (nodes) => {
    return (
      <CustomTreeItem
        key={nodes.id}
        nodeId={nodes.id}
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

    const handleSelectionClick = (event, label, nodeId) => {
      handleSelection(event);
      console.log(label);
      dispatch(
        setFilters({
          ...graphFilters,
          entityClasses: graphFilters.entityClasses.includes(label)
            ? graphFilters.entityClasses.filter((c) => c !== label)
            : [...graphFilters.entityClasses, label],
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
        <div onClick={(e) => handleSelectionClick(e, label, nodeId)}>
          {graphFilters.entityClasses.includes(label) ? (
            <CheckBoxIcon />
          ) : (
            <CheckBoxOutlineBlankIcon />
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
        sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: "auto" }}
      >
        {project.entityOntology.map((parent) => renderTree(parent))}
      </TreeView>
    );
  }
};
