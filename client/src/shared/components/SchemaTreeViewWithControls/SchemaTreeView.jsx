import * as React from "react";
import { styled } from "@mui/material/styles";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { useTreeItem2 } from "@mui/x-tree-view/useTreeItem2";
import {
  TreeItem2Content,
  TreeItem2IconContainer,
  TreeItem2GroupTransition,
  TreeItem2Root,
  TreeItem2Checkbox,
} from "@mui/x-tree-view/TreeItem2";
import { TreeItem2Icon } from "@mui/x-tree-view/TreeItem2Icon";
import { TreeItem2Provider } from "@mui/x-tree-view/TreeItem2Provider";
import { TreeItem2DragAndDropOverlay } from "@mui/x-tree-view/TreeItem2DragAndDropOverlay";
import RuleIcon from "@mui/icons-material/Rule";
import {
  Stack,
  TextField,
  Box,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  alpha,
  Autocomplete,
  Badge,
  Typography,
} from "@mui/material";
import { CirclePicker } from "react-color";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { debounce } from "lodash";
import { findItemById, generateItemID } from "./utils";
import RelationConstraintsModal from "../RelationConstraintsModal";

const CustomTreeItemContent = styled(TreeItem2Content)(({ theme }) => ({
  padding: theme.spacing(0.5, 1),
}));

const CustomTreeItem = React.forwardRef(function CustomTreeItem(props, ref) {
  const {
    id,
    itemId,
    label,
    disabled,
    children,
    onNodeUpdate,
    onNodeDelete,
    onNodeAdd,
    items,
    editable,
    isEntity,
    isBlueprint,
    ...other
  } = props;

  const menuItemName = isEntity ? "Entity" : "Relation";
  const [ConstraintsModal, setConstraintsModal] = React.useState(null);
  const [constraintsModalOpen, setConstraintsModalOpen] = React.useState(false);

  const itemData = findItemById(items, itemId);

  const [nodeLabel, setNodeLabel] = React.useState(itemData?.name || "");
  const [nodeDescription, setNodeDescription] = React.useState(
    itemData?.description || ""
  );
  const [nodeColor, setNodeColor] = React.useState(
    itemData?.color || "#efefef"
  );
  const [isActive, setIsActive] = React.useState(itemData?.active || true);
  const [error, setError] = React.useState(false);

  // Validate name on mount and when nodeLabel changes
  React.useEffect(() => {
    setError(!nodeLabel || nodeLabel.trim() === "");
  }, [nodeLabel]);

  // Refs for input elements to maintain focus
  const labelInputRef = React.useRef(null);
  const descInputRef = React.useRef(null);

  const debouncedUpdate = React.useCallback(
    debounce((name, description, inputRef) => {
      if (onNodeUpdate) {
        onNodeUpdate(itemId, { name, description });
        // Restore focus after the update
        if (inputRef?.current) {
          inputRef.current.focus();
          // Move cursor to end of input
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }
    }, 1000),
    [itemId, onNodeUpdate]
  );

  React.useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  // Menu state
  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [colorPickerAnchor, setColorPickerAnchor] = React.useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    event.stopPropagation();
    setMenuAnchor(null);
    setColorPickerAnchor(null);
  };

  const handleColorClick = (event) => {
    event.stopPropagation();
    setColorPickerAnchor(event.currentTarget);
  };

  const handleColorChange = (color) => {
    const newColor = color.hex;
    setNodeColor(newColor);
    if (onNodeUpdate) {
      onNodeUpdate(itemId, { color: newColor }, true); // true indicates update descendants
    }
    setColorPickerAnchor(null);
    setMenuAnchor(null);
  };

  const handleToggleActive = (event) => {
    event.stopPropagation();
    const newActive = !isActive;
    setIsActive(newActive);
    if (onNodeUpdate) {
      onNodeUpdate(itemId, { active: newActive }, true); // true indicates update descendants
    }
    setMenuAnchor(null);
  };

  const handleAddChild = (event) => {
    event.stopPropagation();
    if (onNodeAdd) {
      const newNode = {
        id: generateItemID(),
        name: "",
        description: "",
        color: nodeColor,
        active: true,
      };
      onNodeAdd(itemId, newNode);
    }
    setMenuAnchor(null);
  };

  const handleDeleteNode = (event) => {
    event.stopPropagation();
    if (onNodeDelete) {
      onNodeDelete(itemId);
    }
    setMenuAnchor(null);
  };

  // Prevent focus loss
  const handleClick = (e) => {
    e.stopPropagation();
  };

  const {
    getRootProps,
    getContentProps,
    getIconContainerProps,
    getCheckboxProps,
    getGroupTransitionProps,
    getDragAndDropOverlayProps,
    status,
  } = useTreeItem2({
    id,
    itemId,
    children,
    label: nodeLabel,
    disabled,
    rootRef: ref,
    expansionTrigger: "icon",
  });

  const handleLabelChange = (event) => {
    event.stopPropagation();
    const newValue = event.target.value;
    setNodeLabel(newValue);
    setError(!newValue || newValue.trim() === "");
    debouncedUpdate(newValue, nodeDescription, labelInputRef);
  };

  const handleDescriptionChange = (event) => {
    event.stopPropagation();
    const newValue = event.target.value;
    setNodeDescription(newValue);
    debouncedUpdate(nodeLabel, newValue, descInputRef);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
  };

  // Custom root props to prevent focus loss
  const rootProps = getRootProps(other);
  const { onClick, ...otherRootProps } = rootProps;

  const handleOpenConstraintsModal = async (event) => {
    event.stopPropagation();
    // Only load the modal component if it hasn't been loaded yet
    if (!ConstraintsModal) {
      const { default: RelationConstraintsModal } = await import(
        "../RelationConstraintsModal"
      );
      setConstraintsModal(() => RelationConstraintsModal);
    }
    setConstraintsModalOpen(true);
    setMenuAnchor(null);
  };

  const handleCloseConstraintsModal = (event) => {
    event.stopPropagation();
    setConstraintsModalOpen(false);
  };
  return (
    <>
      <TreeItem2Provider itemId={itemId}>
        <TreeItem2Root {...otherRootProps}>
          <CustomTreeItemContent
            {...getContentProps()}
            sx={{
              border: "1px solid",
              marginTop: "8px",
              borderColor: nodeColor,
              backgroundColor: alpha(nodeColor, 0.25),
              opacity: isActive ? 1 : 0.5,
            }}
          >
            <TreeItem2IconContainer {...getIconContainerProps()}>
              <TreeItem2Icon status={status} />
            </TreeItem2IconContainer>
            <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
              <TreeItem2Checkbox {...getCheckboxProps()} />
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
                onClick={handleClick}
                p={1}
              >
                <Stack direction="column" width="100%" mr={2}>
                  <TextField
                    inputRef={labelInputRef}
                    label="Name"
                    size="small"
                    fullWidth
                    type="input"
                    variant="standard"
                    value={nodeLabel}
                    onChange={editable ? handleLabelChange : null}
                    sx={{ fontWeight: 500 }}
                    disabled={!isActive}
                    error={error}
                    helperText={error ? "Name cannot be empty" : ""}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={handleKeyDown}
                    InputProps={{
                      onKeyDown: handleKeyDown,
                    }}
                  />
                  <TextField
                    inputRef={descInputRef}
                    label="Description"
                    size="small"
                    fullWidth
                    type="input"
                    variant="standard"
                    value={nodeDescription}
                    onChange={editable ? handleDescriptionChange : null}
                    disabled={!isActive}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={handleKeyDown}
                    InputProps={{
                      onKeyDown: handleKeyDown,
                    }}
                  />
                  {!isEntity && (
                    <Typography variant="caption" mt={1}>
                      This relation has{" "}
                      {itemData?.constraints?.domain?.length ?? 0} domain and{" "}
                      {itemData?.constraints?.range?.length ?? 0} range
                      constraints
                    </Typography>
                  )}
                </Stack>
                {editable && (
                  <Box>
                    <Tooltip title="More actions">
                      <IconButton onClick={handleMenuOpen}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Stack>
            </Box>
            <TreeItem2DragAndDropOverlay {...getDragAndDropOverlayProps()} />
          </CustomTreeItemContent>
          {children && (
            <TreeItem2GroupTransition {...getGroupTransitionProps()} />
          )}
        </TreeItem2Root>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleToggleActive}>
            {isActive ? `Disable ${menuItemName}` : `Enable ${menuItemName}`}
          </MenuItem>
          <MenuItem onClick={handleColorClick}>Change Color</MenuItem>
          <MenuItem onClick={handleAddChild}>Add Child {menuItemName}</MenuItem>
          {!isEntity &&
            (isBlueprint ? (
              <Tooltip
                title="Contraints are only allowed on project relation resources."
                placement="left"
                arrow
              >
                <div>
                  <MenuItem disabled={isBlueprint}>
                    Add/Edit Constraints
                  </MenuItem>
                </div>
              </Tooltip>
            ) : (
              <MenuItem
                onClick={handleOpenConstraintsModal}
                disabled={isBlueprint}
              >
                Add/Edit Constraints
              </MenuItem>
            ))}
          <MenuItem onClick={handleDeleteNode}>Delete {menuItemName}</MenuItem>
        </Menu>
        <Popover
          open={Boolean(colorPickerAnchor)}
          anchorEl={colorPickerAnchor}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CirclePicker color={nodeColor} onChange={handleColorChange} />
        </Popover>
      </TreeItem2Provider>
      {!isEntity && !isBlueprint && ConstraintsModal && (
        <RelationConstraintsModal
          open={constraintsModalOpen}
          handleClose={handleCloseConstraintsModal}
          data={itemData}
          onUpdate={(updatedData) => {
            // Optionally handle updates to the relation data
            if (onNodeUpdate) {
              onNodeUpdate(itemId, updatedData);
            }
          }}
        />
      )}
    </>
  );
});

export default function SchemaTreeView({
  items,
  expandedItems,
  setExpandedItems,
  getItemId,
  getItemLabel,
  handleNodeUpdate,
  handleNodeDelete,
  handleNodeAdd,
  disabled = false,
  isEntity = true,
  isBlueprint = true,
}) {
  return (
    <RichTreeView
      expandedItems={expandedItems}
      onExpandedItemsChange={(event, itemIds) => setExpandedItems(itemIds)}
      items={items}
      getItemId={getItemId}
      getItemLabel={getItemLabel}
      slots={{
        item: (props) => (
          <CustomTreeItem
            {...props}
            items={items}
            onNodeUpdate={handleNodeUpdate}
            onNodeDelete={handleNodeDelete}
            onNodeAdd={handleNodeAdd}
            editable={!disabled}
            isEntity={isEntity}
            isBlueprint={isBlueprint}
          />
        ),
      }}
      expansionTrigger="iconContainer"
    />
  );
}
