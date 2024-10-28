import { useEffect, useState } from "react";
import { MenuItem, Stack, TextField, IconButton, Tooltip } from "@mui/material";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

const Filter = ({ loading, data, filteredData, setFilteredData }) => {
  const [searchName, setSearchName] = useState("");
  const [taskFilter, setTaskFilter] = useState(null);
  const [sortType, setSortType] = useState("");
  const [showPmOnly, setShowPmOnly] = useState(null);
  const [createdBy, setCreatedBy] = useState("");

  useEffect(() => {
    const filterData = () => {
      let tempData = data;

      // Free text search the "name" field
      if (searchName) {
        tempData = tempData.filter((item) =>
          item.name.toLowerCase().includes(searchName.toLowerCase())
        );
      }

      // Select filter the "tasks"
      if (taskFilter) {
        tempData = tempData.filter(
          (item) =>
            (item.tasks.entity &&
              !item.tasks.relation &&
              taskFilter === "entity") ||
            (item.tasks.relation && taskFilter === "relation")
        );
      }

      if (showPmOnly !== null) {
        tempData = tempData.filter((item) => showPmOnly === item.user_is_pm);
      }

      // Select filter by the "created_by" field
      if (createdBy) {
        tempData = tempData.filter((item) => item.created_by === createdBy);
      }

      setFilteredData(tempData);
    };

    filterData();
  }, [data, searchName, taskFilter, showPmOnly, createdBy]);

  useEffect(() => {
    const sortData = () => {
      let tempData = [...filteredData]; // Create a shallow copy of filteredData

      tempData.sort((a, b) => {
        switch (sortType) {
          case "updated_asc":
            return new Date(a.updated_at) - new Date(b.updated_at);
          case "updated_desc":
            return new Date(b.updated_at) - new Date(a.updated_at);
          case "active_annotators_asc":
            return a.active_annotators.length - b.active_annotators.length;
          case "active_annotators_desc":
            return b.active_annotators.length - a.active_annotators.length;
          case "percentage_complete_asc":
            return (
              a.saved_items / a.total_items - b.saved_items / b.total_items
            );
          case "percentage_complete_desc":
            return (
              b.saved_items / b.total_items - a.saved_items / a.total_items
            );
          case "created_by_asc":
            return a.created_by.localeCompare(b.created_by);
          case "created_by_desc":
            return b.created_by.localeCompare(a.created_by);
          default:
            return 0;
        }
      });

      setFilteredData(tempData);
    };

    if (filteredData.length > 0) {
      sortData();
    }
  }, [sortType, filteredData]);

  const handleReset = () => {
    setSearchName("");
    setCreatedBy("");
    setSortType("");
    setShowPmOnly(null);
    setCreatedBy("");
    setTaskFilter("");
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
      spacing={2}
    >
      <TextField
        placeholder="Search projects by name or description..."
        size="small"
        sx={{ flex: 1, minWidth: 300 }}
        onChange={(e) => setSearchName(e.target.value)}
        value={searchName}
        disabled={loading}
      />
      <TextField
        label="Annotation Task(s)"
        size="small"
        select
        sx={{ flex: 1, maxWidth: 200 }}
        onChange={(e) => setTaskFilter(e.target.value)}
        value={taskFilter}
        disabled={loading}
      >
        <MenuItem value={null}>All Tasks</MenuItem>
        <MenuItem value="entity">Entity Only</MenuItem>
        <MenuItem value="relation">Entity and Relation</MenuItem>
      </TextField>
      <TextField
        label="Project Manager"
        size="small"
        select
        sx={{ flex: 1 }}
        onChange={(e) => setShowPmOnly(e.target.value)}
        value={showPmOnly}
        disabled={loading}
      >
        <MenuItem value={null}>Everything</MenuItem>
        <MenuItem value={true}>True</MenuItem>
        <MenuItem value={false}>False</MenuItem>
      </TextField>
      <TextField
        label="Created By"
        size="small"
        select
        sx={{ flex: 1 }}
        value={createdBy}
        onChange={(e) => setCreatedBy(e.target.value)}
        disabled={loading}
      >
        <MenuItem value="">Everything</MenuItem>
        {[...new Set(data.map((i) => i.created_by))].map((name) => (
          <MenuItem value={name}>{name}</MenuItem>
        ))}
      </TextField>
      <TextField
        value={sortType}
        onChange={(e) => setSortType(e.target.value)}
        select
        label="Sort"
        size="small"
        sx={{ flex: 1, maxWidth: 300 }}
        disabled={loading}
      >
        <MenuItem value="updated_asc">Last updated (oldest first)</MenuItem>
        <MenuItem value="updated_desc">Last updated (newest first)</MenuItem>
        <MenuItem value="active_annotators_asc">
          Active annotators (fewest first)
        </MenuItem>
        <MenuItem value="active_annotators_desc">
          Active annotators (most first)
        </MenuItem>
        <MenuItem value="percentage_complete_asc">
          Percentage complete (lowest first)
        </MenuItem>
        <MenuItem value="percentage_complete_desc">
          Percentage complete (highest first)
        </MenuItem>
        <MenuItem value="created_by_asc">Created by (A-Z)</MenuItem>
        <MenuItem value="created_by_desc">Created by (Z-A)</MenuItem>
      </TextField>
      <Tooltip title="Click to reset filters">
        <IconButton
          onClick={handleReset}
          disabled={
            !searchName &&
            !createdBy &&
            !sortType &&
            !showPmOnly !== null &&
            !taskFilter
          }
        >
          <FilterAltOffIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default Filter;
