import _ from "lodash";

/**
 * Recursively extracts all ids from tree data into a single array.
 *
 * @param {Array} data - The tree data to extract ids from.
 * @returns {Array} The array of ids.
 */
export function extractIds(data) {
  let ids = [];
  for (let i = 0; i < data.length; i++) {
    ids.push(data[i].id);
    if (data[i].children.length > 0) {
      ids = ids.concat(extractIds(data[i].children));
    }
  }
  return ids;
}

/**
 * Updates the color of an item in the data array given its path.
 *
 * @param {Array} data - The array of items to update.
 * @param {Array} path - An array representing the path to the item to update.
 * @param {string} color - The new color for the item and all of its descendants.
 * @throws {Error} If the path is invalid.
 * @returns {Array} The updated data array.
 */
export function updateItemColor(data, path, color) {
  let currentItem = data;
  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (index < 0 || index >= currentItem.length) {
      throw new Error(`Invalid path: ${path.join(",")}`);
    }
    currentItem = currentItem[index];
    if (i === path.length - 1) {
      currentItem.color = color;
      updateDescendantsColor(currentItem, color);
    } else {
      currentItem = currentItem.children;
    }
  }
  return data;
}

/**
 * Updates the color of all descendants of the current item recursively.
 *
 * @param {Object} currentItem - The current item.
 * @param {string} color - The new color for the descendants.
 */
function updateDescendantsColor(currentItem, color) {
  if (currentItem.children) {
    for (let i = 0; i < currentItem.children.length; i++) {
      currentItem.children[i].color = color;
      updateDescendantsColor(currentItem.children[i], color);
    }
  }
}

/**
 * Updates the name of an item in the data array given its path.
 *
 * @param {Array} data - The array of items to update.
 * @param {Array} path - An array representing the path to the item to update.
 * @param {string} name - The new name for the item.
 * @throws {Error} If the path is invalid.
 * @returns {Array} The updated data array.
 */
export function updateItemName(data, path, name) {
  let currentItem = data;
  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (index < 0 || index >= currentItem.length) {
      throw new Error(`Invalid path: ${path.join(",")}`);
    }
    currentItem = currentItem[index];
    if (i === path.length - 1) {
      currentItem.name = name;
      const fullnameArray = currentItem.fullname.split("/");
      fullnameArray[fullnameArray.length - 1] = name;
      currentItem.fullname = fullnameArray.join("/");
    } else {
      currentItem = currentItem.children;
    }
  }
  return data;
}

/**
 * Updates the description of an item in the data array given its path.
 *
 * @param {Array} data - The array of items to update.
 * @param {Array} path - An array representing the path to the item to update.
 * @param {string} description - The new description for the item.
 * @throws {Error} If the path is invalid.
 * @returns {Array} The updated data array.
 */
export function updateItemDescription(data, path, description) {
  let currentItem = data;
  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (index < 0 || index >= currentItem.length) {
      throw new Error(`Invalid path: ${path.join(",")}`);
    }
    currentItem = currentItem[index];
    if (i === path.length - 1) {
      currentItem.description = description;
      const fullnameArray = currentItem.fullname.split("/");
      fullnameArray[fullnameArray.length - 1] = description;
      currentItem.fullname = fullnameArray.join("/");
    } else {
      currentItem = currentItem.children;
    }
  }
  return data;
}

/**
 * Generates a unique item ID string.
 *
 * @returns {string} The generated item ID string.
 *
 * @example
 *
 * const itemID = generateItemID();
 * console.log(itemID); // Output: "a1b2c3d4"
 */
function generateItemID() {
  const uuid = require("uuid");
  const itemID = uuid.v4().slice(0, 8);
  return itemID;
}

const generateNewItem = (path, color = "#ff0000") => ({
  id: generateItemID(),
  name: "",
  fullname: "",
  description: "",
  color: color,
  active: true,
  children: [],
  path: path,
});

/**
 * Adds a new root item to the data array.
 *
 * @param {Array} data - The array of items to add the new item to.
 * @returns {Array} The updated data array with the new item added.
 */
export function addRootItem(data) {
  data.push(generateNewItem([data.length]));
  return data;
}

/**
 * Adds a new child item to an existing item in the data array.
 *
 * @param {Array} data - The array of items to update.
 * @param {Array} path - An array representing the path to the parent item.
 * @param {Object} newItem - The new item to add.
 * @throws {Error} If the path is invalid or if the parent item is not an object with a `children` property.
 * @returns {Array} The updated data array.
 */
export function addChildItem(data, path) {
  let currentItem = data;
  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (index < 0 || index >= currentItem.length) {
      throw new Error(`Invalid path: ${path.join(",")}`);
    }
    currentItem = currentItem[index];
    if (!currentItem.hasOwnProperty("children")) {
      throw new Error(`Parent item does not have children: ${path.join(",")}`);
    }
    if (i === path.length - 1) {
      currentItem.children.push(
        generateNewItem(
          [...path, currentItem.children.length],
          currentItem.color
        )
      );
    } else {
      currentItem = currentItem.children;
    }
  }
  return data;
}

/**
 * Updates the paths of all nodes in the tree.
 *
 * @param {Array} data - The tree data.
 * @param {Array} parentPath - The path of the parent node.
 */
function updatePaths(data, parentPath = []) {
  for (let i = 0; i < data.length; i++) {
    const newPath = [...parentPath, i];
    data[i].path = newPath;
    if (data[i].children.length > 0) {
      updatePaths(data[i].children, newPath);
    }
  }
}

/**
 * Removes a node and its descendants from a tree given its path.
 * Updates the paths of the remaining nodes in the tree after the removal.
 *
 * @param {Array} data - The tree data.
 * @param {Array} path - The path of the node to remove.
 * @returns {Array} The updated tree data with the node removed.
 */
export function removeItem(data, path) {
  let currentItem = data;
  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (index < 0 || index >= currentItem.length) {
      throw new Error(`Invalid path: ${path.join(",")}`);
    }
    if (i === path.length - 1) {
      currentItem.splice(index, 1);
    } else {
      currentItem = currentItem[index].children;
    }
  }

  // update paths of remaining nodes
  updatePaths(data);

  return data;
}

/**
 * Gets the details of an item from the data array.
 *
 * @param {Array} data - The array of items to search.
 * @param {Array} path - An array representing the path to the item to retrieve.
 * @throws {Error} If the path is invalid.
 * @returns {Object} The item at the specified path.
 */
export function getItemDetails(data, path) {
  let currentItem = data;
  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (index < 0 || index >= currentItem.length) {
      throw new Error(`Invalid path: ${path.join(",")}`);
    }
    currentItem = currentItem[index];
    if (i === path.length - 1) {
      return currentItem;
    } else if (!currentItem.hasOwnProperty("children")) {
      throw new Error(`Invalid path: ${path.join(",")}`);
    } else {
      currentItem = currentItem.children;
    }
  }
}

/**
 * Toggles the 'active' key for an item and its descendants recursively, setting all their 'active' keys
 * to the same value as the parent.
 *
 * @param {Object} item - The item to toggle the 'active' key for.
 * @param {boolean} active - The new value of the 'active' key.
 */
export function toggleActive(item, active) {
  item.active = active;
  if (item.children) {
    for (const child of item.children) {
      toggleActive(child, active);
    }
  }
}

/**
 * Updates the tree by toggling the 'active' key for the item with the specified id and its descendants.
 *
 * @param {Array} tree - The tree data structure.
 * @param {string} id - The id of the item to toggle the 'active' key for.
 * @param {boolean} active - The new value of the 'active' key.
 * @returns {Array} The updated tree.
 */
export function updateTreeVisibility(tree, id, active) {
  const toggleItem = (items) => {
    for (const item of items) {
      if (item.id === id) {
        toggleActive(item, active);
        return;
      } else if (item.children) {
        toggleItem(item.children);
      }
    }
  };

  // Create a deep copy of the tree to avoid modifying the original tree
  const treeCopy = JSON.parse(JSON.stringify(tree));

  toggleItem(treeCopy);
  return treeCopy;
}

/**
 * Detects whether a change has been made to the tree data by comparing old data to new data.
 * Only compares keys in the old data.
 *
 * @param {Array} oldData - The old tree data.
 * @param {Array} newData - The new tree data.
 * @returns {Boolean} Whether a change has been made to the tree data.
 */
export function hasTreeDataChanged(oldData, newData) {
  // Sort data
  // function sortTreeData(treeData) {
  //   treeData.sort((a, b) => a.id.localeCompare(b.id));

  //   treeData.forEach((node) => {
  //     if (node.children) {
  //       sortTreeData(node.children);
  //     }
  //   });
  // }

  oldData = _.orderBy(oldData, ["id"], ["asc"]);
  newData = _.orderBy(newData, ["id"], ["asc"]);
  // return !_.isEqual(sortTreeData(oldData), sortTreeData(newData));
  return !_.isEqual(
    _.orderBy(oldData, ["id"], ["asc"]),
    _.orderBy(newData, ["id"], ["asc"])
  );

  // // If the old and new data are not arrays, assume they are different
  // if (!Array.isArray(oldData) || !Array.isArray(newData)) {
  //   return true;
  // }

  // // If the old and new data have different lengths, assume they are different
  // if (oldData.length !== newData.length) {
  //   return true;
  // }

  // // Compare each item in the old data to the corresponding item in the new data
  // for (let i = 0; i < oldData.length; i++) {
  //   const oldItem = oldData[i];
  //   const newItem = newData[i];

  //   // If the new item is missing or not an object, assume they are different
  //   if (!newItem || typeof newItem !== "object") {
  //     return true;
  //   }

  //   // Compare each key in the old item to the corresponding key in the new item
  //   for (const key in oldItem) {
  //     // Only compare keys that exist in the old data
  //     if (Object.prototype.hasOwnProperty.call(oldItem, key)) {
  //       if (oldItem[key] !== newItem[key]) {
  //         return true;
  //       }
  //     }
  //   }

  //   // Recursively compare child items
  //   if (oldItem.children && newItem.children) {
  //     if (hasTreeDataChanged(oldItem.children, newItem.children)) {
  //       return true;
  //     }
  //   } else if (oldItem.children || newItem.children) {
  //     // If one item has children and the other does not, assume they are different
  //     return true;
  //   }
  // }

  // // If no differences were found, assume the tree data has not changed
  // return false;
}

/**
 * Counts the number of items and the maximum depth of a tree.
 * @param {Array} data - The tree data to count.
 * @returns {Object} An object with the count of items and the maximum depth.
 */
export function countTreeItemsAndMaxDepth(data) {
  let count = 0;
  let maxDepth = 0;

  function traverse(node, depth) {
    count++;
    maxDepth = Math.max(maxDepth, depth);

    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  }

  for (const node of data) {
    traverse(node, 1);
  }

  return { count, maxDepth };
}

/**
 * Returns an array of all descendant IDs of a given ID in a tree data structure.
 * @param {Array} data - A tree data structure in the format [{ "id": string, "children": [] }].
 * @param {string} id - The ID of the node whose descendants we want to find.
 * @returns {Array} An array of all descendant IDs of the given ID.
 */
export function getDescendantIds(data, id) {
  let descendantIds = [];

  data.forEach((node) => {
    if (node.id === id) {
      // If the current node matches the given ID, add its children's IDs to the list of descendant IDs.
      node.children.forEach((child) => {
        descendantIds.push(child.id);
        descendantIds = descendantIds.concat(
          getDescendantIds(node.children, child.id) // Pass child.id instead of id
        );
      });
    } else {
      // If the current node doesn't match the given ID, recursively search its children.
      if (node.children.length > 0) {
        descendantIds = descendantIds.concat(
          getDescendantIds(node.children, id)
        );
      }
    }
  });

  return descendantIds;
}

/**
 * Flattens a tree data structure and returns only items that contain or equal a given substring.
 * @param {Array} data - The tree data structure to be flattened.
 * @param {string} substring - The string to match against the 'name' property of each item in the tree.
 * @returns {Array} - The items in the flattened tree that contain or equal the given substring.
 */
export function filterTreeBySubstring(data, substring) {
  const results = [];

  /**
   * Recursively traverses the tree, adding any nodes that contain the given substring (case-insensitive) to the 'results' array.
   * @param {Object} node - The current node being visited.
   */
  function traverse(node) {
    if (node.name.toLowerCase().includes(substring.toLowerCase())) {
      results.push(node);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  data.forEach(traverse);

  return results;
}

/**
 * Flattens a tree data structure into an array of elements.
 * Each element in the input tree should be an object with a "children" property
 * that is an array of child elements. The output array will contain all elements
 * in the input tree, flattened to a single level.
 *
 * @param {Object[]} data - The input tree data structure to flatten.
 * @returns {Object[]} - The flattened array of elements.
 */
export function flattenTree(data) {
  const flattened = [];

  // recursively add each element in the tree to the flattened array
  function addElement(element) {
    flattened.push(element);

    if (element.children && element.children.length > 0) {
      element.children.forEach(addElement);
    }
  }

  data.forEach(addElement);

  return flattened;
}

/**
 * Validates whether the "name" is not an empty string for each tree item.
 *
 * @param {Object[]} data - The tree data to validate.
 * @return {boolean} - Returns false if any "name" property is an empty string, true otherwise.
 */
export function validateTreeData(data) {
  return data.every((item) => {
    if (item.name.trim() === "") {
      return false;
    }

    // If the item has children, validate them recursively.
    if (item.children && item.children.length > 0) {
      return validateTreeData(item.children);
    }

    return true;
  });
}
