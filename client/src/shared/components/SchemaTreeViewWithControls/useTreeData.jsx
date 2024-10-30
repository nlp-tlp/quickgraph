import { useState, useEffect } from "react";
import { cloneDeep } from "lodash";
import { generateItemID } from "./utils";

const useTreeData = (initialData, onDataChange, handleDataUpdate) => {
  const [items, setItems] = useState(cloneDeep(initialData));
  const [originalItems, setOriginalItems] = useState(cloneDeep(initialData));
  const [expandedItems, setExpandedItems] = useState([]);

  useEffect(() => {
    const newData = cloneDeep(initialData);
    setItems(newData);
    setOriginalItems(newData);
  }, [initialData]);

  const getParentItemIds = (nodes) => {
    let ids = [];
    nodes.forEach((node) => {
      if (node.children?.length > 0) {
        ids.push(node.id);
        ids = [...ids, ...getParentItemIds(node.children)];
      }
    });
    return ids;
  };

  const expandAll = () => setExpandedItems(getParentItemIds(items));
  const collapseAll = () => setExpandedItems([]);
  const reset = () => setItems(cloneDeep(originalItems));

  const update = () => {
    const newOriginal = cloneDeep(items);
    setOriginalItems(newOriginal);
    onDataChange?.(newOriginal);
    handleDataUpdate?.(newOriginal);
  };

  const updateNode = (itemId, updates, updateDescendants = false) => {
    const updateTreeDataRecursively = (
      data,
      itemId,
      updates,
      updateDescendants
    ) => {
      return data.map((item) => {
        if (item.id === itemId || (updateDescendants && !itemId)) {
          const updatedItem = { ...item, ...updates };
          if (item.children && updateDescendants) {
            updatedItem.children = updateTreeDataRecursively(
              item.children,
              null,
              updates,
              true
            );
          }
          return updatedItem;
        }
        if (item.children) {
          return {
            ...item,
            children: updateTreeDataRecursively(
              item.children,
              itemId,
              updates,
              updateDescendants
            ),
          };
        }
        return item;
      });
    };

    setItems((items) =>
      updateTreeDataRecursively(
        cloneDeep(items),
        itemId,
        updates,
        updateDescendants
      )
    );
  };

  const deleteNode = (itemId) => {
    const deleteNodeRecursively = (data) => {
      return data.filter((item) => {
        if (item.id === itemId) return false;
        if (item.children) {
          item.children = deleteNodeRecursively(item.children);
        }
        return true;
      });
    };
    setItems((items) => deleteNodeRecursively(cloneDeep(items)));
  };

  const addNode = (parentId, newNode) => {
    const addChildRecursively = (data) => {
      return data.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children || []), newNode],
          };
        }
        if (item.children) {
          return {
            ...item,
            children: addChildRecursively(item.children),
          };
        }
        return item;
      });
    };
    setItems((items) => addChildRecursively(cloneDeep(items)));
  };

  const addRootNode = (nodeTemplate = {}) => {
    const newNode = {
      id: generateItemID(),
      name: "",
      description: "",
      color: "#efefef",
      disabled: false,
      ...nodeTemplate,
    };
    setItems((items) => [...items, newNode]);
  };

  const getItemLabel = (item) => item.name;
  const getItemId = (item) => item.id;

  return {
    originalItems,
    items,
    expandedItems,
    setExpandedItems,
    expandAll,
    collapseAll,
    reset,
    update,
    updateNode,
    deleteNode,
    addNode,
    addRootNode,
    getItemLabel,
    getItemId,
  };
};

export default useTreeData;
