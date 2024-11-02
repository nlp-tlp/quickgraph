import React, { forwardRef, useMemo } from "react";
import { getDescendantIds } from "../../../../../shared/utils/treeView";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { TreeItem2 } from "@mui/x-tree-view/TreeItem2";
import { useTreeItem2Utils } from "@mui/x-tree-view/hooks";
import { styled } from "@mui/material/styles";
import CircleIcon from "@mui/icons-material/Circle";

const StyledTreeItem2 = styled(TreeItem2)(({ theme }) => ({
  "& .MuiTreeItem-content": {
    border: "1px solid transparent",
    borderRadius: 0,
    marginBottom: 2,
    color: theme.palette.text.primary,
    // Add styles for the content layout
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.5, 1),
  },
  "& .MuiTreeItem-iconContainer": {
    color: "inherit",
  },
  // Add styles for the label and icon container
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

  const handleContentClick = (event) => {
    event.defaultMuiPrevented = true;
    interactions.handleSelection(event);
  };

  const handleIconContainerClick = (event) => {
    interactions.handleExpansion(event);
    event.stopPropagation(); // Prevents the content click handler from being triggered
  };

  const contentWithColorIcon = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        justifyContent: "left",
        gap: 4,
      }}
    >
      <CircleIcon sx={{ fontSize: 14, color: itemColor }} />
      <span>{props.label}</span>
    </div>
  );

  return (
    <StyledTreeItem2
      {...props}
      ref={ref}
      itemcolor={itemColor}
      title={`${props.fullname} (${props.itemId})` || ""}
      label={contentWithColorIcon}
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

export const FilterSelectHierarchy = ({ ontology, filters, setFilters }) => {
  const getItemLabel = (item) => item.name;
  const getItemId = (item) => item.id;

  const handleSelectedItemsChange = (event, nodeId) => {
    // Toggles item to be excluded from selection - this includes descendants
    const items = [...filters.exclude_ontology_item_ids];
    // Get descendants
    const descendantIds = getDescendantIds(ontology, nodeId);
    const index = items.indexOf(nodeId);

    if (index === -1) {
      // Item is not excluded, so add it and its descendants
      const newItems = [...new Set([...items, ...[nodeId, ...descendantIds]])];
      setFilters({ exclude_ontology_item_ids: newItems });
    } else {
      // Item is already excluded, add it back in
      setFilters({
        exclude_ontology_item_ids: items.filter(
          (i) => ![nodeId, ...descendantIds].includes(i)
        ),
      });
    }
  };

  const getAllItemIds = (items) => {
    let allIds = [];
    items.forEach((item) => {
      allIds.push(item.id);
      if (item.children) {
        allIds = [...allIds, ...getAllItemIds(item.children)];
      }
    });
    return allIds;
  };

  const allItemIds = getAllItemIds(ontology);
  const selectedItems = allItemIds.filter(
    (id) => !filters.exclude_ontology_item_ids.includes(id)
  );

  return (
    <RichTreeView
      items={ontology ?? []}
      getItemId={getItemId}
      getItemLabel={getItemLabel}
      expansionTrigger="iconContainer"
      slots={{
        item: CustomTreeItem,
      }}
      slotProps={{
        item: (item) => ({
          item: item,
          color: findItem(item.itemId, ontology)?.color,
          fullname: findItem(item.itemId, ontology)?.fullname,
        }),
      }}
      onSelectedItemsChange={handleSelectedItemsChange}
      selectedItems={selectedItems}
      multiSelect
      checkboxSelection
    />
  );
};
