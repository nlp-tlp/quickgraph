import { useEffect, useState } from "react";
import { MenuItem, Stack, TextField, IconButton, Tooltip } from "@mui/material";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

const Filter = ({ loading, data = [], filteredData = [], setFilteredData }) => {
  const [searchName, setSearchName] = useState("");
  const [searchInstances, setSearchInstances] = useState("");
  const [classification, setClassification] = useState("");
  const [subClassification, setSubClassification] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [sortType, setSortType] = useState("");

  useEffect(() => {
    const filterData = () => {
      // Return early if data is null/undefined
      if (!Array.isArray(data)) {
        setFilteredData([]);
        return;
      }

      let tempData = [...data];

      // Free text search the "name" field
      if (searchName) {
        tempData = tempData.filter((item) =>
          (item?.name || "").toLowerCase().includes(searchName.toLowerCase())
        );
      }

      // Free text search over the "instances" field
      if (searchInstances) {
        tempData = tempData.filter((item) => {
          return (
            Array.isArray(item?.instances) &&
            item.instances.some((instance) =>
              (instance || "")
                .toLowerCase()
                .includes(searchInstances.toLowerCase())
            )
          );
        });
      }

      // Select filter the "classification" and "sub_classification" field
      if (classification) {
        tempData = tempData.filter(
          (item) => item?.classification === classification
        );
      }

      if (subClassification) {
        tempData = tempData.filter(
          (item) => item?.sub_classification === subClassification
        );
      }

      // Select filter by the "created_by" field
      if (createdBy) {
        tempData = tempData.filter((item) => item?.created_by === createdBy);
      }

      setFilteredData(tempData);
    };

    filterData();
  }, [
    data,
    searchName,
    searchInstances,
    classification,
    subClassification,
    createdBy,
    setFilteredData,
  ]);

  useEffect(() => {
    const sortData = () => {
      // Return early if filteredData is not an array or empty
      if (!Array.isArray(filteredData) || filteredData.length === 0) {
        return;
      }

      let tempData = [...filteredData];

      tempData.sort((a, b) => {
        switch (sortType) {
          case "updated_asc":
            return new Date(a?.updated_at || 0) - new Date(b?.updated_at || 0);
          case "updated_desc":
            return new Date(b?.updated_at || 0) - new Date(a?.updated_at || 0);
          case "size_asc":
            return (a?.size || 0) - (b?.size || 0);
          case "size_desc":
            return (b?.size || 0) - (a?.size || 0);
          case "created_by_asc":
            return (a?.created_by || "").localeCompare(b?.created_by || "");
          case "created_by_desc":
            return (b?.created_by || "").localeCompare(a?.created_by || "");
          default:
            return 0;
        }
      });

      setFilteredData(tempData);
    };

    if (sortType) {
      sortData();
    }
  }, [sortType, filteredData, setFilteredData]);

  const handleReset = () => {
    setSearchName("");
    setSearchInstances("");
    setClassification("");
    setSubClassification("");
    setCreatedBy("");
    setSortType("");
  };

  // Get unique creators with null check
  const uniqueCreators = Array.isArray(data)
    ? [...new Set(data.map((i) => i?.created_by).filter(Boolean))]
    : [];

  const isDataEmpty = !Array.isArray(data) || data.length === 0;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
    >
      <TextField
        placeholder={
          isDataEmpty
            ? "No data available"
            : "Search resources by name or description..."
        }
        size="small"
        sx={{ flex: 1, minWidth: 300 }}
        onChange={(e) => setSearchName(e.target.value)}
        value={searchName}
        disabled={loading || isDataEmpty}
      />

      <TextField
        label="Resource Type"
        size="small"
        select
        sx={{ flex: 1 }}
        value={classification}
        onChange={(e) => setClassification(e.target.value)}
        disabled={loading || isDataEmpty}
      >
        <MenuItem value="">Everything</MenuItem>
        <MenuItem value="ontology">Ontology</MenuItem>
        <MenuItem disabled>Preannotation</MenuItem>
        <MenuItem disabled>Constraints</MenuItem>
      </TextField>

      <TextField
        label="Resource Sub-Type"
        size="small"
        select
        sx={{ flex: 1 }}
        value={subClassification}
        onChange={(e) => setSubClassification(e.target.value)}
        disabled={loading || isDataEmpty}
      >
        <MenuItem value="">Everything</MenuItem>
        <MenuItem value="entity">Entity</MenuItem>
        <MenuItem value="relation">Relation</MenuItem>
      </TextField>

      <TextField
        label="Created By"
        size="small"
        select
        sx={{ flex: 1 }}
        value={createdBy}
        onChange={(e) => setCreatedBy(e.target.value)}
        disabled={loading || isDataEmpty}
      >
        <MenuItem value="">Everything</MenuItem>
        {uniqueCreators.map((name) => (
          <MenuItem key={name} value={name}>
            {name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        value={sortType}
        onChange={(e) => setSortType(e.target.value)}
        select
        label="Sort"
        size="small"
        sx={{ flex: 1, maxWidth: 300 }}
        disabled={loading || isDataEmpty}
      >
        <MenuItem value="updated_asc">Last updated (oldest first)</MenuItem>
        <MenuItem value="updated_desc">Last updated (newest first)</MenuItem>
        <MenuItem value="size_asc">Size (fewest first)</MenuItem>
        <MenuItem value="size_desc">Size (most first)</MenuItem>
        <MenuItem value="created_by_asc">Created by (A-Z)</MenuItem>
        <MenuItem value="created_by_desc">Created by (Z-A)</MenuItem>
      </TextField>

      <Tooltip title="Click to reset filters">
        <span>
          <IconButton
            onClick={handleReset}
            disabled={
              loading ||
              isDataEmpty ||
              (!searchName &&
                !searchInstances &&
                !classification &&
                !subClassification &&
                !createdBy &&
                !sortType)
            }
          >
            <FilterAltOffIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
};

export default Filter;
