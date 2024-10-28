import React, { useEffect, useState, useContext } from "react";
import {
  Grid,
  Stack,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Box,
  Divider,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Collapse,
  Skeleton,
  IconButton,
} from "@mui/material";
import HelpCenterIcon from "@mui/icons-material/HelpCenter";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useParams, useNavigate } from "react-router-dom";
import { teal, grey } from "@mui/material/colors";
import LocationSearchingIcon from "@mui/icons-material/LocationSearching";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SaveIcon from "@mui/icons-material/Save";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import SettingsIcon from "@mui/icons-material/Settings";
import axios from "axios";

import Filters from "./Filters";
import Contextualiser from "./Contextualiser";

import { ProjectContext } from "../../../shared/context/ProjectContext";

const LinearProgressWithLabel = ({ value, title }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", height: "20px" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={value}
          title={title}
          sx={{ height: "20px" }}
        />
      </Box>
      <Box sx={{ minWidth: 35, height: "100%" }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          value
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

const Sidebar = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [state, dispatch] = useContext(ProjectContext);
  const [expand, setExpand] = useState(false);
  const [quickFilterApplied, setQuickFilterApplied] = useState(false);

  const savePending =
    state.texts &&
    Object.values(state.texts).filter((text) => text.saved).length !==
      Object.values(state.texts).length;

  const handleExpand = () => {
    setExpand(!expand);
  };

  const handleQuickFilter = () => {
    // Set filter and trigger reload of texts...
    dispatch({
      type: "SET_VALUE",
      payload: {
        filters: {
          ...state.filters,
          searchTerm: quickFilterApplied ? "" : state.selectedTokenValue,
        },
      },
    });
    dispatch({ type: "SET_PAGE", payload: 1 });
    navigate(`/project/${state.projectId}/page=1`);
    setQuickFilterApplied(!quickFilterApplied);
  };

  useEffect(() => {
    // Allows user to jump between selections
    setQuickFilterApplied(false);
  }, [state.selectedTokenValue]);

  const handlePageSave = async () => {
    axios
      .patch("/api/text/save", {
        textIds: Object.keys(state.texts),
        saved: true,
      })
      .then((response) => {
        if (response.status === 200) {
          dispatch({
            type: "SAVE_TEXTS",
            payload: { textIds: Object.keys(state.texts), saveState: true },
          });
        }
      })
      .catch((error) => console.log(`Error: ${error}`));

    axios
      .get(`/api/project/progress/${projectId}`)
      .then((response) => {
        if (response.status === 200) {
          dispatch({ type: "SET_VALUE", payload: response.data });
        }
      })
      .catch((error) => console.log(`Error: ${error}`));
  };

  return (
    <React.Fragment>
      <Grid item container direction="column" justifyContent="space-apart">
        <Box>
          <LinearProgressWithLabel
            value={state.progress.value}
            title={state.progress.title}
          />
        </Box>
        <Divider />
        <List>
          <ListItem
            key="save-btn"
            disablePadding
            title="Click to toggle between annotation modes"
          >
            <ListItemButton onClick={handlePageSave}>
              <ListItemIcon
                sx={{
                  color: savePending ? teal[500] : grey[500],
                }}
              >
                <SaveIcon />
              </ListItemIcon>
              <ListItemText primary={"Save page"} />
            </ListItemButton>
          </ListItem>
          {state.project.parallelCorpus && (
            <ListItem
              key="reference-switch-btn"
              disablePadding
              title="Click to show/hide reference texts"
              onClick={() =>
                dispatch({
                  type: "SET_VALUE",
                  payload: { showReferences: !state.showReferences },
                })
              }
            >
              <ListItemButton>
                <ListItemIcon
                  sx={{
                    color: state.showReferences ? teal[500] : grey[500],
                  }}
                >
                  {state.showReferences ? <ToggleOnIcon /> : <ToggleOffIcon />}
                </ListItemIcon>
                <ListItemText primary={"Show Reference Texts"} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
        <Divider />
      </Grid>
      <List>
        <ListItemButton onClick={handleExpand}>
          <ListItemIcon>
            <FilterListIcon />
          </ListItemIcon>
          <ListItemText primary="Filters" />
          {expand ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expand} timeout="auto" unmountOnExit>
          <Filters />
        </Collapse>
      </List>
      <Divider />
      <List>
        <ListItem disabled={state.selectedTokenValue === null}>
          <ListItemIcon>
            <HelpCenterIcon />
          </ListItemIcon>
          <ListItemText primary={"Contextual Help"} />
        </ListItem>
        <Contextualiser />
      </List>
      <Divider />
      <List>
        <ListItemButton
          disabled={state.selectedTokenValue === null}
          title="Search for the currently selected token"
          onClick={handleQuickFilter}
        >
          <ListItemIcon>
            <LocationSearchingIcon />
          </ListItemIcon>
          <ListItemText
            primary={
              state.selectedTokenValue !== null
                ? `Quick Filter (${
                    state.selectedTokenValue !== null
                      ? state.selectedTokenValue
                      : ""
                  })`
                : "Quick Filter"
            }
            secondary={
              state.selectedTokenValue !== null
                ? `${quickFilterApplied ? "click to undo" : "click to apply"}`
                : ""
            }
          />
        </ListItemButton>
      </List>
      <Divider />
      <List>
        <ListItemButton
          disabled
          // component={Link}
          // to={`/dashboard/${projectId}/overview`}
          title="Click to access annotation settings"
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary={"Settings"} />
        </ListItemButton>
        <ListItemButton
          disabled
          component={Link}
          to={`/dashboard/${projectId}/overview`}
          title="Click to go to project dashboard"
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary={"Dashboard"} />
        </ListItemButton>
        <ListItemButton
          title="Click to logout"
          //   onClick={() => logout({ returnTo: window.location.origin })}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={"Logout"} />
        </ListItemButton>
      </List>
      <Divider />
      <List>
        <ListItem>
          <ListItemText>
            <Stack direction="row" alignItems="center" justifyContent="center">
              <AccountCircleIcon
                sx={{ fontSize: "1.25rem", marginRight: "0.25rem" }}
              />
              <Typography
                sx={
                  {
                    //   color: user && user["https://example.com/color"],
                  }
                }
              >
                {/* {user && user["https://example.com/username"]} */}
              </Typography>
            </Stack>
          </ListItemText>
        </ListItem>
      </List>
    </React.Fragment>
  );
};

export default Sidebar;
