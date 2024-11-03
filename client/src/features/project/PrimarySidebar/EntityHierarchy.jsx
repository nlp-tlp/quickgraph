import React, { useState, forwardRef, useContext } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { styled } from "@mui/material/styles";
import { extractIds } from "../../../shared/utils/treeView";
import { ProjectContext } from "../../../shared/context/ProjectContext";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { TreeItem2 } from "@mui/x-tree-view/TreeItem2";
import { useTreeItem2Utils } from "@mui/x-tree-view/hooks";

const getContrastColor = (color) => {
  // Convert hex to RGB
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
};

const StyledTreeItem2 = styled(TreeItem2)(({ theme, itemcolor }) => ({
  "& .MuiTreeItem-content": {
    border: `1px solid ${itemcolor || "transparent"}`,
    borderRadius: 0,
    marginBottom: 2,
    backgroundColor: itemcolor ? alpha(itemcolor, 0.75) : "transparent",
    color: itemcolor ? getContrastColor(itemcolor) : theme.palette.text.primary,
    "&:hover": {
      backgroundColor: itemcolor ? itemcolor : theme.palette.action.hover,
    },
    // Add styles for the content layout
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.5, 1),
  },
  "& .MuiTreeItem-iconContainer": {
    color: itemcolor ? getContrastColor(itemcolor) : "inherit",
  },
  // Add styles for the label and chip container
  "& .MuiTreeItem-label": {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));

const CustomTreeItem = forwardRef(function MyTreeItem(props, ref) {
  const { interactions } = useTreeItem2Utils({
    itemId: props.itemId,
    children: props.children,
  });

  const itemColor = props.color || "inherit";
  const path = props.path || [];
  const shortcut = path.length > 0 ? path.map((num) => num + 1).join("") : null;

  const handleContentClick = (event) => {
    event.defaultMuiPrevented = true;
    interactions.handleSelection(event);
  };

  const handleIconContainerClick = (event) => {
    interactions.handleExpansion(event);
    event.stopPropagation(); // Prevents the content click handler from being triggered
  };

  const contentWithShortcut = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      <span>{props.label}</span>
      {shortcut && (
        <Chip
          label={shortcut}
          size="small"
          sx={{ ml: 1, backgroundColor: "white" }}
          title="Keyboard shortcut"
        />
      )}
    </div>
  );

  return (
    <StyledTreeItem2
      {...props}
      ref={ref}
      itemcolor={itemColor}
      title={`${props.fullname} (${props.itemId})` || ""}
      label={contentWithShortcut}
      slotProps={{
        content: {
          onClick: handleContentClick,
          sx: {
            "&:hover": {
              backgroundColor: `${itemColor}20`,
            },
          },
        },
        iconContainer: { onClick: handleIconContainerClick },
      }}
    />
  );
});

// Helper function to calculate paths for all nodes
const calculatePaths = (items, currentPath = []) => {
  return items.map((item, index) => {
    const newPath = [...currentPath, index];
    const newItem = { ...item, path: newPath };

    if (item.children && item.children.length > 0) {
      newItem.children = calculatePaths(item.children, newPath);
    }

    return newItem;
  });
};

const findItem = (id, items) => {
  if (!items) return null;
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItem(id, item.children);
      if (found) return found;
    }
  }
  return null;
};

const EntityTreeSelect = () => {
  const { state, dispatch, handleApply } = useContext(ProjectContext);

  const handleAnnotation = (nodeId) => {
    if (state.entityAnnotationMode && 0 < state.selectedTokenIndexes.length) {
      try {
        const textId = state.selectedTextId;
        const tokenIndexes = state.selectedTokenIndexes;

        const start = tokenIndexes[0];
        const end = tokenIndexes.at(-1);

        const payload = {
          project_id: state.projectId,
          dataset_item_id: textId,
          extra_dataset_item_ids: Object.keys(state.texts),
          annotation_type: "entity",
          suggested: false,
          content: {
            ontology_item_id: nodeId,
            start: start,
            end: end,
            surface_form: state.texts[textId].tokens
              .filter((t) => tokenIndexes.includes(t.index))
              .map((t) => t.value)
              .join(" "),
          },
        };
        handleApply({ body: payload, params: { apply_all: false } });
      } catch (error) {}
    }
  };
  const getItemLabel = (item) => item.name;
  const getItemId = (item) => item.id;

  const handleSelectedItemsChange = (event, id) => {
    dispatch({ type: "SET_VALUE", payload: { activeEntityClass: id } });
    handleAnnotation(id);
  };

  return (
    <Box sx={{ minHeight: 352, minWidth: 250 }}>
      <RichTreeView
        items={state?.ontology?.entity ?? []}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        expansionTrigger="iconContainer"
        slots={{
          item: CustomTreeItem,
        }}
        slotProps={{
          item: (item) => ({
            item: item,
            color: findItem(item.itemId, state.ontology.entity)?.color,
            fullname: findItem(item.itemId, state.ontology.entity)?.fullname,
            path: findItem(item.itemId, state.ontology.entity)?.path,
          }),
        }}
        onSelectedItemsChange={handleSelectedItemsChange}
      />
    </Box>
  );
};

const EntityHierarchy = ({
  expandedEntityIds: expandedIds,
  setExpandedEntityIds: setExpandedIds,
}) => {
  const { state, dispatch, handleApply } = useContext(ProjectContext);
  const [treeData, setTreeData] = useState([]);

  const handleExpandAll = () => {
    setExpandedIds(extractIds(treeData));
  };

  const handleCollapseAll = () => {
    setExpandedIds([]);
  };

  const handleToggle = (event, nodeIds) => {
    setExpandedIds(nodeIds);
  };

  return (
    <>
      {state.projectLoading ? (
        <Box
          key="entity-hierarchy-loading-container"
          p={2}
          height="auto"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            justifyContent="center"
            width="100%"
          >
            <CircularProgress size={14} />
            <Typography>Loading Entity Hierarchy</Typography>
          </Stack>
        </Box>
      ) : (
        <>
          {/* <Box pt={1} pb={2}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-evenly"
            >
              <Button
                onClick={handleExpandAll}
                size="small"
                title="Click to expand entity hierarchy"
                variant="outlined"
              >
                Expand All
              </Button>
              <Button
                onClick={handleCollapseAll}
                size="small"
                title="Click to collapse entity hierarchy"
                variant="outlined"
              >
                Collapse All
              </Button>
            </Stack>
          </Box> */}
          <Box>
            <EntityTreeSelect />
          </Box>
        </>
      )}
    </>
  );
};

export default EntityHierarchy;
