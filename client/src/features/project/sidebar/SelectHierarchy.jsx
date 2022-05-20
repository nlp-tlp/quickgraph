import * as React from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PropTypes from "prop-types";
import TreeItem, { useTreeItem } from "@mui/lab/TreeItem";
import Typography from "@mui/material/Typography";
import clsx from "clsx";

import { useDispatch, useSelector } from "react-redux";
import { selectProject, setActiveEntityClass } from "../projectSlice";

import {
  selectSelectMode,
  selectTexts,
  applyAnnotation,
} from "../../../app/dataSlice";

export const SelectHierarchy = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const entityOntology = project.ontology.filter((i) => i.isEntity);
  const selectMode = useSelector(selectSelectMode);
  const texts = useSelector(selectTexts);

  const handleAnnotation = (nodeId) => {
    if (selectMode && selectMode.tokenIds.length > 0) {
      try {
        const textId = selectMode.textId;
        const tokenIds = selectMode.tokenIds;

        // Use text object and tokenIds to find token details
        const tokens = Object.values(texts[textId].tokens).filter((token) =>
          tokenIds.includes(token._id)
        );

        const start = tokens[0].index;
        const end =
          tokens.length === 1
            ? tokens[0].index
            : tokens[tokens.length - 1].index;

        dispatch(
          applyAnnotation({
            entitySpanStart: start,
            entitySpanEnd: end,
            entityLabelId: nodeId,
            textId: textId,
            projectId: project._id,
            applyAll: false,
            suggested: false,
            annotationType: "entity",
            entityText: tokens.map((t) => t.value).join(" "),
            textIds: Object.keys(texts),
          })
        );
      } catch (err) {
        console.log("Failed to apply annotation", selectMode);
      }
    }
  };

  const renderTree = (nodes) => {
    return (
      <CustomTreeItem
        key={nodes._id}
        nodeId={nodes._id}
        label={nodes.name}
        style={{
          color: nodes.colour,
          textAlign: "left",
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
      dispatch(setActiveEntityClass(nodeId));
      handleAnnotation(nodeId);
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
        <Typography
          onClick={(e) => handleSelectionClick(e, nodeId)}
          component="div"
          className={classes.label}
        >
          {label}
        </Typography>
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

  if (!project || !entityOntology) {
    return <span>Loading entities...</span>;
  } else {
    return (
      <TreeView
        aria-label="icon expansion"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{ flexGrow: 1, maxWidth: 400, overflowY: "auto" }}
      >
        {entityOntology.map((parent) => renderTree(parent))}
      </TreeView>
    );
  }
};
