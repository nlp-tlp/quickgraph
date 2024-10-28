import { useEffect, useContext } from "react";
import {
  Grid,
  Stack,
  Typography,
  Paper,
  Tooltip,
  Box,
  Alert,
  AlertTitle,
  Skeleton,
  Divider,
  Chip,
} from "@mui/material";
import { DashboardContext } from "../../../../shared/context/dashboard-context";
import ErrorAlert from "../../../../shared/components/ErrorAlert";
import useDashboard from "../../../../shared/hooks/api/dashboard";
import DashboardBarChart from "./BarChart";

/**
 * Summarizes an array of data objects by accumulating values for each key (excluding the "x" key).
 *
 * @param {Array} data - An array of objects where each object may contain a date string under the key "x"
 *                       and multiple other key-value pairs where keys are names and values are integers.
 * @returns {Object} An object where each key is a name from the input data and the associated value is
 *                   the sum of all integers found for that name in the input data.
 */
const summarize = (data) => {
  let result = {};

  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== "x") {
        result[key] = (result[key] || 0) + item[key];
      }
    });
  });

  return result;
};

const Overview = () => {
  const { state } = useContext(DashboardContext);
  const { data, error, loading, fetchDashboardOverview } = useDashboard();

  useEffect(() => {
    if (loading) {
      fetchDashboardOverview({ projectId: state.projectId });
    }
  }, [loading]);

  return (
    <>
      {error ? (
        <Grid item xs={12} p={2}>
          <ErrorAlert />
        </Grid>
      ) : (
        <>
          <Grid item xs={12}>
            {loading ? (
              <Skeleton variant="rectangular" height={120} />
            ) : (
              <Stack
                direction="row"
                justifyContent={
                  state.tasks.relation ? "space-between" : "space-evenly"
                }
              >
                {data.metrics
                  .sort((a, b) => a.index - b.index)
                  .map((metric, index) => (
                    <Box sx={{ textAlign: "center" }} m={1}>
                      <Paper sx={{ padding: "16px" }} variant="outlined">
                        <Stack
                          direction="column"
                          alignItems="center"
                          key={`overview-metric-${index}`}
                        >
                          <Typography fontSize={28} fontWeight={500}>
                            {metric.value ?? "N/A"}
                          </Typography>
                          <Tooltip
                            title={metric.title}
                            placement="bottom"
                            arrow
                          >
                            <Typography fontSize={14} sx={{ cursor: "help" }}>
                              {metric.name}
                            </Typography>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    </Box>
                  ))}
              </Stack>
            )}
          </Grid>
          <Grid item xs={12}>
            <Stack
              direction="row"
              p="1rem 2rem"
              justifyContent="center"
              spacing={2}
            >
              {!loading &&
                Object.entries(
                  summarize(
                    data.plots.filter((p) => p.name === "Project Progress")[0]
                      .dataset
                  )
                ).map(([k, v]) => (
                  <Chip
                    variant="outlined"
                    label={`${k} has saved ${v} dataset items`}
                  />
                ))}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            {loading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : (
              data.plots
                .sort((a, b) => a.index - b.index)
                .map((plot) => {
                  const hasDataset = plot.dataset.length > 0;
                  let Component;
                  if (hasDataset) {
                    Component = (
                      <>
                        <Box p="1rem 2rem">
                          <Stack direction="column">
                            <Typography variant="button">
                              {plot.name}
                            </Typography>
                            <Typography variant="caption" gutterBottom>
                              {plot.caption}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box>
                          <Divider flexItem />
                        </Box>
                        <DashboardBarChart
                          data={plot.dataset}
                          index={plot.index}
                          metadata={plot.meta}
                          hasBrush={plot.dataset.length > 20}
                          hasLabel={!["Flags", "Social"].includes(plot.name)}
                        />
                      </>
                    );
                  } else {
                    Component = (
                      <Alert severity="info" variant="outlined">
                        <AlertTitle>
                          No data available for {plot.name.toLowerCase()} plot
                        </AlertTitle>
                        {plot.no_data_title}
                      </Alert>
                    );
                  }
                  return (
                    <Grid
                      item
                      xs={12}
                      md={12}
                      lg={12}
                      mb={2}
                      component={hasDataset && Paper}
                      variant="outlined"
                    >
                      {Component}
                    </Grid>
                  );
                })
            )}
          </Grid>
        </>
      )}
    </>
  );
};

export default Overview;
