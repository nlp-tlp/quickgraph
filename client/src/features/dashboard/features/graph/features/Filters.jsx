import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectProject } from "../../../../project/projectSlice";
import "../Graph.css";
import {
  fetchGraph,
  setAggregate,
  selectAggregate,
  selectFilteredOntology,
  selectGraphFilters,
  setFilters,
  selectGraphStatus,
} from "../graphSlice";
import { FilterSelectHierarchy } from "./FilterSelectHierarchy";
import InfoIcon from "@mui/icons-material/Info";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import { grey } from "@mui/material/colors";

export const Filters = ({ disabled }) => {
  const project = useSelector(selectProject);
  const dispatch = useDispatch();
  const filteredOntology = useSelector(selectFilteredOntology);
  const graphStatus = useSelector(selectGraphStatus);
  const filters = useSelector(selectGraphFilters);
  const aggregate = useSelector(selectAggregate);

  const [showWeakAnnotations, setShowWeakAnnotations] = useState(
    filters.showWeak
  );

  const [searchTouched, setSearchTouched] = useState(false); // Stops from triggering before user has touched field
  const [searchTerm, setSearchTerm] = useState("");

  const handleGraphAggregation = (aggregate) => {
    dispatch(setAggregate(aggregate));
    dispatch(fetchGraph({ projectId: project._id }));
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // console.log(searchTerm);
      if (searchTouched && searchTerm === "") {
        // console.log("RESETTING GRAPH!");
        dispatch(setFilters({ ...filters, searchTerm: "" }));
        dispatch(fetchGraph({ projectId: project._id }));
      } else if (searchTouched) {
        // console.log("FILTERING GRAPH WITH SEARCH!");
        dispatch(
          setFilters({
            ...filters,
            searchTerm: searchTerm,
          })
        );
        dispatch(
          fetchGraph({
            projectId: project._id,
            searchTerm: filters.searchTerm,
          })
        );
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    // Handles filters applied outside of search
    if (graphStatus === "succeeded") {
      // Only permit if a graph has been loaded
      dispatch(
        setFilters({
          ...filters,
          showWeak: showWeakAnnotations,
        })
      );
      dispatch(
        fetchGraph({
          projectId: project._id,
        })
      );
    }
  }, [showWeakAnnotations]);

  if (!project || !filteredOntology) {
    return <div>Loading...</div>;
  } else {
    return (
      <Card variant="outlined">
        <CardContent>
          <Grid item>
            <Grid item xs={12}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${grey[300]}`,
                  alignItems: "center",
                }}
              >
                <h5>Filters</h5>
                <Tooltip title="The aggregate knowledge graph only shows: documents meeting the required minimum annotations, and accepted (silver) annotations. The separated graph is currently limited to your own annotations.">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              </div>
            </Grid>
            <Grid item xs={12}>
              <Box m={1}>
                <SearchBar
                  setSearchTouched={setSearchTouched}
                  setSearchTerm={setSearchTerm}
                  disabled={disabled}
                />
              </Box>
            </Grid>
            <Grid xs={12}>
              <Box m={1} mt={3}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={aggregate}
                        onChange={() => handleGraphAggregation(!aggregate)}
                        disabled={disabled}
                      />
                    }
                    label="Aggregate Graph"
                  />
                </FormGroup>
              </Box>
            </Grid>
            <Grid xs={12}>
              <Box m={1} mt={3}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={showWeakAnnotations}
                        onChange={() =>
                          setShowWeakAnnotations(!showWeakAnnotations)
                        }
                        disabled={disabled}
                      />
                    }
                    label="Include Weak Annotations"
                  />
                </FormGroup>
              </Box>
            </Grid>
            <Grid xs={12}>
              <p style={{ margin: "0.25rem", fontWeight: "bold" }}>Entities</p>
              {disabled ? (
                <span style={{ margin: "0.25rem", color: grey[400] }}>
                  No entities created
                </span>
              ) : (
                <FilterSelectHierarchy
                  ontology={filteredOntology.filter((i) => i.isEntity)}
                  rootName={"Entities"}
                />
              )}
              <p style={{ margin: "0.25rem", fontWeight: "bold" }}>Relations</p>
              {disabled ? (
                <span style={{ margin: "0.25rem", color: grey[400] }}>
                  No relations created
                </span>
              ) : filteredOntology.filter((i) => !i.isEntity).length === 0 ? (
                <span
                  style={{
                    margin: "0.25rem",
                    fontSize: "0.8125rem",
                    color: grey[700],
                  }}
                >
                  No relations applied
                </span>
              ) : (
                <FilterSelectHierarchy
                  ontology={filteredOntology.filter((i) => !i.isEntity)}
                  rootName={"Relations"}
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }
};

const SearchBar = ({ setSearchTouched, setSearchTerm, disabled }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end" }}>
      <SearchIcon sx={{ color: "action.active", mr: 1, my: 0 }} />
      <TextField
        id="input-with-sx"
        label="Search"
        variant="standard"
        fullWidth
        size="small"
        onChange={(e) => {
          setSearchTouched(true);
          setSearchTerm(e.target.value);
        }}
        disabled={disabled}
      />
    </Box>
  );
};
