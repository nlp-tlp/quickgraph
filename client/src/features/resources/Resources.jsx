import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import useResources from "../../shared/hooks/api/resources";
import MainContainer from "../../shared/components/Layout/MainContainer";
import {
  Button,
  Grid,
  Skeleton,
  Stack,
  Box,
  Paper,
  Typography,
  Tooltip,
  Chip,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LayersIcon from "@mui/icons-material/Layers";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Filter from "./Filter";
import { alpha } from "@mui/material/styles";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LabelIcon from "@mui/icons-material/Label";

const Resources = () => {
  const { loading, error, resources, fetchResources } = useResources();
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (loading) {
      fetchResources({ aggregate: false, include_system: true });
    }
  }, [loading]);

  useEffect(() => {
    setFilteredData(resources);
  }, [resources]);

  if (error) {
    return <div>Error</div>;
  }

  return (
    <MainContainer>
      <Grid item xs={12} p="1rem 0rem">
        <Filter
          loading={loading}
          data={resources}
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
            <CreateResourceCard />
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
          <ResourceList resources={filteredData} />
        )}
      </Grid>
    </MainContainer>
  );
};

const ResourceList = ({ resources }) => {
  return (
    <Grid container direction="row" spacing={4}>
      <CreateResourceCard />
      {resources &&
        Array.isArray(resources) &&
        resources.map((resource, index) => (
          <ResourceCard resource={resource} index={index} />
        ))}
    </Grid>
  );
};

const CreateResourceCard = () => {
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
        onClick={() => navigate("/resource-creator/details")}
      >
        Create New Resource
      </Box>
    </Grid>
  );
};

const ResourceCard = ({ resource, index }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Grid
      item
      xs={12}
      md={12}
      lg={6}
      xl={4}
      key={`resource-grid-item-${resource.id}`}
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
              {resource.name.length > 40
                ? resource.name.slice(0, 40) + "..."
                : resource.name}
            </Typography>
          </Stack>
        </Box>
        <Divider />
        <Box p={2}>
          <Stack direction="column" spacing={2}>
            <IconTypography
              icon={<LayersIcon fontSize="small" color="primary" />}
              value={`Size: ${resource.size}`}
              title="The number of instances in this resource"
            />
            <IconTypography
              icon={<AccountCircleIcon fontSize="small" color="primary" />}
              value={`Created by: ${resource.created_by}`}
              title="The creator of this resource"
            />
            <IconTypography
              icon={<AccessTimeIcon fontSize="small" color="primary" />}
              value={`Last updated: ${moment
                .utc(resource.created_at)
                .fromNow()}`}
              title="The time since resource was created"
            />
            <IconTypography
              icon={<LabelIcon fontSize="small" color="primary" />}
              value={
                <>
                  {"Instances: "}
                  {resource?.instances.slice(0, 5).join(", ")}
                  {resource?.instances.length > 5 ? ", ..." : ""}
                </>
              }
              title={resource?.instances.join(", ")}
            />
          </Stack>
        </Box>
        <Box
          p={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ bgcolor: alpha("#f3e5f5", 0.25) }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip
              label={resource.classification}
              color="primary"
              size="small"
              variant="outlined"
              sx={{ bgcolor: "white" }}
            />
            <Chip
              label={resource.sub_classification}
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
            onClick={() => navigate(`/resource-management/${resource.id}`)}
            sx={{ textDecoration: "none" }}
            disableElevation
            title="Click to view this resource"
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
    <Tooltip title={title} arrow placement="top">
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

export default Resources;
