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
} from "@mui/material";
import { CirclePicker } from "react-color";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { debounce } from "lodash";
import { findItemById, generateItemID } from "./utils";

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
    ...other
  } = props;

  const itemData = findItemById(items, itemId);
  const [nodeLabel, setNodeLabel] = React.useState(itemData?.name || "");
  const [nodeDescription, setNodeDescription] = React.useState(
    itemData?.description || ""
  );
  const [nodeColor, setNodeColor] = React.useState(
    itemData?.color || "#efefef"
  );
  const [isDisabled, setIsDisabled] = React.useState(
    itemData?.disabled || false
  );
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

  const handleToggleDisabled = (event) => {
    event.stopPropagation();
    const newDisabled = !isDisabled;
    setIsDisabled(newDisabled);
    if (onNodeUpdate) {
      onNodeUpdate(itemId, { disabled: newDisabled });
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
        disabled: false,
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

  return (
    <TreeItem2Provider itemId={itemId}>
      <TreeItem2Root {...otherRootProps}>
        <CustomTreeItemContent
          {...getContentProps()}
          sx={{
            border: "1px solid",
            marginTop: "8px",
            borderColor: nodeColor,
            backgroundColor: alpha(nodeColor, 0.25),
            opacity: isDisabled ? 0.5 : 1,
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
                  disabled={isDisabled}
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
                  disabled={isDisabled}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleKeyDown}
                  InputProps={{
                    onKeyDown: handleKeyDown,
                  }}
                />
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
        <MenuItem onClick={handleToggleDisabled}>
          {isDisabled ? "Enable Node" : "Disable Node"}
        </MenuItem>
        <MenuItem onClick={handleColorClick}>Change Color</MenuItem>
        <MenuItem onClick={handleAddChild}>Add Child Node</MenuItem>
        <MenuItem onClick={handleDeleteNode}>Delete Node</MenuItem>
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
          />
        ),
      }}
      expansionTrigger="iconContainer"
    />
  );
}
