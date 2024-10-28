import React, { useState, useEffect } from "react";
// import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
// import TreeItem, { useTreeItem } from "@mui/lab/TreeItem";
// import lodash from 'lodash'
import {
  addRootItem,
  getItemDetails,
  updateItemName,
  updateItemDescription,
  updateItemColor,
  addChildItem,
  removeItem,
  extractIds,
  countTreeItemsAndMaxDepth,
  updateTreeVisibility,
  validateTreeData,
} from "../utils/treeView";
import {
  Stack,
  Typography,
  Button,
  IconButton,
  TextField,
  Paper,
  Grid,
  Popover,
  Tooltip,
  Chip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  Box,
} from "@mui/material";
import clsx from "clsx";
import PropTypes from "prop-types";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import BrushIcon from "@mui/icons-material/Brush";
import LabelOffIcon from "@mui/icons-material/LabelOff";
import { CompactPicker } from "react-color";
import DownloadIcon from "@mui/icons-material/Download";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { alpha } from "@mui/system";
import cloneDeep from "lodash/cloneDeep";

// const CustomContent = React.forwardRef(function CustomContent(props, ref) {
//   const {
//     classes,
//     className,
//     label,
//     nodeId,
//     path,
//     color,
//     treeData,
//     setTreeData,
//     icon: iconProp,
//     expansionIcon,
//     displayIcon,
//     setExpandedIds,
//     baseTreeDataIds,
//     editable,
//     canDeleteItems,
//   } = props;

//   const {
//     disabled,
//     expanded,
//     selected,
//     focused,
//     handleSelection,
//     preventSelection,
//   } = useTreeItem(nodeId);

//   const icon = expansionIcon; //iconProp ||  || displayIcon;

//   const [anchorEl, setAnchorEl] = useState(null);
//   const [menuAnchorEl, setMenuAnchorEl] = useState(null);

//   const menuOpen = Boolean(menuAnchorEl);
//   const handleMenuClick = (event) => setMenuAnchorEl(event.currentTarget);
//   const handleMenuClose = () => setMenuAnchorEl(null);

//   const handleClick = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleColorMenuClose = () => {
//     setAnchorEl(null);
//     setMenuAnchorEl(null);
//   };

//   const open = Boolean(anchorEl);

//   const handleRemoveNode = (id) => {
//     const updatedNodes = removeItem(treeData, path);
//     setTreeData(updatedNodes);
//   };

//   const handleNameChange = (event) => {
//     const updatedNodes = updateItemName(treeData, path, event.target.value);
//     setTreeData(updatedNodes);
//   };

//   const handleDescriptionChange = (event) => {
//     const updatedNodes = updateItemDescription(
//       treeData,
//       path,
//       event.target.value
//     );
//     setTreeData(updatedNodes);
//   };

//   const handleColorChange = (event) => {
//     const newColor = event.hex;
//     const updatedNodes = updateItemColor(treeData, path, newColor);
//     setTreeData(updatedNodes);
//     handleColorMenuClose();
//   };

//   const handleActiveState = (activeState) => {
//     const newActiveState = activeState === undefined ? false : !activeState;
//     const newNodes = updateTreeVisibility(treeData, nodeId, newActiveState);
//     // console.log("new visibility nodes", activeState, newNodes);
//     setTreeData(newNodes);
//     handleMenuClose();
//   };

//   const handleExpansionClick = (event) => {
//     setExpandedIds((prevState) =>
//       prevState.includes(nodeDetails.id)
//         ? prevState.filter((i) => i !== nodeDetails.id)
//         : [...prevState, nodeDetails.id]
//     );
//   };

//   const handleAddChild = () => {
//     const updatedNodes = addChildItem(treeData, path);
//     setTreeData(updatedNodes);

//     const expandedIds = extractIds(updatedNodes);
//     setExpandedIds(expandedIds);
//     handleMenuClose();
//   };

//   const nodeDetails = getItemDetails(treeData, path);

//   return (
//     // eslint-disable-next-line jsx-a11y/no-static-element-interactions
//     <div
//       className={clsx(className, classes.root, {
//         [classes.expanded]: expanded,
//         [classes.selected]: selected,
//         [classes.focused]: focused,
//         [classes.disabled]: disabled,
//       })}
//       ref={ref}
//       style={{
//         marginTop: "8px",
//         backgroundColor: nodeDetails.active
//           ? alpha(nodeDetails.color, 0.1)
//           : "rgba(0,0,0,0.1)",
//         cursor: "default",
//         "&:hover": {
//           backgroundColor: "transparent",
//         },
//         border: "1px solid",
//         borderColor: nodeDetails.color,
//         borderRadius: 10,
//         padding: 8,
//       }}
//       key={`treeitem-container-${nodeId}`}
//       expanded="true"
//     >
//       {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
//       <Box
//         onClick={handleExpansionClick}
//         className={classes.iconContainer}
//         sx={{
//           cursor: "pointer",
//           color: "rgba(0,0,0,0.5)",
//         }}
//         ml={1}
//       >
//         {icon}
//       </Box>
//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         width="100%"
//         alignItems="center"
//         ml={2}
//       >
//         <Stack direction="column" width="100%" mr={2}>
//           <TextField
//             key={`text-field-node-${nodeId}`}
//             type="input"
//             value={nodeDetails.name}
//             onChange={handleNameChange}
//             variant="standard"
//             InputProps={{
//               readOnly: !editable,
//             }}
//             inputProps={{
//               style: { fontWeight: 500, color: "rgba(0,0,0,0.8)" },
//             }}
//             title={`Name: ${
//               nodeDetails.name !== "" ? nodeDetails.name : "not defined"
//             }`}
//             onKeyDown={(e) => e.stopPropagation()}
//             disabled={!nodeDetails.active}
//             placeholder="Enter item name"
//             error={nodeDetails.name === ""}
//             helperText={nodeDetails.name === "" ? "Item name required" : null}
//           />
//           <TextField
//             fullWidth
//             placeholder={
//               editable
//                 ? "Enter description (optional)"
//                 : "No description defined"
//             }
//             variant="standard"
//             value={nodeDetails.description}
//             onChange={handleDescriptionChange}
//             multiline
//             inputProps={{ style: { fontSize: 12, color: "rgba(0,0,0,0.8)" } }}
//             InputProps={{ disableUnderline: true, readOnly: !editable }}
//             disabled={!nodeDetails.active}
//           />
//         </Stack>
//         {!nodeDetails.active && (
//           <Tooltip title="This item is disabled. Click the menu item to enable it.">
//             <IconButton>
//               <LabelOffIcon fontSize="small" />
//             </IconButton>
//           </Tooltip>
//         )}
//         {editable ? (
//           <>
//             <IconButton onClick={handleMenuClick}>
//               <MoreVertIcon />
//             </IconButton>
//             <Menu
//               id="tree-view-menu"
//               anchorEl={menuAnchorEl}
//               open={menuOpen}
//               onClose={handleMenuClose}
//             >
//               <MenuItem onClick={handleAddChild} title="Click to add child">
//                 <ListItemIcon>
//                   <AddCircleIcon />
//                 </ListItemIcon>
//                 Add child
//               </MenuItem>
//               <MenuItem onClick={handleClick} title="Click to change color">
//                 <ListItemIcon>
//                   <BrushIcon />
//                 </ListItemIcon>
//                 Change color
//               </MenuItem>
//               <MenuItem
//                 title={`Click to ${
//                   nodeDetails.active ? "disable" : "enable"
//                 } - this impacts all descendants`}
//                 onClick={() => handleActiveState(nodeDetails.active)}
//               >
//                 <ListItemIcon>
//                   {nodeDetails.active ? <ToggleOnIcon /> : <ToggleOffIcon />}
//                 </ListItemIcon>
//                 {nodeDetails.active ? "Enabled" : "Disabled"}
//               </MenuItem>
//               <Divider />
//               <MenuItem
//                 onClick={() => handleRemoveNode(nodeDetails.id)}
//                 title="Click to remove"
//                 disabled={
//                   !canDeleteItems && baseTreeDataIds.has(nodeDetails.id)
//                 }
//                 // disabled={treeData.length === 1 && nodeDetails.path === [0]}   // Should the user be able to delete the last item?
//               >
//                 <ListItemIcon>
//                   <DeleteIcon color="error" />
//                 </ListItemIcon>
//                 Remove
//               </MenuItem>
//             </Menu>
//             <Popover
//               id={open ? "color-popover" : undefined}
//               open={open}
//               anchorEl={anchorEl}
//               onClose={handleColorMenuClose}
//               anchorOrigin={{
//                 vertical: "center",
//                 horizontal: "left",
//               }}
//               transformOrigin={{
//                 vertical: "center",
//                 horizontal: "right",
//               }}
//             >
//               <CompactPicker
//                 color={nodeDetails.color}
//                 onChangeComplete={handleColorChange}
//               />
//             </Popover>
//           </>
//         ) : null}
//       </Stack>
//     </div>
//   );
// });

// CustomContent.propTypes = {
//   /**
//    * Override or extend the styles applied to the component.
//    */
//   classes: PropTypes.object.isRequired,
//   /**
//    * className applied to the root element.
//    */
//   className: PropTypes.string,
//   /**
//    * The icon to display next to the tree node's label. Either a parent or end icon.
//    */
//   displayIcon: PropTypes.node,
//   /**
//    * The icon to display next to the tree node's label. Either an expansion or collapse icon.
//    */
//   expansionIcon: PropTypes.node,
//   /**
//    * The icon to display next to the tree node's label.
//    */
//   icon: PropTypes.node,
//   /**
//    * The tree node label.
//    */
//   label: PropTypes.node,
//   /**
//    * The id of the node.
//    */
//   nodeId: PropTypes.string.isRequired,
//   /**
//    * The color of the node
//    */
//   color: PropTypes.string,
// };

// const CustomTreeItem = (props) => (
//   <TreeItem ContentComponent={CustomContent} {...props} />
// );

// export const SchemaTreeView = ({
//   treeData,
//   setTreeData,
//   expandedIds,
//   setExpandedIds,
//   baseTreeDataIds,
//   editable = false,
//   canDeleteItems = true,
// }) => {
//   const renderTree = (nodes) => {
//     return nodes.map((el) => {
//       return (
//         <CustomTreeItem
//           key={el.id}
//           nodeId={el.id}
//           label={el.name}
//           onKeyDown={(e) => e.stopPropagation()}
//           ContentProps={{
//             treeData,
//             setTreeData,
//             color: el.color,
//             path: el.path,
//             setExpandedIds,
//             baseTreeDataIds,
//             editable: editable,
//             canDeleteItems: canDeleteItems,
//           }}
//         >
//           {Array.isArray(el.children) && el.children.length > 0
//             ? renderTree(el.children)
//             : null}
//         </CustomTreeItem>
//       );
//     });
//   };

//   if (!treeData) {
//     return <Typography>Loading...</Typography>;
//   } else {
//     return (
//       <TreeView
//         aria-label="controlled"
//         defaultCollapseIcon={<ExpandMoreIcon />}
//         defaultExpanded={expandedIds}
//         expanded={expandedIds}
//         defaultExpandIcon={<ChevronRightIcon />}
//       >
//         {treeData && renderTree(treeData)}
//       </TreeView>
//     );
//   }
// };

// const SchemaTreeViewWithButtons = ({
//   details,
//   treeData,
//   setTreeData,
//   editable = false,
//   canDeleteItems = true,
//   onUpdate,
// }) => {
//   const [baseTreeData, setBaseTreeData] = useState([...treeData]);
//   const [baseTreeDataIds, setBaseTreeDataIds] = useState(
//     new Set(extractIds(treeData))
//   ); // This is used to prevent deleting saved items but allows deleting new items.
//   const [expandedIds, setExpandedIds] = useState(extractIds(treeData));
//   const [metrics, setMetrics] = useState(countTreeItemsAndMaxDepth(treeData));

//   const [valid, setValid] = useState(true);
//   const [changed, setChanged] = useState(false);

//   const handleAddRoot = () => {
//     const updatedNodes = addRootItem(treeData);
//     setTreeData(updatedNodes);
//   };

//   const handleExpandAll = () => {
//     setExpandedIds(extractIds(treeData));
//   };

//   const handleCollapseAll = () => {
//     setExpandedIds([]);
//   };

//   const handleReset = () => {
//     console.log(baseTreeData, treeData);
//     setTreeData(baseTreeData);
//   };

//   const handleUpdate = async () => {
//     // Update resource and reset base tree data.
//     await onUpdate();
//     setBaseTreeData([...treeData]);
//   };

//   useEffect(() => {
//     setMetrics(countTreeItemsAndMaxDepth(treeData));
//   }, [setTreeData]);

//   useEffect(() => {
//     setValid(validateTreeData(treeData));
//   }, [treeData, baseTreeData]);

//   useEffect(() => {
//     const stateChanged =
//       JSON.stringify(baseTreeData) !== JSON.stringify(treeData);
//     console.log("baseTreeData", baseTreeData);
//     console.log("treeData", treeData);

//     setChanged(stateChanged);
//     console.log(`state changed - ${stateChanged}`);
//   }, [treeData, baseTreeData]);

//   const handleDownload = () => {
//     const browserLocale = navigator.language || navigator.userLanguage;

//     const json = JSON.stringify(treeData);
//     const blob = new Blob([json], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download =
//       new Date()
//         .toLocaleString(browserLocale, {
//           timeZone: "UTC",
//           year: "numeric",
//           month: "2-digit",
//           day: "2-digit",
//         })
//         .replace(/[,:\s]/g, "-") +
//       `_quickgraph_resource-${details.classification}_${details.sub_classification}_${details.name}.json`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   if (!treeData) {
//     return null;
//   }
//   return (
//     <Grid item xs={12} component={Paper} variant="outlined" p={2}>
//       <Stack direction="row" alignItems="center" justifyContent="space-between">
//         <Stack direction="row" spacing={2}>
//           <Tooltip
//             title="This is the maximum depth of the ontology"
//             arrow
//             placement="top"
//           >
//             <Chip
//               label={`Max Depth: ${metrics.maxDepth}`}
//               variant="outlined"
//               sx={{ cursor: "help" }}
//             />
//           </Tooltip>
//           <Tooltip
//             title="This is the number of items in the ontology"
//             arrow
//             placement="top"
//           >
//             <Chip
//               label={`Item Count: ${metrics.count}`}
//               variant="outlined"
//               sx={{ cursor: "help" }}
//             />
//           </Tooltip>
//         </Stack>
//         <Stack direction="row" spacing={2} justifyContent="right">
//           <Button
//             title="Click to download this resource"
//             startIcon={<DownloadIcon />}
//             size="small"
//             onClick={handleDownload}
//           >
//             Download
//           </Button>
//           <Divider orientation="vertical" flexItem />
//           <Button
//             disableElevation
//             color="primary"
//             size="small"
//             onClick={handleExpandAll}
//           >
//             Expand All
//           </Button>
//           <Button
//             disableElevation
//             color="primary"
//             size="small"
//             onClick={handleCollapseAll}
//             disabled={expandedIds.length === 0}
//           >
//             Collapse All
//           </Button>
//           {editable ? (
//             <>
//               <Button
//                 variant="contained"
//                 disableElevation
//                 color="primary"
//                 size="small"
//                 onClick={handleAddRoot}
//               >
//                 Add root node
//               </Button>
//               <Divider orientation="vertical" flexItem />
//               <Button
//                 variant="outlined"
//                 disableElevation
//                 color="primary"
//                 size="small"
//                 onClick={handleReset}
//                 disabled={!changed}
//               >
//                 Reset
//               </Button>
//               <Button
//                 size="small"
//                 variant="contained"
//                 onClick={handleUpdate}
//                 disabled={!valid || !changed}
//               >
//                 Update
//               </Button>
//             </>
//           ) : null}
//         </Stack>
//       </Stack>
//       <Box p="1rem 0rem">
//         <Divider flexItem />
//       </Box>
//       <Box sx={{ height: "calc(100vh - 409px)", overflowY: "auto" }}>
//         <SchemaTreeView
//           treeData={treeData}
//           setTreeData={setTreeData}
//           expandedIds={expandedIds}
//           setExpandedIds={setExpandedIds}
//           baseTreeDataIds={baseTreeDataIds}
//           editable={editable}
//           canDeleteItems={canDeleteItems}
//         />
//       </Box>
//     </Grid>
//   );
// };

// export default SchemaTreeViewWithButtons;

export default SchemaTreeViewWithButtons = () => <div>Awaiting Deps. Fix.</div>;
