import { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Stack,
  Typography,
  Divider,
  TextField,
  Tooltip,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Skeleton,
  IconButton,
  CircularProgress,
} from "@mui/material";
import useDataset from "../../shared/hooks/api/dataset";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import { useParams, Link } from "react-router-dom";
import RichTable from "../../shared/components/RichTable";
import ErrorAlert from "../../shared/components/ErrorAlert";
import DownloadIcon from "@mui/icons-material/Download";
import MainContainer from "../../shared/components/Layout/MainContainer";
import UploadModal from "./UploadModal";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { alpha } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Returns the shortest possible abbreviation for the relative time between the given date and now.
 *
 * @param {string|Date} date - The date to compare with the current time. Can be a string or a Date object.
 * @returns {string} The shortest abbreviation for the relative time (e.g., '2 h ago' for 2 hours ago).
 */
function shortestFromNow(date) {
  const diff = moment.utc(date).diff(moment());
  const duration = moment.duration(diff).abs();
  const suffix = " ago";

  if (duration.years() >= 1) {
    return duration.years() + "y" + suffix;
  } else if (duration.months() >= 1) {
    return duration.months() + "M" + suffix;
  } else if (duration.days() >= 1) {
    return duration.days() + "d" + suffix;
  } else if (duration.hours() >= 1) {
    return duration.hours() + "h" + suffix;
  } else if (duration.minutes() >= 1) {
    return duration.minutes() + "m" + suffix;
  } else {
    return duration.seconds() + "s" + suffix;
  }
}

const Dataset = () => {
  const { datasetId } = useParams();
  const [name, setName] = useState();
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isBlueprint, setIsBlueprint] = useState();
  const [openModal, setOpenModal] = useState(false);

  const handleCloseModal = () => setOpenModal(false);
  const handleOpenModal = () => setOpenModal(true);

  const {
    loading,
    error,
    dataset,
    fetchDataset,
    submitting,
    deleteDataset,
    deleteDatasetItems,
    uploadDatasetItems,
  } = useDataset();

  const isProjectDataset =
    !loading && !dataset.is_blueprint && dataset.hasOwnProperty("project");
  const project = isProjectDataset && dataset.project;

  useEffect(() => {
    if (loading) {
      fetchDataset(datasetId);
    } else {
      setIsBlueprint(dataset.is_blueprint);
    }
  }, [loading]);

  const handleItemDelete = () => {
    deleteDatasetItems(datasetId, selectedItemIds);
  };

  const handleCancel = () => {
    setSelectedItemIds([]);
  };

  const handleDownload = () => {
    const browserLocale = navigator.language || navigator.userLanguage;

    const json = JSON.stringify(dataset);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      new Date()
        .toLocaleString(browserLocale, {
          timeZone: "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/[,:\s]/g, "-") + `_quickgraph_dataset-${dataset.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    { field: "id", hide: true },
    {
      field: "text",
      flex: 1,
      headerName: "Text",
      headerAlign: "center",
      align: "left",
      renderCell: (params) => {
        if (!params?.value) return "";
        return (
          <Tooltip title={params.value}>
            <div
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: "help",
              }}
            >
              {params.value}
            </div>
          </Tooltip>
        );
      },
    },
    {
      field: "tokens",
      headerName: "Tokens",
      flex: 1,
      headerAlign: "center",
      align: "center",
      maxWidth: 100,
      valueGetter: (value) => value?.length ?? 0,
    },
    {
      field: "external_id",
      headerName: "External ID",
      flex: 1,
      headerAlign: "center",
      align: "center",
      maxWidth: 120,
      valueGetter: (value) => value ?? "Not assigned",
    },
    {
      field: "extra_fields",
      headerName: "Extra Fields",
      flex: 1,
      headerAlign: "center",
      align: "center",
      maxWidth: 180,
      renderCell: (params) => {
        if (!params?.row?.extra_fields) return "Not assigned";
        return (
          <Tooltip title={JSON.stringify(params.row.extra_fields)}>
            <div
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: "help",
              }}
            >
              {`Fields: ${
                Object.keys(params.row.extra_fields).length
              } (hover to reveal)`}
            </div>
          </Tooltip>
        );
      },
    },
    {
      field: "is_annotated",
      headerName: "Annotations",
      headerAlign: "center",
      align: "center",
      flex: 1,
      renderCell: (params) => {
        if (!params?.row) return "E: 0 | R: 0";
        const entities = params.row.entities?.length || 0;
        const relations = params.row.relations?.length || 0;
        return `E: ${entities} | R: ${relations}`;
      },
      maxWidth: 160,
      minWidth: 100,
      hide: !dataset?.is_annotated,
    },
    {
      field: "created_at",
      headerName: "Created",
      headerAlign: "center",
      align: "center",
      valueGetter: (value) => shortestFromNow(value),
      minWidth: 120,
    },
  ];

  const rows = dataset?.items?.map((i) => ({ ...i, id: i._id })) || [];

  console.log("rows", rows);

  return (
    <>
      <UploadModal
        open={openModal}
        handleClose={handleCloseModal}
        dataset={dataset}
        uploadDatasetItems={uploadDatasetItems}
        submitting={submitting}
      />
      <MainContainer>
        <Grid
          container
          mt={2}
          direction="column"
          justifyContent="flex-start"
          alignItems="center"
        >
          {error ? (
            <ErrorAlert />
          ) : (
            <Grid item xs={12} container>
              <Grid
                item
                xs={3}
                as={Paper}
                variant="outlined"
                sx={{ height: "100%" }}
              >
                {loading ? (
                  <Skeleton variant="rectangular" height={600} />
                ) : (
                  <>
                    <Box p={2} sx={{ textAlign: "left" }}>
                      <Typography fontWeight={500}>
                        Dataset Information
                      </Typography>
                    </Box>
                    <Divider />
                    {!loading && (
                      <List dense>
                        {[
                          {
                            key: "name",
                            value: dataset.name,
                          },
                          {
                            key: "description",
                            value: dataset.description,
                          },
                          {
                            key: "size",
                            value: dataset.size,
                          },
                          ...(isProjectDataset
                            ? []
                            : [
                                {
                                  key: "projects",
                                  value: dataset.projects.length,
                                },
                              ]),
                          {
                            key: "last updated",
                            value: moment.utc(dataset.updated_at).fromNow(),
                          },
                        ].map((item) => (
                          <ListItem>
                            <ListItemText
                              primary={
                                <>
                                  <Typography
                                    fontWeight={500}
                                    fontSize={14}
                                    sx={{ textTransform: "capitalize" }}
                                  >
                                    {item.key}
                                  </Typography>
                                  <Typography
                                    fontSize={14}
                                    pt={0.5}
                                    sx={{
                                      textTransform:
                                        item.key !== "name" && "capitalize",
                                      wordWrap: "break-word",
                                    }}
                                  >
                                    {item.value}
                                  </Typography>
                                </>
                              }
                              sx={{ wordWrap: "break-word" }}
                            />
                          </ListItem>
                        ))}
                        {/* <Divider /> */}
                        {dataset.linked_entity_resource && (
                          <ListItem>
                            <ListItemText
                              primary={
                                <>
                                  <Typography
                                    fontWeight={500}
                                    fontSize={14}
                                    sx={{ textTransform: "capitalize" }}
                                  >
                                    Linked Entity Ontology Resource
                                  </Typography>
                                  <Link
                                    to={`/resource-management/${dataset.linked_entity_resource._id}`}
                                    key="linked-entity-ontology-resource"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {dataset.linked_entity_resource.name}
                                  </Link>
                                </>
                              }
                            />
                          </ListItem>
                        )}
                        {dataset.linked_relation_resource && (
                          <ListItem>
                            <ListItemText
                              primary={
                                <>
                                  <Typography
                                    fontWeight={500}
                                    fontSize={14}
                                    sx={{ textTransform: "capitalize" }}
                                  >
                                    Linked Relation Ontology Resource
                                  </Typography>
                                  <Link
                                    to={`/resource-management/${dataset.linked_relation_resource._id}`}
                                    key="linked-relation-ontology-resource"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {dataset.linked_relation_resource.name}
                                  </Link>
                                </>
                              }
                            />
                          </ListItem>
                        )}
                        {project && (
                          <ListItem
                            key={`linked-project-${project._id}`}
                            sx={{
                              textTransform: "capitalize",
                            }}
                          >
                            <ListItemText
                              primary={
                                <>
                                  <Typography
                                    fontWeight={500}
                                    fontSize={14}
                                    sx={{ textTransform: "capitalize" }}
                                  >
                                    Linked Project
                                  </Typography>
                                  <Link
                                    to={`/dashboard/${project._id}/overview`}
                                    key={`linked-project-link`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {project.name}
                                  </Link>
                                </>
                              }
                            />
                          </ListItem>
                        )}
                      </List>
                    )}
                    <Divider />
                    <Box p="1rem 1rem 0rem 1rem" sx={{ textAlign: "left" }}>
                      <Typography gutterBottom fontWeight={500}>
                        Preprocessing
                      </Typography>
                    </Box>
                    {!loading && (
                      <Box
                        p={2}
                        direction="row"
                        spacing={1}
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                        }}
                        gap={1}
                      >
                        {Object.keys(dataset.preprocessing).length > 0 ? (
                          Object.entries(dataset.preprocessing).map(
                            ([key, value], index) => (
                              <Chip
                                label={`${key.replace("_", " ")}${
                                  typeof value === "boolean" ? "" : ": " + value
                                }`}
                                sx={{ textTransform: "capitalize" }}
                                icon={value ? <DoneIcon /> : <CloseIcon />}
                                color={value ? "success" : "default"}
                                variant={value ? "contained" : "outlined"}
                                size="small"
                              />
                            )
                          )
                        ) : (
                          <Chip
                            label="No preprocessing applied"
                            icon={<CloseIcon />}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>
                    )}

                    {!dataset.read_only && !isProjectDataset && (
                      <>
                        <Divider />
                        <Box p={2} sx={{ textAlign: "left" }}>
                          <Typography fontWeight={500} color="error">
                            Danger Zone
                          </Typography>
                          <Typography variant="caption">
                            Deletion is permanent and irrevesible, but will not
                            affect associated projects.
                          </Typography>
                        </Box>
                        <Box p="0rem 1rem 1rem 1rem">
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <TextField
                              label={`Enter ${dataset.name} to delete`}
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              color="error"
                              size="small"
                              fullWidth
                            />
                            {submitting ? (
                              <CircularProgress size={26} />
                            ) : (
                              <Tooltip title="Click to delete dataset">
                                <IconButton
                                  disabled={name !== dataset.name}
                                  onClick={() => deleteDataset(datasetId)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>
                      </>
                    )}
                    <Divider />
                    <Box
                      p="0rem 1rem"
                      sx={{
                        height: 60,
                        bgcolor: alpha("#f3e5f5", 0.25),
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={2}
                      >
                        <Chip
                          label={isBlueprint ? "Blueprint" : "Project Dataset"}
                          color="primary"
                          size="small"
                        />

                        {dataset.is_annotated && (
                          <Chip
                            label="Annotated"
                            color="primary"
                            size="small"
                          />
                        )}
                      </Stack>
                    </Box>
                  </>
                )}
              </Grid>
              <Grid item xs={9} pl={2}>
                <Grid
                  item
                  xs={12}
                  sx={{ display: "flex", justifyContent: "right" }}
                  pb={2}
                >
                  {loading ? (
                    <Box as={Paper} variant="outlined" width="100%">
                      <Skeleton
                        variant="rectangular"
                        height={40}
                        width={"100%"}
                      />
                    </Box>
                  ) : (
                    <Stack direction="row" spacing={2}>
                      <Button
                        title="Click to download this dataset"
                        onClick={handleDownload}
                        startIcon={<DownloadIcon />}
                        size="small"
                      >
                        Download
                      </Button>
                      {!dataset.read_only && (
                        <>
                          <Button
                            title="Click to upload additional items to this dataset"
                            onClick={handleOpenModal}
                            size="small"
                            startIcon={<FileUploadIcon />}
                            // disabled={dataset.is_blueprint}
                          >
                            Upload
                          </Button>
                          {/* <Button
                            component={Link}
                            to={`/cleaner/${dataset._id}`}
                            title="Click to clean this dataset"
                            startIcon={<CleaningServicesIcon />}
                            size="small"
                            disabled
                          >
                            Clean
                          </Button> */}
                          {/* <Button
                        title="Click to share this dataset"
                        disabled
                        startIcon={<ShareIcon />}
                        size="small"
                      >
                        Share
                      </Button> */}
                        </>
                      )}
                      {!dataset.read_only && (
                        <>
                          <Divider orientation="vertical" />
                          <Button
                            title="Click to cancel changes"
                            variant="outlined"
                            disabled={selectedItemIds.length === 0}
                            onClick={handleCancel}
                            size="small"
                          >
                            Cancel
                          </Button>
                          <Button
                            title={"Click to remove items from this dataset"}
                            variant="contained"
                            size="small"
                            // disabled
                            disableElevation
                            disabled={
                              selectedItemIds.length === 0 ||
                              rows.length <= 1 ||
                              selectedItemIds.length === rows.length
                            }
                            color="error"
                            onClick={handleItemDelete}
                          >
                            {rows.length > 1
                              ? `Remove ${selectedItemIds.length} items`
                              : "Remove"}
                          </Button>
                          {/* <Button
                        title={"Click to add items to this dataset"}
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={handleItemAdd}
                      >
                        Add Row
                      </Button> */}
                        </>
                      )}
                    </Stack>
                  )}
                </Grid>
                <Grid
                  item
                  container
                  xs={12}
                  sx={{
                    overflowY: "auto",
                    height: loading ? "100%" : "calc(100vh - 310px)",
                  }}
                >
                  {loading ? (
                    <Box as={Paper} variant="outlined" width="100%">
                      <Skeleton
                        variant="rectangular"
                        height="100%"
                        width="100%"
                      />
                    </Box>
                  ) : (
                    <RichTable
                      cols={columns}
                      rows={rows}
                      noRowsMessageName="No data set items exist"
                      checkboxSelection={!dataset.read_only}
                      selectionModel={selectedItemIds}
                      setSelectionModel={setSelectedItemIds}
                      pageSize={10}
                      rowsPerPageOptions={[5, 10]}
                    />
                  )}
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </MainContainer>
    </>
  );
};

export default Dataset;
