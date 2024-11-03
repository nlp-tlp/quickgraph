import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Modal,
  Paper,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { DashboardContext } from "../context/dashboard-context";

const RelationConstraintsModal = ({ open, handleClose, data, onUpdate }) => {
  const { state } = useContext(DashboardContext);
  const [selectedDomain, setSelectedDomain] = useState([]);
  const [selectedRange, setSelectedRange] = useState([]);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { id: relationId, label: relationLabel } = data;
  const { domain, range } = data?.constraints ?? {};

  useEffect(() => {
    if (open && data?.constraints) {
      setSelectedDomain(data.constraints.domain || []);
      setSelectedRange(data.constraints.range || []);
    }
  }, [open, data]);

  const handleDomainToggle = (itemId) => {
    const currentIndex = selectedDomain.indexOf(itemId);
    const newChecked = [...selectedDomain];

    if (currentIndex === -1) {
      newChecked.push(itemId);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setSelectedDomain(newChecked);
  };

  const handleRangeToggle = (itemId) => {
    const currentIndex = selectedRange.indexOf(itemId);
    const newChecked = [...selectedRange];

    if (currentIndex === -1) {
      newChecked.push(itemId);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setSelectedRange(newChecked);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const updatedData = {
        constraints: {
          domain: selectedDomain,
          range: selectedRange,
        },
      };

      onUpdate(updatedData);
      handleClose();
    } catch (err) {
      setError("Failed to save constraints");
      console.error("Error saving constraints:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Flatten the entity hierarchy for the lists
  const flattenEntities = (items, parentPath = "") => {
    return items.reduce((acc, item) => {
      const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      acc.push({ ...item, fullPath: currentPath });
      if (item.children && item.children.length > 0) {
        acc.push(...flattenEntities(item.children, currentPath));
      }
      return acc;
    }, []);
  };
  const flattenedEntities = flattenEntities(state.ontology.entity);

  const ConstraintList = ({ title, selectedItems, onToggle }) => (
    <Paper
      sx={{ width: "50%", height: 400, overflow: "auto" }}
      elevation={0}
      variant="outlined"
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          position: "sticky",
          top: 0,
          bgcolor: "background.paper",
          zIndex: 1,
        }}
      >
        <Typography variant="body2" gutterBottom fontWeight={500}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedItems.length} types selected
        </Typography>
      </Box>
      <List dense>
        {flattenedEntities.map((item) => (
          <ListItem key={item.id}>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={selectedItems.indexOf(item.id) !== -1}
                onClick={() => onToggle(item.id)}
              />
            </ListItemIcon>
            <ListItemText
              primary={item.name}
              secondary={item.fullPath}
              secondaryTypographyProps={{
                style: { fontSize: "0.75rem", color: "text.secondary" },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      onClick={(e) => e.stopPropagation()}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          Relation constraints for {relationLabel}
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>About Domain and Range</AlertTitle>
          The domain represents valid entity types for the source (head) of the
          relation. The range represents valid entity types for the target
          (tail) of the relation.
        </Alert>

        <Box sx={{ display: "flex", gap: 2, my: 2 }}>
          <ConstraintList
            title="Domain"
            selectedItems={selectedDomain}
            onToggle={handleDomainToggle}
          />
          <ConstraintList
            title="Range"
            selectedItems={selectedRange}
            onToggle={handleRangeToggle}
          />
        </Box>

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}
        >
          <Button variant="outlined" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default RelationConstraintsModal;
