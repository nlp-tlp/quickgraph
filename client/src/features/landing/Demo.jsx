import { useState, useEffect, useContext, useCallback } from "react";
import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Stack,
  Divider,
  ListItemButton,
  ListItemIcon,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
} from "@mui/material";
import { LandingContext } from "../../shared/context/landing-context";
import { Table as AnnotationTable } from "../project/Table";
import useHandleCRUDAction from "../../shared/hooks/api/project";
import ModeToggleButton from "../project/PrimarySidebar/ModeToggleButton";
import InteractiveAnnotationContainer from "../project/PrimarySidebar/InteractiveAnnotationContainer";
import { SidebarColor } from "../../shared/constants/layout";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import HubIcon from "@mui/icons-material/Hub";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import Graph from "../dashboard/features/Graph";

import useLanding from "../../shared/hooks/api/landing";

const Demo = () => {
  const [state, dispatch] = useContext(LandingContext);
  const { loading, error, fetchData } = useLanding({
    state,
    dispatch,
  });
  const [showGraph, setShowGraph] = useState(false);
  const [graphLoaded, setGraphLoaded] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [initialCenter, setInitialCenter] = useState(false);
  const [height, setHeight] = useState();
  const [width, setWidth] = useState();

  const graphBoxRef = useCallback((node) => {
    if (node !== null) {
      const height = node.offsetHeight;
      const width = node.offsetWidth;
      setHeight(height);
      setWidth(width);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      fetchData();
    }
  }, [loading]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stack
          direction="row"
          spacing={4}
          alignItems="center"
          width={400}
          as={Paper}
          p={2}
          variant="outlined"
          sx={{
            borderColor: "primary.light",
          }}
        >
          <CircularProgress />
          <Stack direction="column" spacing={1}>
            <Typography variant="h6">Hang Tight!</Typography>
            <Typography>
              Preparing QuickGraph annotation demonstration
            </Typography>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{ width: "100%", heigh: "100%" }}
      as={Paper}
      varaint="outlined"
      elevation={4}
    >
      <Grid container>
        <Grid
          item
          xs={3}
          sx={{
            backgroundColor: SidebarColor,
            borderRight: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          <List>
            <ModeToggleButton state={state} dispatch={dispatch} />
          </List>
          <Divider />
          <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
            <InteractiveAnnotationContainer
              state={state}
              dispatch={dispatch}
              demo={true}
            />
            {/* <p>InteractiveAnnotationContainer</p> */}
          </Box>
          <Divider />
          <List>
            <ListItemButton
              title="Click to show knowledge graph"
              onClick={() => setShowGraph(!showGraph)}
            >
              <ListItemIcon>
                {showGraph ? <FormatListNumberedIcon /> : <HubIcon />}
              </ListItemIcon>
              <ListItemText
                primary={showGraph ? "Show Annotations" : "Show Graph"}
              />
            </ListItemButton>
            <ListItemButton
              title="Click to clear all annotations"
              onClick={fetchData}
            >
              <ListItemIcon>
                <RestartAltIcon />
              </ListItemIcon>
              <ListItemText primary={"Reset"} />
            </ListItemButton>
          </List>
        </Grid>
        <Grid item xs={9} ref={graphBoxRef} sx={{ height: 600 }}>
          {showGraph ? (
            state.graphData ? (
              <Graph
                state={state}
                width={!width ? 400 : width}
                height={!height ? 400 : height}
                graphLoaded={graphLoaded}
                initialCenter={initialCenter}
                setInitialCenter={setInitialCenter}
                setLoading={setGraphLoading}
              />
            ) : (
              <div>loading...</div>
            )
          ) : (
            <AnnotationTable state={state} dispatch={dispatch} demo={true} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Demo;
