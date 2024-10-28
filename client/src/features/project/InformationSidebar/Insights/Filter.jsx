import React, { useState, useEffect } from "react";
import { Box, Stack, TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import LayersIcon from "@mui/icons-material/Layers";
import TextFieldsIcon from "@mui/icons-material/TextFields";

const Filter = ({ data, setFilteredData }) => {
  const [selectedId, setSelectedId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let filtered = data;
    if (selectedId) {
      filtered = filtered.filter(
        (item) => item.ontology_item_id === selectedId
      );
    }
    if (searchTerm) {
      filtered = filtered
        .filter((item) =>
          item.instances.some((instance) =>
            instance.surface_form
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
        )
        .map((item) => ({
          ...item,
          instances: item.instances.filter((instance) =>
            instance.surface_form
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          ),
        }));
    }

    setFilteredData(filtered);
  }, [data, selectedId, searchTerm, setFilteredData]);

  const handleIdChange = (newId) => {
    setSelectedId(newId);
  };

  const handleSearchTermChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <Box p={2}>
      <Stack direction="column" spacing={2}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <LayersIcon sx={{ color: "action.active", mr: 1, my: 0.5 }} />
          <Autocomplete
            disablePortal
            id="entity-class-filter"
            options={data
              .sort((a, b) =>
                a.meta.name.localeCompare(b.meta.name, undefined, {
                  sensitivity: "base",
                })
              )
              .map((item) => ({
                label: item.meta.name,
                id: item.ontology_item_id,
                color: item.meta.color,
              }))}
            // getOptionLabel={(option) => option.meta.name}
            renderInput={(params) => (
              <TextField {...params} label="Filter by class" />
            )}
            renderOption={(props, option) => (
              <Box
                component="li"
                sx={{
                  "& > img": { mr: 2, flexShrink: 0 },
                  color: option.color,
                }}
                {...props}
              >
                {option.label}
              </Box>
            )}
            size="small"
            fullWidth
            autoHighlight
            value={selectedId}
            onChange={(event, newValue) => handleIdChange(newValue?.id)}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TextFieldsIcon sx={{ color: "action.active", mr: 1, my: 0.5 }} />
          <TextField
            label="Filter by surface form"
            type="text"
            id="name-input"
            value={searchTerm}
            onChange={handleSearchTermChange}
            fullWidth
            size="small"
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default Filter;
