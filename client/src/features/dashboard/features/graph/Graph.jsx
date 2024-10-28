/**
 * Features:
 * - Add fullscreen button that puts graph into modal
 * - Allow view of multiple annotators unique graphs at once - probably bad idea?
 * - Stop links from overlapping when relations between same nodes
 * - Allow user to download screenshot (png,svg) of the graph
 * - Allow user to modify physics of graph
 */
import { useEffect, useContext, useState, useRef } from "react";
import {
  Grid,
  Box,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  Divider,
  Alert,
  AlertTitle,
} from "@mui/material";
import Filter from "./Filter/Filter";
import { useParams } from "react-router-dom";
import { GraphContext } from "../../../../shared/context/graph-context";
import ForceGraph from "./ForceGraph";
import { alpha, useTheme } from "@mui/material/styles";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
// import html2canvas from "html2canvas";

const Graph = () => {
  const theme = useTheme();
  const { state, fetchGraph } = useContext(GraphContext);
  const { projectId } = useParams();
  const [graphSize, setGraphSize] = useState({ width: 800, height: 800 });
  // const divRef = useRef(null);

  useEffect(() => {
    if (state.loading) {
      fetchGraph({ projectId: projectId });
    }
  }, [state.loading]);

  return (
    <Grid container spacing={0}>
      <Grid item xs={9}>
        <Box m={1} as={Paper} variant="outlined">
          <Stack direction="column" spacing={2} p={2}>
            <Stack direction="row" spacing={2}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "1px solid",
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.25),
                  }}
                  mr={1}
                />
                <Typography fontSize={14}>Silver Entity</Typography>
              </Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: alpha(theme.palette.primary.main, 0.25),
                    border: "1px dashed",
                    borderColor: theme.palette.primary.main,
                  }}
                  mr={1}
                />
                <Typography fontSize={14}>Weak Entity</Typography>
              </Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
              >
                <Box
                  sx={{
                    height: 0,
                    width: 16,
                    border: "1px solid",
                    borderColor: theme.palette.neutral.main,
                  }}
                  mr={1}
                />
                <Typography fontSize={14}>Silver Relation</Typography>
              </Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
              >
                <Box
                  sx={{
                    height: 0,
                    width: 16,
                    border: "1px dashed",
                    borderColor: theme.palette.neutral.main,
                  }}
                  mr={1}
                />
                <Typography fontSize={14}>Weak Relation</Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>
        <Box
          m={1}
          as={Paper}
          variant="outlined"
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            height: graphSize.height,
            ...(state.loading
              ? {
                  borderStyle: "dotted",
                  borderColor: theme.palette.primary.main,
                }
              : {}),
          }}
        >
          {state.loading ? (
            <Stack
              direction="column"
              spacing={2}
              justifyContents="center"
              alignItems="center"
            >
              <Typography variant="button" color="primary">
                Fetching annotations to create project knowledge graph... Please
                Wait
              </Typography>
              <CircularProgress />
            </Stack>
          ) : Object.keys(state.data.nodes).length === 0 ? (
            <Box p={4}>
              <Alert severity="info" variant="outlined">
                <AlertTitle>Nothing Found</AlertTitle>
                Either no data exists, the filters have not returned anything,
                or no dataset items have the minimum number of annotators.
              </Alert>
            </Box>
          ) : (
            <ForceGraph {...graphSize} data={state.data} />
            // <div ref={divRef}>
            // </div>
          )}
        </Box>
      </Grid>
      <Grid item xs={3}>
        <Box m={1} as={Paper} variant="outlined">
          <Box p={2}>
            <Typography fontWeight={500}>Filters</Typography>
          </Box>
          <Divider />
          <Filter data={state.data} />
        </Box>
        <Box m={1} as={Paper} variant="outlined">
          <Box p={2}>
            <Typography fontWeight={500}>Details</Typography>
          </Box>
          <Divider />
          <Stack
            direction="row"
            justifyContent="space-evenly"
            alignItems="center"
            spacing={2}
            p={2}
          >
            {["nodes", "links"].map((name, index) => (
              <Stack
                key={index}
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography fontSize={12} fontWeight={500}>
                  {(state.data?.[name] &&
                    Object.keys(state.data[name]).length) ??
                    "N/A"}
                </Typography>
                <Typography
                  fontSize={12}
                  sx={{ textTransform: "capitalize" }}
                  color="neutral.main"
                >
                  {name}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        {/* <Box m={1}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Chip
              label="Save as SVG"
              icon={<CameraAltIcon />}
              clickable
              onClick={saveDivAsSvg}
            />
            <Chip label="Save as PNG" icon={<CameraAltIcon />} clickable />
          </Stack>
        </Box> */}
      </Grid>
    </Grid>
  );
  // }
};

export default Graph;
