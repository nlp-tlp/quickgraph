import { useDispatch, useSelector } from "react-redux";
import history from "../utils/history";
import {
  selectFilters,
  setFilters,
  resetFilters,
  selectProject,
} from "../project/projectSlice";
import {
  setPage,
  setTextsIdle,
  setShowCluster,
  setActiveCluster,
} from "../../app/dataSlice";

import {
  Grid,
  TextField,
  Button,
  Select,
  Stack,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton,
} from "@mui/material";
import { grey } from "@mui/material/colors";

import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FilterListIcon from "@mui/icons-material/FilterList";

export const Filters = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);
  const project = useSelector(selectProject);

  const applyFilters = () => {
    dispatch(setPage(1));
    history.push(`/annotation/${project._id}/page=1`);
    dispatch(setTextsIdle());
  };

  const applyFilterReset = () => {
    dispatch(setShowCluster(false));
    dispatch(setActiveCluster(null));
    dispatch(resetFilters());
    dispatch(setPage(1));
    history.push(`/annotation/${project._id}/page=1`);
    dispatch(setTextsIdle());
  };

  const clusterFilterValue = Object.values(filters["cluster"].value)[0];

  if (!filters) {
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
      <Grid
        item
        xs={12}
        container
        justifyContent="center"
        alignItems="center"
        sx={{ p: 2 }}
        spacing={2}
        style={{ borderBottom: `1px solid ${grey[400]}` }}
      >
        <Grid item xs={3} sm={3} md={1} lg={2} xl={1}>
          <TextField
            id="outlined-basic"
            label="Text Search"
            variant="outlined"
            size="small"
            sx={{ bgcolor: "white" }}
            value={filters["search"].value}
            onChange={(e) =>
              dispatch(
                setFilters({
                  ...filters,
                  search: {
                    ...filters["search"],
                    value: e.target.value,
                  },
                })
              )
            }
          />
        </Grid>
        {/* Cluster specific filter */}
        {project.settings.performClustering && (
          <Grid item xs={2}>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="cluster-select-label">
                  {filters["cluster"].name}
                </InputLabel>
                <Select
                  labelId="cluster-select-label"
                  id="cluster-select"
                  label="Cluster"
                  title={filters["cluster"].title}
                  sx={{ bgcolor: "white"}}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  {Object.keys(filters["cluster"].options).map((clusterNo) => (
                    <MenuItem
                      style={{
                        textTransform:
                          filters["cluster"].options[clusterNo] === "all" &&
                          "capitalize",
                      }}
                      value={clusterNo}
                      onClick={(e) =>
                        dispatch(
                          setFilters({
                            ...filters,
                            cluster: {
                              ...filters["cluster"],
                              value: {
                                [clusterNo]:
                                  filters["cluster"].options[clusterNo],
                              },
                            },
                          })
                        )
                      }
                    >
                      {filters["cluster"].options[clusterNo].replace(
                        /\|/g,
                        " | "
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Grid>
        )}
        {Object.keys(filters)
          .filter(
            (key) =>
              filters[key].display && key !== "search" && key !== "cluster"
          )
          .map((key) => {
            const filter = filters[key];
            return (
              <Grid item xs={2} sm={2} md={2} lg={2} xl={1}>
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="select-label">{filter.name}</InputLabel>
                    <Select
                      labelId="select-label"
                      id="select"
                      label={filter.name}
                      title={filter.title}
                      size="small"
                      sx={{ bgcolor: "white" }}
                      style={{ textTransform: "capitalize" }}
                    >
                      {filter.options.map((option) => (
                        <MenuItem
                          style={{
                            textTransform: "capitalize",
                          }}
                          value={option}
                          onClick={(e) =>
                            dispatch(
                              setFilters({
                                ...filters,
                                [key]: {
                                  ...filters[key],
                                  value: option,
                                },
                              })
                            )
                          }
                        >
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>
            );
          })}

        <Grid item xs={2} sm={2} md={2} lg={2} xl={1}>
          <Stack
            direction="row"
            style={{ alignItems: "center", justifyContent: "center" }}
          >
            <IconButton
              size="small"
              variant="outlined"
              // disabled={!filterApplied}
              onClick={applyFilterReset}
              title="Click to reset filters"
            >
              <RestartAltIcon />
            </IconButton>
            <Button
              disableElevation
              size="small"
              variant="contained"
              onClick={applyFilters}
              startIcon={<FilterListIcon />}
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
