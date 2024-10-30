import { v4 as uuidv4 } from "uuid";

export function generateItemID() {
  const itemID = uuidv4().slice(0, 8);
  return itemID;
}

export const createDefaultNode = (parentNode) => {
  return {
    id: generateItemID(),
    name: "",
    description: "",
    children: [],
  };
};

export const findItemById = (items, id) => {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const validateTreeData = (nodes) => {
  let isValid = true;
  const validateNode = (node) => {
    if (!node.name || node.name.trim() === "") {
      isValid = false;
    }
    if (node.children) {
      node.children.forEach(validateNode);
    }
  };
  nodes.forEach(validateNode);
  return isValid;
};
