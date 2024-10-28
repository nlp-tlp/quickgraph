import { useContext } from "react";
import {
  Grid,
  TextField,
  Button,
  Select,
  Stack,
  FormControl,
  InputLabel,
  MenuItem,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { ProjectContext } from "../../../shared/context/ProjectContext";

const Filters = () => {
  const [state, dispatch] = useContext(ProjectContext);
  const navigate = useNavigate();

  const handleFilterUpdate = (key, value) => {
    dispatch({
      type: "SET_VALUE",
      payload: { filters: { ...state.filters, [key]: value } },
    });
  };

  const filterComponents = {
    search: (
      <TextSearchFilter
        searchValue={state.filters.searchTerm}
        handleFilterUpdate={handleFilterUpdate}
      />
    ),
    referenceSearch: (
      <ReferenceTextSearchFilter
        searchValue={state.filters.referenceSearchTerm}
        handleFilterUpdate={handleFilterUpdate}
      />
    ),
    saved: (
      <SelectFilter
        name={"saved"}
        title={"Filter for saved states of texts"}
        defaultValue={state.filters.saved}
        options={["all", "yes", "no"]}
        handleFilterUpdate={handleFilterUpdate}
      />
    ),
    rank: (
      <SelectFilter
        name={"rank"}
        title={
          "Sort order of documents based on rank (1 high-low, -1 low-high)"
        }
        defaultValue={state.filters.ranked}
        options={[-1, 1]}
        handleFilterUpdate={handleFilterUpdate}
      />
    ),
    // candidates: (
    //   <SelectFilter
    //     name={"quality"}
    //     title={filters["quality"].title}
    //     options={filters["quality"].options}
    //     handleFilterUpdate={handleFilterUpdate}
    //   />
    // ),
  };

  const applyFilters = () => {
    dispatch({ type: "SET_PAGE", payload: 1 });
    navigate(`/project/${state.projectId}/page=1`);
  };

  const applyFilterReset = () => {
    dispatch({ type: "RESET_FILTERS" });
    dispatch({ type: "SET_PAGE", payload: 1 });
    navigate(`/project/${state.projectId}/page=1`);
  };

  if (!state.filters) {
    return (
      <Grid
        item
        xs={12}
        container
        justifyContent="center"
        alignItems="center"
        sx={{ p: 1 }}
      >
        <span>Loading filters...</span>
      </Grid>
    );
  } else {
    return (
      <Grid container p={2}>
        <Grid item container>
          <Stack direction="column" spacing={2} sx={{ width: "100%" }}>
            {filterComponents["search"]}
            {state.project.parallelCorpus &&
              filterComponents["referenceSearch"]}
            {/* {filterComponents["quality"]} */}
            {filterComponents["saved"]}
            {filterComponents["rank"]}
          </Stack>
        </Grid>

        <Grid
          item
          container
          direction="row"
          justifyContent="right"
          mt={2}
          alignItems="center"
        >
          <Stack
            direction="row"
            style={{ alignItems: "center", justifyContent: "center" }}
            spacing={1}
          >
            <Button
              disableElevation
              size="small"
              onClick={applyFilterReset}
              // disabled={!filterApplied}
              title="Click to reset filters"
            >
              Reset
            </Button>
            <Button
              disableElevation
              size="small"
              variant="contained"
              onClick={applyFilters}
              title="Click to apply filters"
            >
              Apply
            </Button>
          </Stack>
        </Grid>
      </Grid>
    );
  }
};

const TextSearchFilter = ({ searchValue, handleFilterUpdate }) => {
  return (
    <TextField
      id="outlined-basic"
      label="Text Search"
      title="Filter texts based on their content"
      variant="outlined"
      fullWidth
      size="small"
      sx={{ bgcolor: "white" }}
      value={searchValue}
      onChange={(e) => handleFilterUpdate("searchTerm", e.target.value)}
    />
  );
};

const ReferenceTextSearchFilter = ({ searchValue, handleFilterUpdate }) => {
  return (
    <TextField
      id="outlined-basic"
      label="Reference Text Search"
      title="Filter texts based on their reference texts content"
      variant="outlined"
      fullWidth
      size="small"
      sx={{ bgcolor: "white" }}
      value={searchValue}
      onChange={(e) =>
        handleFilterUpdate("referenceSearchTerm", e.target.value)
      }
    />
  );
};

const SelectFilter = ({
  name,
  title,
  defaultValue,
  options,
  handleFilterUpdate,
}) => {
  return (
    <FormControl fullWidth size="small">
      <InputLabel id="select-label" sx={{ textTransform: "capitalize" }}>
        {name}
      </InputLabel>
      <Select
        labelId="select-label"
        id="select"
        label={name}
        title={title}
        size="small"
        sx={{ bgcolor: "white" }}
        style={{ textTransform: "capitalize" }}
        value={defaultValue}
      >
        {options.map((option, index) => (
          <MenuItem
            key={`${name}-menu-option-${index}`}
            style={{
              textTransform: "capitalize",
            }}
            value={option}
            onClick={() => handleFilterUpdate(name, option)}
          >
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default Filters;
