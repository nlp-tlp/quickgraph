import { useNavigate } from "react-router-dom";
import moment from "moment";
import useDatasets from "../../shared/hooks/api/datasets";
import MainContainer from "../../shared/components/Layout/MainContainer";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LayersIcon from "@mui/icons-material/Layers";
import Filter from "./Filter";
import { alpha } from "@mui/material/styles";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DescriptionIcon from "@mui/icons-material/Description";

const Datasets = () => {
  const { loading, datasets, error, fetchDatasets } = useDatasets();
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (loading) {
      fetchDatasets({ include_dataset_size: true, include_system: true });
    }
  }, [loading]);

  useEffect(() => {
    setFilteredData(datasets);
  }, [datasets]);

  if (error) {
    return <div>Error</div>;
  }

  return (
    <MainContainer>
      <Grid item xs={12} p="1rem 0rem">
        <Filter
          loading={loading}
          data={datasets}
          filteredData={filteredData}
          setFilteredData={setFilteredData}
        />
      </Grid>

      <Grid
        item
        sx={{
          height: "calc(100vh - 297px)",
          overflowY: "auto",
        }}
      >
        {loading ? (
          <Grid
            item
            container
            xs={12}
            spacing={4}
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <CreateDatasetCard />
            {Array(5)
              .fill()
              .map((_, index) => (
                <Grid
                  item
                  container
                  xs={12}
                  md={12}
                  lg={6}
                  xl={4}
                  key={`skeleton-grid-${index}`}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Box as={Paper} variant="outlined">
                    <Skeleton
                      key={`skeleton-${index}`}
                      variant="rectangular"
                      height={290}
                      width={400}
                    />
                  </Box>
                </Grid>
              ))}
          </Grid>
        ) : (
          <DatasetList datasets={filteredData} />
        )}
      </Grid>
    </MainContainer>
  );
};

const DatasetList = ({ datasets }) => {
  return (
    <Grid container direction="row" spacing={4}>
      <CreateDatasetCard />
      {datasets &&
        Array.isArray(datasets) &&
        datasets.map((dataset, index) => (
          <DatasetCard dataset={dataset} index={index} />
        ))}
    </Grid>
  );
};

const CreateDatasetCard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  return (
    <Grid item xs={12} md={12} lg={6} xl={4}>
      <Box
        as={Button}
        variant="outlined"
        p={2}
        sx={{
          height: "100%",
          width: "100%",
          minHeight: 290,
          borderStyle: "dashed",
          borderColor: theme.palette.primary.main,
        }}
        onClick={() => navigate("/dataset-creator/details")}
      >
        Create New Dataset
      </Box>
    </Grid>
  );
};

const DatasetCard = ({ dataset, index }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Grid
      item
      xs={12}
      md={12}
      lg={6}
      xl={4}
      key={`dataset-grid-item-${dataset.id}`}
    >
      <Box as={Paper} variant="outlined">
        <Box p={2}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="h5"
              sx={{ color: theme.palette.neutral.main, fontWeight: 300 }}
            >
              #{index + 1}
            </Typography>
            <Typography fontSize={22} fontWeight={700}>
              {dataset.name.length > 40
                ? dataset.name.slice(0, 40) + "..."
                : dataset.name}
            </Typography>
          </Stack>
        </Box>
        <Divider />
        <Box p={2}>
          <Stack direction="column" spacing={2}>
            <IconTypography
              title={dataset.description}
              icon={<DescriptionIcon fontSize="small" color="primary" />}
              value={
                <>
                  {"Description: "}
                  {dataset.description && dataset.description.length > 50
                    ? dataset.description.slice(0, 50) + "..."
                    : dataset.description}
                </>
              }
            />
            <IconTypography
              icon={<LayersIcon fontSize="small" color="primary" />}
              value={`Size: ${dataset.size}`}
              title="The number of instances in this dataset"
            />
            <IconTypography
              icon={<AccountCircleIcon fontSize="small" color="primary" />}
              value={`Created by: ${dataset.created_by}`}
              title="The creator of this dataset"
            />
            <IconTypography
              icon={<AccessTimeIcon fontSize="small" color="primary" />}
              value={`Last updated: ${moment
                .utc(dataset.created_at)
                .fromNow()}`}
              title="The time since dataset was created"
            />
          </Stack>
        </Box>
        <Box
          p={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            bgcolor: alpha("#f3e5f5", 0.25),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip
              label={dataset.is_annotated ? "Annotated" : "Standard"}
              color="primary"
              size="small"
              variant="outlined"
              sx={{ bgcolor: "white" }}
            />
            <Chip
              label={dataset.is_blueprint ? "Blueprint" : "Project"}
              color="primary"
              size="small"
              variant="outlined"
              sx={{ bgcolor: "white" }}
            />
          </Stack>

          <Button
            color="primary"
            variant="contained"
            size="small"
            onClick={() => navigate(`/dataset-management/${dataset._id}`)}
            sx={{ textDecoration: "none" }}
            disableElevation
            title="Click to view this dataset"
          >
            View
          </Button>
        </Box>
      </Box>
    </Grid>
  );
};

const IconTypography = ({ value, icon, title }) => {
  return (
    <Tooltip title={title}>
      <Stack
        direction="row"
        alignItems="top"
        spacing={0.5}
        sx={{
          fontSize: 12,
          color: "rgba(0,0,0,0.75)",
          cursor: "help",
        }}
      >
        {icon}
        <Typography fontSize="inherit" fontWeight={500}>
          {value}
        </Typography>
      </Stack>
    </Tooltip>
  );
};

export default Datasets;
