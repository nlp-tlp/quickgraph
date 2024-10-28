import { useEffect, useState, forwardRef, useContext } from "react";
// import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PropTypes from "prop-types";
// import { TreeItem, useTreeItem } from "@mui/x-tree-view/TreeItem";
import clsx from "clsx";
import {
  Typography,
  Box,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { extractIds } from "../../../shared/utils/treeView";
import { ProjectContext } from "../../../shared/context/ProjectContext";

// const EntityHierarchy = ({
//   expandedEntityIds: expandedIds,
//   setExpandedEntityIds: setExpandedIds,
//   open,
// }) => {
//   const theme = useTheme();
//   const { state, dispatch, handleApply } = useContext(ProjectContext);
//   const [treeData, setTreeData] = useState([]);

//   useEffect(() => {
//     if (state.ontology && state.ontology.entity) {
//       setTreeData(state.ontology.entity);
//     }
//   }, [state]);

//   const handleExpandAll = () => {
//     setExpandedIds(extractIds(treeData));
//   };

//   const handleCollapseAll = () => {
//     setExpandedIds([]);
//   };

//   const handleToggle = (event, nodeIds) => {
//     setExpandedIds(nodeIds);
//   };

//   const handleAnnotation = (nodeId) => {
//     if (state.entityAnnotationMode && 0 < state.selectedTokenIndexes.length) {
//       try {
//         const textId = state.selectedTextId;
//         const tokenIndexes = state.selectedTokenIndexes;

//         const start = tokenIndexes[0];
//         const end = tokenIndexes.at(-1);

//         const payload = {
//           project_id: state.projectId,
//           dataset_item_id: textId,
//           extra_dataset_item_ids: Object.keys(state.texts),
//           annotation_type: "entity",
//           suggested: false,
//           content: {
//             ontology_item_id: nodeId,
//             start: start,
//             end: end,
//             surface_form: state.texts[textId].tokens
//               .filter((t) => tokenIndexes.includes(t.index))
//               .map((t) => t.value)
//               .join(" "),
//           },
//         };
//         handleApply({ body: payload, params: { apply_all: false } });
//       } catch (error) {
//         console.log(
//           `(handleAnnotation) :: Failed to apply annotation - ${error}`
//         );
//       }
//     }
//   };

//   const renderTree = (nodes) => {
//     return (
//       <CustomTreeItem
//         key={nodes.id}
//         nodeId={nodes.id}
//         label={nodes.name}
//         sx={{
//           color: nodes.color,
//           textAlign: "left",
//         }}
//         ContentProps={{
//           nodeDisabled: !nodes.active,
//         }}
//       >
//         {Array.isArray(nodes.children)
//           ? nodes.children.map((node) => renderTree(node))
//           : null}
//       </CustomTreeItem>
//     );
//   };

//   const CustomContent = forwardRef(function CustomContent(props, ref) {
//     const {
//       classes,
//       className,
//       label,
//       nodeId,
//       nodeDisabled,
//       icon: iconProp,
//       expansionIcon,
//       displayIcon,
//     } = props;

//     const {
//       disabled,
//       expanded,
//       selected,
//       focused,
//       handleExpansion,
//       handleSelection,
//       preventSelection,
//     } = useTreeItem(nodeId);

//     const icon = iconProp || expansionIcon || displayIcon;

//     const handleMouseDown = (event) => {
//       preventSelection(event);
//     };

//     const handleExpansionClick = (event) => {
//       handleExpansion(event);
//     };

//     const handleSelectionClick = (event, nodeId) => {
//       handleSelection(event);
//       dispatch({ type: "SET_VALUE", payload: { activeEntityClass: nodeId } });
//       // dispatch(setActiveEntityClass(nodeId));
//       handleAnnotation(nodeId);
//     };

//     return (
//       // eslint-disable-next-line jsx-a11y/no-static-element-interactions
//       <div
//         className={clsx(className, classes.root, {
//           [classes.expanded]: expanded,
//           [classes.selected]: selected,
//           [classes.focused]: focused,
//           [classes.disabled]: disabled,
//         })}
//         onMouseDown={handleMouseDown}
//         ref={ref}
//         style={{
//           border: "1px solid",
//           borderRadius: "4px",
//           marginBottom: "4px",
//           padding: "4px",
//           wordWrap: "break-word",
//         }}
//       >
//         {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
//         <div onClick={handleExpansionClick} className={classes.iconContainer}>
//           {icon}
//         </div>
//         <Typography
//           onClick={(e) => !nodeDisabled && handleSelectionClick(e, nodeId)}
//           component="div"
//           className={classes.label}
//           sx={{
//             color: nodeDisabled && theme.palette.neutral.main,
//           }}
//           title={nodeDisabled ? "Disabled" : label}
//         >
//           {label}
//         </Typography>
//       </div>
//     );
//   });

//   CustomContent.propTypes = {
//     /**
//      * Override or extend the styles applied to the component.
//      */
//     classes: PropTypes.object.isRequired,
//     /**
//      * className applied to the root element.
//      */
//     className: PropTypes.string,
//     /**
//      * The icon to display next to the tree node's label. Either a parent or end icon.
//      */
//     displayIcon: PropTypes.node,
//     /**
//      * The icon to display next to the tree node's label. Either an expansion or collapse icon.
//      */
//     expansionIcon: PropTypes.node,
//     /**
//      * The icon to display next to the tree node's label.
//      */
//     icon: PropTypes.node,
//     /**
//      * The tree node label.
//      */
//     label: PropTypes.node,
//     /**
//      * The id of the node.
//      */
//     nodeId: PropTypes.string.isRequired,
//   };

//   const CustomTreeItem = (props) => (
//     <TreeItem
//       nodeId={props.nodeId}
//       ContentComponent={CustomContent}
//       {...props}
//     />
//   );

//   return (
//     <>
//       {state.projectLoading ? (
//         <Box
//           key="entity-hierarchy-loading-container"
//           p={2}
//           height="auto"
//           display="flex"
//           alignItems="center"
//           justifyContent="center"
//         >
//           <Stack
//             direction="row"
//             alignItems="center"
//             spacing={2}
//             justifyContent="center"
//             width="100%"
//           >
//             <CircularProgress size={14} />
//             <Typography>Loading Entity Hierarchy</Typography>
//           </Stack>
//         </Box>
//       ) : (
//         <>
//           <Box pt={1} pb={2}>
//             <Stack
//               direction="row"
//               spacing={2}
//               alignItems="center"
//               justifyContent="space-evenly"
//             >
//               <Button
//                 onClick={handleExpandAll}
//                 size="small"
//                 title="Click to expand entity hierarchy"
//                 variant="outlined"
//               >
//                 Expand All
//               </Button>
//               <Button
//                 onClick={handleCollapseAll}
//                 size="small"
//                 title="Click to collapse entity hierarchy"
//                 variant="outlined"
//               >
//                 Collapse All
//               </Button>
//             </Stack>
//           </Box>
//           <Box
//             pl={2}
//             pr={1}
//             sx={{
//               maxHeight: open ? "calc(100vh - 554px)" : "calc(100vh - 410px)",
//               overflowY: "auto",
//             }}
//           >
//             <TreeView
//               aria-label="controlled"
//               defaultCollapseIcon={<ExpandMoreIcon />}
//               defaultExpandIcon={<ChevronRightIcon />}
//               defaultExpanded={expandedIds}
//               expanded={expandedIds}
//               onNodeToggle={handleToggle}
//               sx={{
//                 flexGrow: 1,
//                 width: "100%",
//               }}
//             >
//               {state.ontology.entity.map((parent) => renderTree(parent))}
//             </TreeView>
//           </Box>
//         </>
//       )}
//     </>
//   );
// };

const EntityHierarchy = () => <div>Awaiting Deps. Fix.</div>;

export default EntityHierarchy;
