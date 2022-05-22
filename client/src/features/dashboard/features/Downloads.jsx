import "../Dashboard.css";
import { useEffect, useState } from "react";
import BootstrapTable from "react-bootstrap-table-next";
import axios from "../../utils/api-interceptor";

import {
  Grid,
  Avatar,
  Card,
  CardContent,
  Button,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  OutlinedInput,
  TextField,
  IconButton,
  Stack,
  Box,
  Chip,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { grey, yellow } from "@mui/material/colors";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useTheme } from "@mui/material/styles";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name, annotatorNames, theme) {
  return {
    fontWeight:
      annotatorNames.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

export const Downloads = ({ project }) => {
  const theme = useTheme();
  const [data, setData] = useState();
  const [loaded, setLoaded] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);

  const [preparingDownload, setPreparingDownload] = useState(false);

  const DEFAULT_FILTERS = {
    iaa: 0,
    quality: "any",
    saved: "any",
    annotators: ["Gold"],
    annotationType:
      project && project.tasks.relationAnnotation ? "triples" : "entities",
  };
  const [prevFilters, setPrevFilters] = useState(DEFAULT_FILTERS); // Used to check if filters have been modified
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    const fetchData = async () => {
      if (!loaded) {
        const response = await axios.post(
          `/api/project/dashboard/effort/${project._id}`,
          { filters: filters }
        );

        if (response.status === 200) {
          setData(response.data);
          setLoaded(true);
        }
      }
    };
    fetchData();
  }, [loaded]);

  const handleFilterApply = () => {
    // Trigger fetch event
    setLoaded(false);

    // Update prevFilters with the filter used for the update
    setPrevFilters(filters);
  };

  const handleFilterReset = () => {
    setFilters(DEFAULT_FILTERS);
    setPrevFilters(DEFAULT_FILTERS);
    // Trigger fetch event
    setLoaded(false);
  };

  const selectOptions = {
    quality: ["any", "silver", "weak"],
    saved: ["any", "yes", "no"],
    annotationType:
      project && project.tasks.relationAnnotation
        ? ["triples", "entities"]
        : ["entities"],
    annotators: data ? data.annotators.map((a) => a.username) : ["Loading..."],
  };

  const downloadAnnotations = async (project) => {
    setPreparingDownload(true);

    const annotatorNameToId = filters.annotators.map((username) => ({
      username: username,
      _id: data.annotators.filter((a) => a.username === username)[0]._id,
    }));

    // console.log("downloading data...");

    const response = await axios.post("/api/project/dashboard/download", {
      projectId: project._id,
      filters: { ...filters, annotators: annotatorNameToId },
    });

    // console.log("download response", response);

    if (response && response.status === 200) {
      setPreparingDownload(false);
      // Prepare for file download
      const fileName = `${project.name}_${filters.annotationType}_annotations_iaa-${filters.iaa}_q-${filters.quality}_s-${filters.saved}`;
      const json = JSON.stringify(response.data, null, 4);
      const blob = new Blob([json], { type: "application/json" });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName + ".json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Unsuccessful download
      // console.log("download failed");
      setPreparingDownload(false);
    }
  };

  const handleMultiSelect = (event) => {
    const {
      target: { value },
    } = event;

    setFilters({
      ...filters,
      annotators: typeof value === "string" ? value.split(",") : value,
    });
  };

  const annotatorFormatter = (cell, row) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Avatar sx={{ bgcolor: row.colour }} title={row.username}>
          {row.username[0]}
        </Avatar>
      </div>
    );
  };

  const downloadFormatter = (cell, row, rowIndex, formatExtraData) => {
    const downloadType = formatExtraData.downloadType;
    // console.log(downloadType);
    // console.log(cell, row);

    let metrics;
    switch (downloadType) {
      case "triples":
        const tMetrics = [
          { value: data.results[row._id].triples.total, name: "total" },
          { value: data.results[row._id].triples.saved, name: "saved" },
        ];

        metrics = (
          <div className="dl-metrics-container">
            {tMetrics.map((metric) => (
              <span className="dl-metric">
                <span className="dl-metric-value">{metric.value}</span>
                <span className="dl-metric-name">{metric.name}</span>
              </span>
            ))}
          </div>
        );

        break;
      case "entities":
        // console.log(data.results[row._id].entities);

        const eMetrics = [
          { value: data.results[row._id].entities.total, name: "total" },
          { value: data.results[row._id].entities.saved, name: "saved" },
          Object.keys(data.results[row._id].entities).includes("gold")
            ? { value: data.results[row._id].entities.gold, name: "gold" }
            : { value: data.results[row._id].entities.silver, name: "silver" },
          { value: data.results[row._id].entities.weak, name: "weak" },
        ];

        metrics = (
          <div className="dl-metrics-container">
            {eMetrics.map((metric) => (
              <span className="dl-metric">
                <span className="dl-metric-value">{metric.value}</span>
                <span className="dl-metric-name">{metric.name}</span>
              </span>
            ))}
          </div>
        );
        break;
      default:
        break;
    }

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {metrics}
      </div>
    );
  };

  const columns = [
    {
      dataField: "username",
      text: "",
      formatter: annotatorFormatter,
      headerAlign: "center",
    },
    {
      dataField: "df1",
      isDummyField: true,
      text: "Triples",
      formatter: downloadFormatter,
      formatExtraData: {
        downloadType: "triples",
      },
      headerAlign: "center",
      hidden: project && !project.tasks.relationAnnotation,
    },
    {
      dataField: "df2",
      isDummyField: true,
      text: "Entities",
      formatter: downloadFormatter,
      formatExtraData: {
        downloadType: "entities",
      },
      headerAlign: "center",
    },
  ];

  const rowStyle = (row, rowIndex) => {
    if (row.username === "Gold") {
      return { backgroundColor: "#fffde7" };
    }
  };

  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(prevFilters)) {
      setFilterApplied(true);
    } else {
      setFilterApplied(false);
    }
  }, [filters]);

  return (
    <Grid item container xs={12}>
      <Grid item xs={12} sx={{ mt: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Grid item container>
              <Grid
                item
                xs={12}
                container
                justifyContent="space-between"
                alignItems="center"
              >
                <div>
                  <h5>Filters</h5>
                  <span style={{ fontSize: "0.75rem", color: grey[700] }}>
                    Filter and review project annotations before downloading
                  </span>
                </div>
                <Stack direction="row" spacing={2}>
                  <IconButton
                    size="small"
                    variant="outlined"
                    disabled={!filterApplied}
                    onClick={handleFilterReset}
                  >
                    <RestartAltIcon />
                  </IconButton>
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ color: "white" }}
                    size="small"
                    startIcon={<FilterListIcon />}
                    onClick={handleFilterApply}
                    disableElevation
                    disabled={!filterApplied}
                  >
                    Filter
                  </Button>
                </Stack>
              </Grid>
              <Grid
                item
                xs={12}
                sx={{ mt: 4 }}
                container
                justifyContent="space-evenly"
              >
                <FormControl sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="annotation-type-input-label">Type</InputLabel>
                  <Select
                    labelId="annotation-type-label-helper"
                    id="annotation-type-input"
                    label="Type"
                    value={filters.annotationType}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        annotationType: e.target.value,
                      })
                    }
                    style={{ textTransform: "capitalize" }}
                  >
                    {selectOptions.annotationType.map((value) => (
                      <MenuItem
                        value={value}
                        style={{ textTransform: "capitalize" }}
                      >
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Output Annotation Type</FormHelperText>
                </FormControl>

                <FormControl sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="annotation-quality-helper-label">
                    Quality
                  </InputLabel>
                  <Select
                    labelId="annotation-quality-select-helper-label"
                    id="annotation-quality-select-helper"
                    value={filters.quality}
                    label="Quality"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        quality: e.target.value,
                      })
                    }
                    style={{ textTransform: "capitalize" }}
                  >
                    {selectOptions.quality.map((value) => (
                      <MenuItem
                        value={value}
                        style={{ textTransform: "capitalize" }}
                      >
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Annotation Quality</FormHelperText>
                </FormControl>

                <FormControl sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="annotation-save-helper-label">
                    Saved
                  </InputLabel>
                  <Select
                    labelId="annotation-save-select-helper-label"
                    id="annotation-save-select-helper"
                    value={filters.saved}
                    label="Saved"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        saved: e.target.value,
                      })
                    }
                    style={{ textTransform: "capitalize" }}
                  >
                    {selectOptions.saved.map((value) => (
                      <MenuItem
                        value={value}
                        style={{ textTransform: "capitalize" }}
                      >
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Annotation Save State</FormHelperText>
                </FormControl>

                <FormControl sx={{ m: 1, minWidth: 120 }} variant="outlined">
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
                  />
                  <FormHelperText id="outlined-weight-helper-text">
                    Minimum IAA Agreement
                  </FormHelperText>
                </FormControl>

                <FormControl sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="annotators-select-helper-label">
                    Annotators
                  </InputLabel>
                  <Select
                    labelId="annotators-select-helper-label"
                    id="annotators-select-helper"
                    multiple
                    label="Annotators"
                    style={{ textTransform: "capitalize" }}
                    value={filters.annotators}
                    onChange={handleMultiSelect}
                    input={
                      <OutlinedInput id="select-multiple-chip" label="Chip" />
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.length > 2 ? (
                          <>
                            {selected.slice(0, 2).map((value) => (
                              <Chip
                                key={value}
                                label={value}
                                sx={{
                                  bgcolor:
                                    value.toLowerCase() === "gold" &&
                                    yellow[600],
                                }}
                              />
                            ))}
                            <Chip
                              key="ellipsis"
                              label={`${selected.length - 2}+`}
                            />
                          </>
                        ) : (
                          selected.map((value) => (
                            <Chip
                              key={value}
                              label={value}
                              sx={{
                                bgcolor:
                                  value.toLowerCase() === "gold" && yellow[600],
                              }}
                            />
                          ))
                        )}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {selectOptions.annotators.map((name) => (
                      <MenuItem
                        key={name}
                        value={name}
                        style={getStyles(name, filters.annotators, theme)}
                      >
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Annotators To Include</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sx={{ mt: 4 }}>
        {loaded && (
          <BootstrapTable
            keyField="id"
            data={data.annotators}
            columns={columns}
            rowStyle={rowStyle}
          />
        )}
      </Grid>
      <Grid item xs={12} sx={{ mt: 2 }} container justifyContent="right">
        <LoadingButton
          loading={preparingDownload}
          variant="contained"
          onClick={() => downloadAnnotations(project)}
          disableElevation
        >
          Download {filters.annotationType === "triples" ? "triple" : "entity"}{" "}
          Annotations
        </LoadingButton>
      </Grid>
    </Grid>
  );
};
