import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import TreeItem, { useTreeItem } from "@mui/lab/TreeItem";
// import TreeView from "@mui/lab/TreeView";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import PropTypes from "prop-types";
import * as React from "react";
import { getDescendantIds } from "../../../../../shared/utils/treeView";

// const CustomContent = React.forwardRef(function CustomContent(props, ref) {
//   const {
//     classes,
//     className,
//     label,
//     nodeId,
//     ontology,
//     filters,
//     setFilters,
//     icon: iconProp,
//     expansionIcon,
//     displayIcon,
//   } = props;

//   const {
//     disabled,
//     expanded,
//     selected,
//     focused,
//     handleExpansion,
//     handleSelection,
//     preventSelection,
//   } = useTreeItem(nodeId);

//   const icon = iconProp || expansionIcon || displayIcon;

//   const handleMouseDown = (event) => {
//     preventSelection(event);
//   };

//   const handleExpansionClick = (event) => {
//     handleExpansion(event);
//   };

//   const handleSelectionClick = (event, nodeId) => {
//     // Toggles item to be excluded from selection - this includes descendants
//     const items = [...filters.exclude_ontology_item_ids];
//     // Get descendants
//     const descendantIds = getDescendantIds(ontology, nodeId);
//     const index = items.indexOf(nodeId);

//     if (index === -1) {
//       // Item is not excluded, so add it and its descendants
//       const newItems = [...new Set([...items, ...[nodeId, ...descendantIds]])];
//       setFilters({ exclude_ontology_item_ids: newItems });
//       // setFilters((prevState) => ({
//       //   ...prevState,
//       //   exclude_ontology_item_ids: newItems,
//       // }));
//     } else {
//       // Item is already excluded, add it back in
//       setFilters({
//         exclude_ontology_item_ids: items.filter(
//           (i) => ![nodeId, ...descendantIds].includes(i)
//         ),
//       });
//       // setFilters((prevState) => ({
//       //   ...prevState,
//       //   exclude_ontology_item_ids: items.filter(
//       //     (i) => ![nodeId, ...descendantIds].includes(i)
//       //   ),
//       // }));
//     }
//   };

//   return (
//     // eslint-disable-next-line jsx-a11y/no-static-element-interactions
//     <div
//       className={clsx(className, classes.root, {
//         [classes.expanded]: expanded,
//         [classes.selected]: selected,
//         [classes.focused]: focused,
//         [classes.disabled]: disabled,
//       })}
//       onMouseDown={handleMouseDown}
//       ref={ref}
//       style={{ wordBreak: "break-word" }}
//     >
//       {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
//       <div onClick={handleExpansionClick} className={classes.iconContainer}>
//         {icon}
//       </div>
//       <Typography
//         component="div"
//         className={classes.label}
//         title={`${label} (id: ${nodeId})`}
//       >
//         {label}
//       </Typography>
//       <div onClick={(e) => handleSelectionClick(e, nodeId)}>
//         {filters.exclude_ontology_item_ids.includes(nodeId) ? (
//           <CheckBoxOutlineBlankIcon />
//         ) : (
//           <CheckBoxIcon />
//         )}
//       </div>
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
// };

// const CustomTreeItem = (props) => (
//   <TreeItem ContentComponent={CustomContent} {...props} />
// );

// export const FilterSelectHierarchy = ({ ontology, filters, setFilters }) => {
//   const renderTree = (nodes) => {
//     return (
//       <CustomTreeItem
//         key={nodes.id}
//         nodeId={nodes.id}
//         label={nodes.name}
//         style={{
//           color: nodes.color,
//         }}
//         ContentProps={{
//           ontology,
//           filters,
//           setFilters,
//         }}
//       >
//         {Array.isArray(nodes.children)
//           ? nodes.children.map((node) => renderTree(node))
//           : null}
//       </CustomTreeItem>
//     );
//   };

//   return (
//     <TreeView
//       aria-label="icon expansion"
//       defaultCollapseIcon={<ExpandMoreIcon />}
//       defaultExpandIcon={<ChevronRightIcon />}
//       sx={{
//         maxHeight: 120,
//         flexGrow: 1,
//         maxWidth: 400,
//         overflowY: "auto",
//       }}
//     >
//       {ontology.map((parent) => renderTree(parent))}
//     </TreeView>
//   );
// };

export const FilterSelectHierarchy = () => <div>Awaiting Deps. Fix.</div>;
