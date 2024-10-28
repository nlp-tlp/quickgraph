import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button, TextField } from "@mui/material";
import { TreeView, TreeItem } from "@mui/lab";

function EditableTree(props) {
  const [data, setData] = useState(props.data || []);

  const handleLabelChange = (event, nodeId) => {
    setData((prevState) => {
      const node = findNode(prevState, nodeId);
      node.name = event.target.value;
      return [...prevState];
    });
  };

  const handleAddChild = (nodeId) => {
    setData((prevState) => {
      const node = findNode(prevState, nodeId);
      node.children.push({ id: generateId(), name: "", children: [] });
      return [...prevState];
    });
  };

  const handleDeleteNode = (nodeId) => {
    setData((prevState) => {
      const parent = findParent(prevState, nodeId);
      const index = parent.children.findIndex((node) => node.id === nodeId);
      parent.children.splice(index, 1);
      return [...prevState];
    });
  };

  const findNode = (data, nodeId) => {
    for (let node of data) {
      if (node.id === nodeId) {
        return node;
      } else {
        const childNode = findNode(node.children, nodeId);
        if (childNode) {
          return childNode;
        }
      }
    }
    return null;
  };

  const findParent = (data, nodeId) => {
    for (let node of data) {
      const childNode = node.children.find((child) => child.id === nodeId);
      if (childNode) {
        return node;
      } else {
        const parentNode = findParent(node.children, nodeId);
        if (parentNode) {
          return parentNode;
        }
      }
    }
    return null;
  };

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const renderTree = (nodes) => (
    <TreeItem
      key={nodes.id}
      nodeId={nodes.id}
      style={{ display: "flex", flexDirection: "column" }}
      label={
        <div style={{ flexGrow: 1 }}>
          <TextField
            value={nodes.name}
            onChange={(event) => handleLabelChange(event, nodes.id)}
            style={{ width: "100%" }}
          />
        </div>
      }
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button
          onClick={() => handleAddChild(nodes.id)}
          style={{ marginRight: 8 }}
        >
          Add Child
        </Button>
        <Button onClick={() => handleDeleteNode(nodes.id)}>Delete</Button>
      </div>
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </TreeItem>
  );

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      style={{ maxWidth: 400 }}
    >
      {renderTree(data)}
    </TreeView>
  );
}

export default EditableTree;
