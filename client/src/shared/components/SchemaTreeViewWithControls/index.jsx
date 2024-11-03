import { Box } from "@mui/material";
import { TreeControls } from "./TreeControls";
import useTreeData from "./useTreeData";
import SchemaTreeView from "./SchemaTreeView";

const SchemaTreeViewWithControls = ({
  initialData = [],
  handleDataChange,
  handleDataUpdate,
  editable = true,
  isEntity = true,
  isBlueprint = true,
}) => {
  const {
    originalItems,
    items,
    expandedItems,
    expandAll,
    setExpandedItems,
    collapseAll,
    reset,
    update,
    updateNode,
    deleteNode,
    addNode,
    addRootNode,
    getItemId,
    getItemLabel,
  } = useTreeData(initialData, handleDataChange, handleDataUpdate);

  return (
    <Box width="100%">
      <TreeControls
        items={items}
        originalItems={originalItems}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onReset={reset}
        onUpdate={update}
        onAddRootNode={addRootNode}
        disabled={!editable}
        isEntity={isEntity}
      />
      <SchemaTreeView
        items={items}
        expandedItems={expandedItems}
        setExpandedItems={setExpandedItems}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        handleNodeUpdate={updateNode}
        handleNodeDelete={deleteNode}
        handleNodeAdd={addNode}
        disabled={!editable}
        isEntity={isEntity}
        isBlueprint={isBlueprint}
      />
    </Box>
  );
};

export default SchemaTreeViewWithControls;
