import { useEffect, useState, useContext } from "react";
import {
  Grid,
  Button,
  MenuItem,
  TextField,
  Stack,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Typography,
  Paper,
  Tooltip,
  Divider,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import Checkbox from "@mui/material/Checkbox";
import { DashboardContext } from "../../../../shared/context/dashboard-context";
import {
  DownloadFilterSelectDefaults,
  DownloadFilterSelectOptions,
} from "../../../../shared/constants/dashboard";
import { useParams } from "react-router-dom";
import useDownload from "../../../../shared/hooks/api/download";

const Downloads = () => {
  const { projectId } = useParams();
  const { fetchAnnotatorEfforts } = useContext(DashboardContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterApplied, setFilterApplied] = useState(false);
  const [checked, setChecked] = useState([]);
  const [prevFilters, setPrevFilters] = useState(DownloadFilterSelectDefaults); // Used to check if filters have been modified
  const [filters, setFilters] = useState(DownloadFilterSelectDefaults);

  useEffect(() => {
    const fetchData = async () => {
      if (loading) {
        setData(
          await fetchAnnotatorEfforts({
            projectId: projectId,
            params: filters,
          })
        );
        setLoading(false);
      }
    };
    fetchData();
  }, [loading]);

  const handleFilterApply = () => {
    // Update prevFilters with the filter used for the update
    setLoading(true);
    setPrevFilters(filters);
  };

  const handleFilterReset = () => {
    setFilters(DownloadFilterSelectDefaults);
    setPrevFilters(DownloadFilterSelectDefaults);
    setLoading(true);
  };

  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(prevFilters)) {
      setFilterApplied(true);
    } else {
      setFilterApplied(false);
    }
  }, [filters]);

  // if (error) {
  //   return <Alert severity="error">Error occurred</Alert>;
  // }
  // {
  //   /* {loading ? (
  //   <LoadingAlert message="Wrangling data for download" />
  // ) : ( */
  // }

  return (
    <>
      <Grid item xs={12}>
        <Filters
          filters={filters}
          setFilters={setFilters}
          filterApplied={filterApplied}
          handleFilterApply={handleFilterApply}
          handleFilterReset={handleFilterReset}
        />
      </Grid>
      <Box p="1rem 0rem">
        <Divider />
      </Box>
      <Grid item xs={12}>
        {loading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : (
          <>
            <EffortTable
              data={data}
              loading={loading}
              setChecked={setChecked}
              checked={checked}
            />
          </>
        )}
        <Box sx={{ display: "flex", mt: 2, justifyContent: "right" }}>
          <DownloadButtons data={data} filters={filters} checked={checked} />
        </Box>
      </Grid>
    </>
  );
};

const Filters = ({
  filters,
  setFilters,
  filterApplied,
  handleFilterApply,
  handleFilterReset,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const handleChange = (event) => {
    setSelectedItems(event.target.value);
  };

  return (
    <Stack direction="row" alignItems="center" pt={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Tooltip
          title="Filter annotations based on whether they have been saved"
          placement="top"
        >
          <TextField
            select
            label="Saved"
            sx={{ flex: 1, minWidth: 160, textTransform: "capitalize" }}
            size="small"
            value={filters.saved}
            onChange={(e) =>
              setFilters({
                ...filters,
                saved: e.target.value,
              })
            }
          >
            {Object.keys(DownloadFilterSelectOptions.saved).map((name) => (
              <MenuItem
                key={`saved-item-${name}`}
                value={DownloadFilterSelectOptions.saved[name]}
                style={{ textTransform: "capitalize" }}
              >
                {name}
              </MenuItem>
            ))}
          </TextField>
        </Tooltip>
        <Tooltip
          title="Filter annotations based on their quality"
          placement="top"
        >
          <TextField
            select
            value={filters.quality}
            label="Quality"
            onChange={(e) =>
              setFilters({
                ...filters,
                quality: e.target.value,
              })
            }
            sx={{ flex: 1, minWidth: 160, textTransform: "capitalize" }}
            size="small"
          >
            {Object.keys(DownloadFilterSelectOptions.quality).map((name) => (
              <MenuItem
                key={`quality-item-${name}`}
                value={DownloadFilterSelectOptions.quality[name]}
                style={{ textTransform: "capitalize" }}
              >
                {name}
              </MenuItem>
            ))}
          </TextField>
        </Tooltip>
        {/* <Tooltip title="Filter annotations based on their flags">
          <FormControl fullWidth size="small">
            <InputLabel id="multi-select-flags">Flags</InputLabel>
            <Select
              labelId="multi-select-flags"
              id="flags-multi-select"
              multiple
              value={selectedItems}
              onChange={handleChange}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size={12} />
                  ))}
                </Box>
              )}
            >
              {Object.keys(DownloadFilterSelectOptions.flags).map((name) => (
                <MenuItem
                  key={name}
                  value={DownloadFilterSelectOptions.flags[name]}
                >
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip> */}
        {/* <Tooltip
          title="Filter annotations based their minimum agreement"
          placement="top"
        >
          <TextField
            id="minimum-agreement"
            label="Agreement"
            type="number"
            value={filters.iaa}
            onChange={(e) =>
              setFilters({
                ...filters,
                iaa:
                  e.target.value > 100
                    ? 100
                    : e.target.value < 0
                    ? 0
                    : parseInt(e.target.value),
              })
            }
            InputLabelProps={{
              shrink: true,
            }}
            disabled
            size="small"
            sx={{ flex: 1, minWidth: 160 }}
          />
        </Tooltip>
        <Divider flexItem orientation="vertical" /> */}
        <Button
          size="small"
          disabled={!filterApplied}
          onClick={handleFilterReset}
        >
          <Tooltip title="Click to reset filters">
            <span>Reset</span>
          </Tooltip>
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleFilterApply}
          disableElevation
          disabled={!filterApplied}
        >
          <Tooltip title="Click to apply filters">
            <span>Apply Filter</span>
          </Tooltip>
        </Button>
      </Stack>
    </Stack>
  );
};

const EffortTable = ({ data, loading, setChecked, checked }) => {
  const { state } = useContext(DashboardContext);

  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const metrisContainer = (username, downloadType) => {
    if (downloadType === "triples") {
      const tMetrics = [
        { value: data[username].triples.total, name: "total" },
        { value: data[username].triples.saved, name: "saved" },
        Object.keys(data[username]).includes("gold")
          ? { value: data[username].triples.gold, name: "gold" }
          : {
              value: data[username].triples.silver,
              name: "silver",
            },
        { value: data[username].triples.weak, name: "weak" },
      ];

      return (
        <Stack direction="row" spacing={2} justifyContent="center">
          {tMetrics.map((metric, index) => (
            <Stack
              direction="column"
              key={`triple-metric-${username}-${index}`}
            >
              <Typography variant="button">{metric.value}</Typography>
              <Typography
                variant="caption"
                sx={{ textTransform: "capitalize" }}
              >
                {metric.name}
              </Typography>
            </Stack>
          ))}
        </Stack>
      );
    } else {
      const eMetrics = [
        { value: data[username].entities.total, name: "total" },
        { value: data[username].entities.saved, name: "saved" },
        Object.keys(data[username]).includes("gold")
          ? { value: data[username].entities.gold, name: "gold" }
          : {
              value: data[username].entities.silver,
              name: "silver",
            },
        { value: data[username].entities.weak, name: "weak" },
      ];

      return (
        <Stack direction="row" spacing={2} justifyContent="center">
          {eMetrics.map((metric, index) => (
            <Stack
              direction="column"
              key={`entity-metric-${username}-${index}`}
            >
              <Typography variant="button">{metric.value}</Typography>
              <Typography
                variant="caption"
                sx={{ textTransform: "capitalize" }}
              >
                {metric.name}
              </Typography>
            </Stack>
          ))}
        </Stack>
      );
    }
  };

  return (
    <Box component={Paper} square variant="outlined">
      <TableContainer>
        <Table aria-label="download table">
          <TableHead>
            <TableRow>
              <TableCell align="center"></TableCell>
              <TableCell align="center">Annotator</TableCell>
              <TableCell align="center">Entities</TableCell>
              {state.tasks.relation && (
                <TableCell align="center">Triples</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              Object.keys(data).map((username, index) => (
                <TableRow
                  key={username}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell align="center">
                    <Tooltip
                      title="Click to mark this users annotations for download"
                      arrow
                    >
                      <Checkbox
                        edge="end"
                        onChange={handleToggle(index)}
                        checked={checked.indexOf(index) !== -1}
                        inputProps={{ "aria-labelledby": index }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell component="th" scope="row" align="center">
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {username}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {metrisContainer(username, "entities")}
                  </TableCell>
                  {state.tasks.relation && (
                    <TableCell align="center">
                      {metrisContainer(username, "triples")}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const DownloadButtons = ({ data, filters, checked }) => {
  const { projectId } = useParams();
  const { isDownloading, downloadAnnotations } = useDownload();

  const handleDownload = () => {
    const filteredArray = Object.entries(data).filter(([key, value], index) => {
      return checked.includes(index);
    });
    const annotators = Object.keys(Object.fromEntries(filteredArray));
    downloadAnnotations({ projectId: projectId, filters, annotators });
  };

  return (
    <Stack direction="row" spacing={2}>
      {/* <LoadingButton
    loading={isDownloading}
    variant="contained"
    onClick={() => handleDownload("entities")}
    disableElevation
    // disabled={checked.length === 0}
    title="Download summary of project annotation"
  >
    Download Summary
  </LoadingButton> */}
      <LoadingButton
        loading={isDownloading}
        variant="contained"
        onClick={handleDownload}
        disableElevation
        disabled={checked.length === 0}
      >
        Download Annotations
      </LoadingButton>
    </Stack>
  );
};

export default Downloads;
