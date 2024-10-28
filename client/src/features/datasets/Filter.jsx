import { useEffect, useState } from "react";
import { MenuItem, Stack, TextField, IconButton, Tooltip } from "@mui/material";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

const Filter = ({ loading, data, filteredData, setFilteredData }) => {
  const [searchName, setSearchName] = useState("");
  const [searchInstances, setSearchInstances] = useState("");
  const [datasetType, setDatasetType] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [sortType, setSortType] = useState("");
  const [isBlueprint, setIsBlueprint] = useState("");

  useEffect(() => {
    const filterData = () => {
      let tempData = data;

      // Free text search the "name" field
      if (searchName) {
        tempData = tempData.filter((item) =>
          item.name.toLowerCase().includes(searchName.toLowerCase())
        );
      }

      // Free text search over the "instances" field
      if (searchInstances) {
        tempData = tempData.filter((item) => {
          return item.instances.some((instance) =>
            instance.toLowerCase().includes(searchInstances.toLowerCase())
          );
        });
      }

      // Select filter the "datasetType"
      if (datasetType) {
        tempData = tempData.filter(
          (item) =>
            (datasetType === "annotated" && item.is_annotated) ||
            (datasetType === "standard" && !item.is_annotated)
        );
      }

      // Select filter the "isBlueprint"
      if (isBlueprint !== "") {
        tempData = tempData.filter((item) => isBlueprint === item.is_blueprint);
      }

      // Select filter by the "created_by" field
      if (createdBy) {
        tempData = tempData.filter((item) => item.created_by === createdBy);
      }
      setFilteredData(tempData);
    };

    filterData();
  }, [data, searchName, searchInstances, datasetType, createdBy, isBlueprint]);

  useEffect(() => {
    const sortData = () => {
      let tempData = [...filteredData]; // Create a shallow copy of filteredData

      tempData.sort((a, b) => {
        switch (sortType) {
          case "updated_asc":
            return new Date(a.updated_at) - new Date(b.updated_at);
          case "updated_desc":
            return new Date(b.updated_at) - new Date(a.updated_at);
          case "size_asc":
            return a.size - b.size;
          case "size_desc":
            return b.size - a.size;
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
    setSearchInstances("");
    setDatasetType("");
    setCreatedBy("");
    setSortType("");
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
    >
      <TextField
        placeholder="Search datasets by name or description..."
        size="small"
        sx={{ flex: 1, minWidth: 300 }}
        onChange={(e) => setSearchName(e.target.value)}
        value={searchName}
        disabled={loading}
      />
      <TextField
        label="Dataset Type"
        size="small"
        select
        sx={{ flex: 1 }}
        value={datasetType}
        onChange={(e) => setDatasetType(e.target.value)}
        disabled={loading}
      >
        <MenuItem value="">Everything</MenuItem>
        <MenuItem value="standard">Standard</MenuItem>
        <MenuItem value="annotated">Annotated</MenuItem>
      </TextField>
      <TextField
        label="Blueprint"
        size="small"
        select
        sx={{ flex: 1 }}
        value={isBlueprint}
        onChange={(e) => setIsBlueprint(e.target.value)}
        disabled={loading}
      >
        <MenuItem value="">Everything</MenuItem>
        <MenuItem value={true}>Yes</MenuItem>
        <MenuItem value={false}>No</MenuItem>
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
        <MenuItem value="size_asc">Size (fewest first)</MenuItem>
        <MenuItem value="size_desc">Size (most first)</MenuItem>
        <MenuItem value="created_by_asc">Created by (A-Z)</MenuItem>
        <MenuItem value="created_by_desc">Created by (Z-A)</MenuItem>
      </TextField>
      <Tooltip title="Click to reset filters">
        <IconButton
          onClick={handleReset}
          disabled={
            !searchName &&
            !searchInstances &&
            !datasetType &&
            !createdBy &&
            !sortType
          }
        >
          <FilterAltOffIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default Filter;

//   {/* <TextField
//     placeholder="Search instances..."
//     size="small"
//     sx={{ flex: 1, minWidth: 300 }}
//     onChange={(e) => setSearchInstances(e.target.value)}
//     value={searchInstances}
//   /> */}
