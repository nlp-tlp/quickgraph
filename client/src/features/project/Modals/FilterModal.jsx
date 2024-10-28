import { useState, useEffect, useContext } from "react";
import {
  Modal,
  Paper,
  Typography,
  Box,
  TextField,
  Divider,
  Stack,
  Button,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ProjectContext } from "../../../shared/context/ProjectContext";
import {
  useNavigate,
  useSearchParams,
  createSearchParams,
} from "react-router-dom";
import {
  SaveStateFilters,
  QualityFilter,
  RelationsFilter,
  FlagFilter,
} from "../../../shared/constants/api";
import HelpIcon from "@mui/icons-material/Help";
import { alpha } from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
};

const defaultFilters = {
  searchValue: "",
  quality: QualityFilter.everything,
  saved: SaveStateFilters.everything,
  relations: RelationsFilter.everything,
  flag: FlagFilter.everything,
  datasetItemIds: "",
};

const FilterModal = () => {
  const { state, dispatch } = useContext(ProjectContext);
  const navigate = useNavigate();
  let [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(getInitialFilters());
  const [filtersChanged, setFiltersChanged] = useState(false);

  function getInitialFilters() {
    return {
      searchValue: searchParams.get("searchterm") || defaultFilters.searchValue,
      datasetItemIds:
        searchParams.get("dataset_item_ids") || defaultFilters.datasetItemIds,
      saved: searchParams.get("saved") || defaultFilters.saved,
      quality: searchParams.get("quality") || defaultFilters.quality,
      relations: searchParams.get("relations") || defaultFilters.relations,
      flag: searchParams.get("flag") || defaultFilters.flag,
    };
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "f") {
        event.preventDefault();
        dispatch({ type: "SET_VALUE", payload: { showFilterModal: true } });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setFiltersChanged(
      filters.searchValue !== defaultFilters.searchValue ||
        filters.datasetItemIds !== defaultFilters.datasetItemIds ||
        parseInt(filters.saved) !== parseInt(defaultFilters.saved) ||
        parseInt(filters.quality) !== parseInt(defaultFilters.quality) ||
        parseInt(filters.relations) !== parseInt(defaultFilters.relations) ||
        parseInt(filters.flag) !== parseInt(defaultFilters.flag)
    );
  }, [filters]);

  const applyFilters = () => {
    searchParams.set("quality", filters.quality);
    searchParams.set("saved", filters.saved);
    searchParams.set("searchterm", filters.searchValue);
    searchParams.set("dataset_item_ids", filters.datasetItemIds);
    searchParams.set("relations", filters.relations);
    searchParams.set("flag", filters.flag);
    searchParams.set("page", 1);
    setSearchParams(searchParams);
    navigate({
      pathName: `/annotation/${state.projectId}`,
      search: `?${createSearchParams(searchParams)}`,
    });

    handleClose();
  };

  const handleClose = () => {
    setFilters({
      searchValue: searchParams.get("searchterm") || "",
      datasetItemIds: searchParams.get("dataset_item_ids") || "",
      saved: searchParams.get("saved") || SaveStateFilters.everything,
      quality: searchParams.get("quality") || QualityFilter.everything,
      relations: searchParams.get("relations") || RelationsFilter.everything,
      flag: searchParams.get("flag") || FlagFilter.everything,
    });
    dispatch({ type: "SET_VALUE", payload: { showFilterModal: false } });
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <Modal open={state.showFilterModal} onClose={handleClose}>
      <Box sx={style} as={Paper} variant="outlined">
        <Box p="1rem 2rem">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="column">
              <Typography variant="h6">Filters</Typography>
              <Typography variant="caption">
                Filter project dataset for items with the following attributes
                or content
              </Typography>
            </Stack>
            <Chip
              label="esc"
              sx={{ fontWeight: 700, fontSize: 12 }}
              onClick={handleClose}
              variant="outlined"
              clickable
              color="primary"
            />
          </Stack>
        </Box>
        <Box>
          <Divider flexItem />
        </Box>
        <Box sx={{ maxHeight: 540, overflowY: "auto" }} p="1rem 2rem">
          <Grid item xs={12} container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Stack direction="column">
                <Stack direction="row" alignItems="center">
                  <Typography fontSize={16} fontWeight={500}>
                    Text Search
                  </Typography>
                  <Tooltip
                    title='Keep in mind that this
                    filter matches whole tokens in a case-insensitive manner. When
                    using multiple terms, they will be combined using the "AND"
                    logic.'
                  >
                    <HelpIcon
                      sx={{ fontSize: 16, ml: 1, cursor: "help" }}
                      color="neutral"
                    />
                  </Tooltip>
                </Stack>
                <Typography variant="caption">
                  Refine your search with specific text.
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={8} xl={8}>
              <TextField
                required
                id="annotation-filter-text-search-textfield"
                type="text"
                margin="normal"
                placeholder={"Enter comma separated search term(s)"}
                fullWidth
                value={filters.searchValue}
                onChange={(e) =>
                  setFilters((prevState) => ({
                    ...prevState,
                    searchValue: e.target.value,
                  }))
                }
                autoComplete="false"
              />
            </Grid>
          </Grid>
          <Grid item xs={12} container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Stack direction="column">
                <Typography fontSize={16} fontWeight={500}>
                  Saved
                </Typography>
                <Typography variant="caption">
                  Filter for saved state on dataset items
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={8} xl={8}>
              <TextField
                required
                id="annotation-filter-saved-textfield"
                type="text"
                margin="normal"
                fullWidth
                select
                value={filters.saved}
                onChange={(e) =>
                  setFilters((prevState) => ({
                    ...prevState,
                    saved: e.target.value,
                  }))
                }
                sx={{ textTransform: "capitalize" }}
              >
                {Object.keys(SaveStateFilters).map((option, index) => (
                  <MenuItem
                    key={`saved-menu-option-${index}`}
                    style={{
                      textTransform: "capitalize",
                    }}
                    value={index}
                  >
                    {option.replace("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Grid item xs={12} container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Stack direction="column">
                <Typography fontSize={16} fontWeight={500}>
                  Flag(s)
                </Typography>
                <Typography variant="caption">
                  Filter for flagged dataset items
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={8} xl={8}>
              <TextField
                required
                id="annotation-filter-flags-textfield"
                type="text"
                margin="normal"
                fullWidth
                select
                value={filters.flag}
                onChange={(e) =>
                  setFilters((prevState) => ({
                    ...prevState,
                    flag: e.target.value,
                  }))
                }
                sx={{ textTransform: "capitalize" }}
              >
                {Object.keys(FlagFilter).map((option, index) => (
                  <MenuItem
                    key={`flags-menu-option-${index}`}
                    style={{
                      textTransform: "capitalize",
                    }}
                    value={index}
                  >
                    {option.replace("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Grid item xs={12} container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Stack direction="column">
                <Typography fontSize={16} fontWeight={500}>
                  Quality
                </Typography>
                <Typography variant="caption">
                  Filter for label quality on dataset items
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={8} xl={8}>
              <TextField
                required
                id="annotation-filter-quality-textfield"
                type="text"
                margin="normal"
                fullWidth
                select
                value={filters.quality}
                onChange={(e) =>
                  setFilters((prevState) => ({
                    ...prevState,
                    quality: e.target.value,
                  }))
                }
                sx={{ textTransform: "capitalize" }}
              >
                {Object.keys(QualityFilter).map((option, index) => (
                  <MenuItem
                    key={`quality-menu-option-${index}`}
                    style={{
                      textTransform: "capitalize",
                    }}
                    value={index}
                  >
                    {option.replace("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          {state.tasks.relation ? (
            <Grid item xs={12} container alignItems="center" spacing={2}>
              <Grid item xs={4}>
                <Stack direction="column">
                  <Typography fontSize={16} fontWeight={500}>
                    Relation(s)
                  </Typography>
                  <Typography variant="caption">
                    Filter for relations on dataset items
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={8} xl={8}>
                <TextField
                  required
                  id="annotation-filter-relations-textfield"
                  type="text"
                  margin="normal"
                  fullWidth
                  select
                  value={filters.relations}
                  onChange={(e) =>
                    setFilters((prevState) => ({
                      ...prevState,
                      relations: e.target.value,
                    }))
                  }
                  sx={{ textTransform: "capitalize" }}
                >
                  {Object.keys(RelationsFilter).map((option, index) => (
                    <MenuItem
                      key={`relation-menu-option-${index}`}
                      style={{
                        textTransform: "capitalize",
                      }}
                      value={index}
                    >
                      {option.replace("_", " ")}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          ) : null}
          <Grid item xs={12} container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Stack direction="column">
                <Stack direction="row" alignItems="center">
                  <Typography fontSize={16} fontWeight={500}>
                    Dataset Item Id(s)
                  </Typography>
                  <Tooltip title="Find specific dataset items by entering one or more dataset item ids.">
                    <HelpIcon
                      sx={{ fontSize: 16, ml: 1, cursor: "help" }}
                      color="neutral"
                    />
                  </Tooltip>
                </Stack>
                <Typography variant="caption">
                  Search for specific dataset items using their UUID.
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={8} xl={8}>
              <TextField
                required
                id="annotation-filter-dataset-item-id-textfield"
                type="text"
                margin="normal"
                placeholder={"Enter comma separated dataset item id(s)"}
                fullWidth
                value={filters.datasetItemIds}
                onChange={(e) =>
                  setFilters((prevState) => ({
                    ...prevState,
                    datasetItemIds: e.target.value,
                  }))
                }
                autoComplete="false"
              />
            </Grid>
          </Grid>
          {/* <Grid item xs={12} container alignItems="center" spacing={2}>
            <Grid item>
              <Typography fontWeight={900}>Sort By</Typography>
            </Grid>
          </Grid> */}
        </Box>
        <Box
          sx={{
            height: 60,
            bgcolor: alpha("#f3e5f5", 0.25),
            borderRadius: "0px 0px 16px 16px",
          }}
        >
          <Stack
            direction="row"
            justifyContent="right"
            spacing={2}
            p="0.5rem 2rem"
          >
            <Button
              onClick={resetFilters}
              title="Click to reset filters"
              disabled={!filtersChanged}
            >
              Reset Filters
            </Button>
            <Divider flexItem orientation="vertical" />
            <Button
              variant="outlined"
              title="Click to close"
              onClick={handleClose}
              sx={{
                textDecoration: "none",
                bgcolor: "white",
              }}
              disableElevation
            >
              Discard
            </Button>
            <Button
              variant="contained"
              title="Click to apply filters"
              onClick={applyFilters}
              disableElevation
            >
              Apply Filter
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default FilterModal;
