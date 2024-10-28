import { useContext, useEffect, useState } from "react";
import {
  Stack,
  TextField,
  Tooltip,
  Box,
  MenuItem,
  CircularProgress,
  Typography,
} from "@mui/material";
import HierarchyFilters from "./HierarchicalFilters";
import { isEquivalent } from "../../../../../shared/utils/dashboard";
import { DashboardContext } from "../../../../../shared/context/dashboard-context";
import { alpha } from "@mui/material";
import {
  GraphContext,
  initialState,
} from "../../../../../shared/context/graph-context";
import { useParams } from "react-router-dom";
import { LoadingButton } from "@mui/lab";

const Filter = () => {
  const { projectId } = useParams();
  const { state, dispatch, fetchGraph } = useContext(GraphContext);
  const { state: dashboardState } = useContext(DashboardContext);
  const filtersNotChanged = isEquivalent(initialState.filters, state.filters);
  const [resetFilters, setResetFilters] = useState(false);

  const handleGraphReset = () => {
    dispatch({ type: "RESET_FILTERS" });
    setResetFilters(true);
  };

  useEffect(() => {
    if (resetFilters) {
      fetchGraph({ projectId: projectId, stateToToggle: "resetting" });
      // After fetching the graph, set 'resetFilters' back to false
      setResetFilters(false);
    }
  }, [resetFilters]);

  const handleFilter = () => {
    fetchGraph({ projectId: projectId, stateToToggle: "updating" });
  };

  const setFilters = (payload) => {
    dispatch({ type: "SET_FILTERS", payload: payload });
  };

  return (
    <>
      <Stack direction="column" alignItems="left" spacing={2} p={2}>
        <TextField
          title="Search graph via entity surface form"
          id="graph-filter-search-term-textfield"
          label="Entity search..."
          size="small"
          value={state.filters.search_term}
          onChange={(e) => setFilters({ search_term: e.target.value })}
        />
        <TextField
          select
          value={state.filters.username}
          onChange={(e) => setFilters({ username: e.target.value })}
          size="small"
          label="Graph Type"
        >
          <Box p={1}>
            <Typography variant="caption">Group Graph</Typography>
          </Box>
          <MenuItem value="group">Group</MenuItem>
          <Box p={1}>
            <Typography variant="caption">Annotator Graph</Typography>
          </Box>
          {dashboardState?.annotators
            .filter((a) => a.state === "accepted")
            .map((a) => (
              <MenuItem value={a.username}>{a.username}</MenuItem>
            ))}
        </TextField>
        <Tooltip
          title="Filter graph on annotation label quality"
          placement="left"
        >
          <TextField
            select
            fullWidth
            labelId="quality-select-small"
            id="quality-select-small"
            value={state.filters.quality}
            label="Quality"
            onChange={(e) => setFilters({ quality: e.target.value })}
            size="small"
          >
            <MenuItem value={0}>Weak (Suggested)</MenuItem>
            <MenuItem value={1}>Silver (Accepted)</MenuItem>
            <MenuItem value={2}>Everything</MenuItem>
          </TextField>
        </Tooltip>
        <Tooltip
          title="Select to aggregate graph data or show all individual dataset item annotations"
          placement="left"
        >
          <TextField
            fullWidth
            select
            labelId="aggregate-graph-select-small"
            id="aggregate-select-small"
            value={state.filters.aggregate}
            label="Aggregate Graph"
            onChange={(e) => setFilters({ aggregate: e.target.value })}
            size="small"
          >
            <MenuItem value={false}>No Aggregation</MenuItem>
            <MenuItem value={true}>Aggregate</MenuItem>
          </TextField>
        </Tooltip>
        <Tooltip
          title="Select to toggle orphan (disconnected) entities in the graph"
          placement="left"
        >
          <TextField
            fullWidth
            select
            labelId="orphans-select-small"
            id="orphans-select-small"
            value={state.filters.show_orphans}
            label="Include Orphans"
            onChange={(e) => setFilters({ show_orphans: e.target.value })}
            size="small"
          >
            <MenuItem value={false}>No</MenuItem>
            <MenuItem value={true}>Yes</MenuItem>
          </TextField>
        </Tooltip>
        <Tooltip
          title="Specify the number of nodes to be returned in the graph"
          placement="left"
        >
          <TextField
            fullWidth
            type="number"
            labelId="node-limit-textfield"
            id="node-limit-textfield"
            value={state.filters.node_limit}
            label="Node Limit"
            onChange={(e) => setFilters({ node_limit: e.target.value })}
            size="small"
          />
        </Tooltip>
        {!dashboardState.ontology &&
        !state.filters.exclude_ontology_item_ids ? (
          <Box display="flex" alignItems="center" justifyContent="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={12} />
              <Typography>Loading hiearchy filter(s)</Typography>
            </Stack>
          </Box>
        ) : (
          <HierarchyFilters
            ontologies={dashboardState.ontology}
            filters={state.filters}
            setFilters={setFilters}
          />
        )}
      </Stack>
      <Box
        p={2}
        sx={{
          bgcolor: alpha("#f3e5f5", 0.25),
        }}
      >
        <Stack direction="row" justifyContent="right" spacing={2}>
          <LoadingButton
            loading={state.resetting}
            color="primary"
            variant="outlined"
            onClick={handleGraphReset}
            title="Click to reset graph"
            size="small"
            disabled={filtersNotChanged}
            sx={{
              textDecoration: "none",
              bgcolor: "white",
            }}
            disableElevation
          >
            Reset
          </LoadingButton>
          <LoadingButton
            variant="contained"
            title="Click to filter graph"
            size="small"
            loading={state.updating}
            color="primary"
            onClick={handleFilter}
            disabled={filtersNotChanged}
          >
            Apply
          </LoadingButton>
        </Stack>
      </Box>
    </>
  );
};

export default Filter;
