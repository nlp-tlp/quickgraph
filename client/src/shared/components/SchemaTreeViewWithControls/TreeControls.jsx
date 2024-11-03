import React from "react";
import { isEqual } from "lodash";
import { validateTreeData } from "./utils";
import {
  Card,
  CardContent,
  Button,
  Typography,
  Stack,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandAllIcon from "@mui/icons-material/UnfoldMore";
import CollapseAllIcon from "@mui/icons-material/UnfoldLess";
import RestoreIcon from "@mui/icons-material/Restore";
import SaveIcon from "@mui/icons-material/Save";

export const TreeControls = ({
  items,
  originalItems,
  onExpandAll,
  onCollapseAll,
  onReset,
  onUpdate,
  onAddRootNode,
  disabled = false,
  isEntity = true,
}) => {
  const itemTypeName = isEntity ? "Entity" : "Relation";

  // Calculate max depth
  const getMaxDepth = (nodes, currentDepth = 0) => {
    let maxDepth = currentDepth;
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        const childDepth = getMaxDepth(node.children, currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    });
    return maxDepth;
  };

  // Calculate total number of items
  const getTotalItems = (nodes) => {
    let count = nodes.length;
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        count += getTotalItems(node.children);
      }
    });
    return count;
  };

  // Check if there are unsaved changes
  const hasChanges = !isEqual(items, originalItems);
  const isValid = validateTreeData(items);

  const handleDownload = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(items, null, 2)
    )}`;
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tree-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2">
                Max Depth: <strong>{getMaxDepth(items)}</strong>
              </Typography>
              <Typography variant="body2">
                Total {itemTypeName}s: <strong>{getTotalItems(items)}</strong>
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1}>
            {!disabled && (
              <Tooltip title={`Add Root ${itemTypeName}`}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onAddRootNode()}
                  color="success"
                >
                  Add Root {itemTypeName}
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Expand All">
              <Button
                size="small"
                variant="outlined"
                onClick={onExpandAll}
                startIcon={<ExpandAllIcon />}
              >
                Expand All
              </Button>
            </Tooltip>
            <Tooltip title="Collapse All">
              <Button
                size="small"
                variant="outlined"
                onClick={onCollapseAll}
                startIcon={<CollapseAllIcon />}
              >
                Collapse All
              </Button>
            </Tooltip>
            <Tooltip title="Download Tree Data">
              <Button
                size="small"
                variant="outlined"
                onClick={handleDownload}
                startIcon={<DownloadIcon />}
              >
                Download
              </Button>
            </Tooltip>
            {!disabled && (
              <Tooltip title="Reset to Original">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onReset}
                  disabled={!hasChanges}
                  startIcon={<RestoreIcon />}
                >
                  Reset
                </Button>
              </Tooltip>
            )}
            {!disabled && (
              <Tooltip
                title={
                  !isValid
                    ? "Fix empty node names before updating"
                    : "Save Changes"
                }
              >
                <span>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={onUpdate}
                    disabled={!hasChanges || !isValid}
                    startIcon={<SaveIcon />}
                  >
                    Update
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
