import {
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import React from "react";
import { FlagFilter } from "../../../../shared/constants/api";

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const FlagFilterIntToName = Object.fromEntries(
  Object.entries(FlagFilter).map(([key, value]) => [value, key])
);

const Filters = ({
  searchValue,
  setSearchValue,
  handleSearch,
  handleResetSearch,
  sortDirection,
  handleSort,
  selectedFlags,
  setSelectedFlags,
  minAgreement,
  setMinAgreement,
  datasetItemId,
  setDatasetItemId,
}) => {
  const handleFlagChange = (event) => {
    const values = event.target.value;
    if (values.length === 0) {
      setSelectedFlags([FlagFilterIntToName[FlagFilter.everything]]);
      return;
    }

    if (
      values.includes(FlagFilterIntToName[FlagFilter.everything]) ||
      values.includes(FlagFilterIntToName[FlagFilter.no_flags])
    ) {
      setSelectedFlags([values[values.length - 1]]);
    } else {
      setSelectedFlags(values);
    }
  };

  const resetDisabled =
    searchValue === "" &&
    JSON.stringify(selectedFlags) ===
      JSON.stringify([FlagFilterIntToName[FlagFilter.everything]]) &&
    minAgreement === 0 &&
    datasetItemId === "";

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <TextField
        label="Sort"
        size="small"
        sx={{ flex: 1, minWidth: 180 }}
        select
        autoComplete="false"
        value={sortDirection}
        onChange={handleSort}
      >
        <MenuItem value={1} dense>
          IAA: Low to High
        </MenuItem>
        <MenuItem value={-1} dense>
          IAA: High to Low
        </MenuItem>
      </TextField>
      <Divider flexItem orientation="vertical" />
      <TextField
        id="search-term-textfield"
        type="text"
        fullWidth
        label="Search Term(s)"
        placeholder="Enter comma separated search terms..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        sx={{ flex: 1, minWidth: 200 }}
        size="small"
      />
      <TextField
        id="data-id-textfield"
        type="text"
        fullWidth
        label="Dataset Item Id"
        placeholder="Enter id..."
        value={datasetItemId}
        onChange={(e) => setDatasetItemId(e.target.value)}
        sx={{ flex: 1, minWidth: 200 }}
        size="small"
      />
      <FormControl fullWidth variant="outlined">
        <InputLabel htmlFor="flag-select" id="flag-select">
          Flag(s)
        </InputLabel>
        <Select
          labelId="flag-select"
          id="flag-select"
          multiple
          size="small"
          sx={{ flex: 1, minWidth: 140 }}
          label="Flag(s)"
          value={selectedFlags}
          onChange={handleFlagChange}
          renderValue={(selected) =>
            selected.map((val) => capitalize(val.replace("_", " "))).join(", ")
          }
        >
          {Object.keys(FlagFilter).map((name) => (
            <MenuItem
              key={`flag-${name}`}
              value={name}
              sx={{ textTransform: "capitalize" }}
            >
              {name.replace("_", " ")}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        type="number"
        label="Min Agreement"
        size="small"
        sx={{ flex: 1, minWidth: 160 }}
        value={minAgreement}
        onChange={(e) => setMinAgreement(parseInt(e.target.value))}
        min={0}
        max={100}
        placeholder={0}
        step={1}
        pattern="\d*"
      />
      <Stack direction="row" alignItems="center" spacing={1}>
        <Button
          variant="contained"
          size="small"
          title="Click to search"
          onClick={() => handleSearch(searchValue)}
          disabled={resetDisabled}
        >
          Apply
        </Button>
        <Button
          aria-label="reset filters"
          onClick={handleResetSearch}
          edge="end"
          size="small"
          disabled={resetDisabled}
        >
          Reset
        </Button>
      </Stack>
    </Stack>
  );
};

export default Filters;
