import { useState, useContext } from "react";
import {
  Stack,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Avatar,
  IconButton,
  Button,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useParams } from "react-router-dom";
import SaveIcon from "@mui/icons-material/Save";
import { useAuth0 } from "@auth0/auth0-react";
import { ProjectContext } from "../../../shared/context/ProjectContext";
import AppsIcon from "@mui/icons-material/Apps";
import HomeIcon from "@mui/icons-material/Home";
import { useTheme } from "@mui/material/styles";
import ModeToggleButton from "./ModeToggleButton";
import InteractiveAnnotationContainer from "./InteractiveAnnotationContainer";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";

const PrimarySidebar = ({ open, setOpen }) => {
  const theme = useTheme();
  const { state, dispatch, handleSave } = useContext(ProjectContext);
  const { logout, user } = useAuth0();
  const { projectId } = useParams();

  const unsavedItemsCount =
    state.texts &&
    Object.keys(state.texts).length -
      Object.values(state.texts).filter((text) => text.saved).length;

  const savePending = unsavedItemsCount !== 0;

  const username = user ? user["https://example.com/username"] : "";
  const email = user ? user["name"] : "";
  const color = user
    ? user["https://example.com/color"]
    : theme.palette.primary.main;

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      sx={{ height: "100vh", backgroundColor: theme.palette.neutral.light }}
    >
      <Box>
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "left" }}
          p={4}
        >
          <Stack
            direction="row"
            justifyContent="space-apart"
            sx={{ width: "100%" }}
          >
            <Stack
              direction="row"
              justifyContent="left"
              alignItems="center"
              width="100%"
              spacing={2}
            >
              <AppsIcon sx={{ color: theme.palette.primary.main }} />
              <Typography
                variant="h6"
                color={theme.palette.primary.dark}
                sx={{
                  fontWeight: 700,
                  textDecoration: "none",
                }}
                as={Link}
                to="/"
              >
                QuickGraph
              </Typography>
            </Stack>
            <Tooltip
              title="Click to toggle menu minification"
              placement="right"
            >
              <IconButton onClick={() => setOpen(!open)} size="small">
                {open ? <MenuOpenIcon /> : <MenuIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <Divider />
        <Box>
          <Box pl={2}>
            <List dense>
              <Tooltip
                title="Double click to save all dataset items on the current page"
                placement="right"
              >
                <ListItemButton
                  onDoubleClick={() => handleSave(Object.keys(state.texts))}
                  sx={{
                    minHeight: 48,
                    justifyContent: "initial",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: "center",
                      mr: 4,
                    }}
                  >
                    <SaveIcon color={savePending ? "primary" : "default"} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Save Page ${
                      savePending ? "(" + unsavedItemsCount + ")" : ""
                    }`}
                  />
                </ListItemButton>
              </Tooltip>
              <ModeToggleButton state={state} dispatch={dispatch} />
            </List>
          </Box>
        </Box>
        <Divider />
        <Box
          sx={{
            height: open ? "calc(100vh - 482px)" : "calc(100vh - 338px)",
            overflowY: "auto",
            bgcolor: "white",
          }}
        >
          <InteractiveAnnotationContainer
            state={state}
            dispatch={dispatch}
            open={open}
          />
        </Box>
        <Divider />
      </Box>
      <Box>
        <Box pl={open ? 2 : 0}>
          <List dense>
            <Stack direction={open ? "column" : "row"}>
              <Tooltip
                title="Click to show keyboard shortcuts"
                placement="right"
              >
                <ListItemButton
                  onClick={() =>
                    dispatch({
                      type: "SET_VALUE",
                      payload: { showShortcutModal: true },
                    })
                  }
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: "center",
                      mr: open ? 4 : 0,
                    }}
                  >
                    <ShortcutIcon />
                  </ListItemIcon>
                  {open ? (
                    <ListItemText primary={"Keyboard Shortcuts"} />
                  ) : null}
                </ListItemButton>
              </Tooltip>
              <Tooltip
                title="Click to navigate to the project dashboard"
                placement="right"
              >
                <ListItemButton
                  component={Link}
                  to={`/dashboard/${projectId}/overview`}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: "center",
                      mr: open ? 4 : 0,
                    }}
                  >
                    <DashboardIcon />
                  </ListItemIcon>
                  {open ? <ListItemText primary={"Dashboard"} /> : null}
                </ListItemButton>
              </Tooltip>
              <Tooltip title="Click to return home" placement="right">
                <ListItemButton
                  component={Link}
                  to={"/home"}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: "center",
                      mr: open ? 4 : 0,
                    }}
                  >
                    <HomeIcon />
                  </ListItemIcon>
                  {open ? <ListItemText primary={"Return Home"} /> : null}
                </ListItemButton>
              </Tooltip>
              <Tooltip title="Click to logout" placement="right">
                <ListItemButton
                  onClick={() => logout({ returnTo: window.location.origin })}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: "center",
                      mr: open ? 4 : 0,
                    }}
                  >
                    <LogoutIcon />
                  </ListItemIcon>
                  {open ? <ListItemText primary={"Logout"} /> : null}
                </ListItemButton>
              </Tooltip>
            </Stack>
          </List>
        </Box>
        <Divider variant="middle" />
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="left"
          p={2}
        >
          <Avatar sx={{ bgcolor: color }}>{username[0]}</Avatar>
          <Stack direction="column" alignItems="left" maxWidth="100%">
            <Typography
              variant="body2"
              sx={{ wordWrap: "break-word", fontWeight: 600 }}
            >
              {username}
            </Typography>
            <Typography
              variant="caption"
              sx={{ wordWrap: "break-word", maxWidth: 200 }}
            >
              {email}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};

export default PrimarySidebar;
