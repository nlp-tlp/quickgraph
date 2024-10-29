import { useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Stack,
  IconButton,
  Avatar,
  Chip,
  Modal,
  TextField,
  Button,
  Skeleton,
  Paper,
} from "@mui/material";
import { DashboardContext } from "../../shared/context/dashboard-context";
import { useTheme } from "@mui/material/styles";
import HomeIcon from "@mui/icons-material/Home";
import AppsIcon from "@mui/icons-material/Apps";
import LogoutIcon from "@mui/icons-material/Logout";
import { getComponents } from "./data";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "../../shared/context/AuthContext";

const PrimarySidebar = ({ open, setOpen }) => {
  const { state, dispatch } = useContext(DashboardContext);
  const { projectId, view } = useParams();
  const { logout, user } = useAuth();
  const theme = useTheme();

  const [openModal, setOpenModal] = useState(false);
  const handleModalClose = () => setOpenModal(false);
  const handleModalOpen = () => setOpenModal(true);

  const username = user?.username ?? "";
  const email = user?.email ?? "";
  const color = user?.color ?? theme.palette.primary.main;

  const components = getComponents({ state, dispatch });

  return (
    <>
      <DeleteModal open={openModal} handleClose={handleModalClose} />
      <Stack
        direction="column"
        justifyContent="space-between"
        sx={{ height: "100vh", backgroundColor: theme.palette.neutral.light }}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "left",
            }}
            p={open ? "2rem 1rem 2rem 2rem" : "2rem 1rem 2rem 1rem"}
          >
            <Stack
              direction={open ? "row" : "column"}
              alignItems="center"
              justifyContent={open ? "space-apart" : "center"}
              spacing={open ? 0 : 1}
              width="100%"
            >
              <Stack
                as={Link}
                to="/"
                direction="row"
                justifyContent={open ? "left" : "center"}
                alignItems="center"
                width="100%"
                spacing={open ? 2 : 0}
                sx={{
                  textDecoration: "none",
                }}
              >
                <AppsIcon sx={{ color: theme.palette.primary.main }} />
                {open ? (
                  <Typography
                    variant="h6"
                    color={theme.palette.primary.dark}
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    QuickGraph
                  </Typography>
                ) : null}
              </Stack>
              <Tooltip title="Click to toggle menu" placement="right">
                <IconButton onClick={() => setOpen(!open)} size="small">
                  {open ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            p="0rem 1rem 1rem 1rem"
          >
            <Tooltip title={`Project: ${state.name}`} placement="right">
              <Chip
                label={open ? state.name : state.name[0]}
                color="primary"
                variant="outlined"
                sx={{
                  bgcolor: theme.palette.bright.main,
                  width: 240,
                  textTransform: open ? null : "capitalize",
                  cursor: "help",
                }}
              />
            </Tooltip>
          </Box>
          <Box pl={open ? 2 : 0}>
            <List>
              {state.loading ? (
                <Skeleton variant="rectangular" height={40} />
              ) : (
                Object.keys(components)
                  .filter((key) => components[key].show)
                  .map((key, index) => {
                    return (
                      <Tooltip
                        key={`tooltip-${index}`}
                        title={components[key].description}
                        placement="right"
                      >
                        <ListItem key={index} disablePadding>
                          <ListItemButton
                            component={Link}
                            to={
                              components[key].href ??
                              `/dashboard/${projectId}/${key}`
                            }
                            selected={view === key}
                            disabled={components[key].disabled}
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
                              {components[key].icon}
                            </ListItemIcon>
                            {open ? (
                              <ListItemText primary={components[key].title} />
                            ) : null}
                          </ListItemButton>
                        </ListItem>
                      </Tooltip>
                    );
                  })
              )}
            </List>
          </Box>
        </Box>
        <Box>
          <Box pl={open ? 2 : 0}>
            <List>
              {!state.loading && !state.userIsPM && (
                <Tooltip
                  title="Click to remove yourself from this project. Your annotations will be deleted. Please be certain."
                  placement="right"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: theme.palette.error.main,
                        "& .MuiTooltip-arrow": {
                          color: theme.palette.error.main,
                        },
                      },
                    },
                  }}
                >
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={setOpenModal}
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
                        <PersonRemoveIcon color="inherit" />
                      </ListItemIcon>
                      {open ? <ListItemText primary={"Leave Project"} /> : null}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )}
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
            </List>
          </Box>
          <Divider variant="middle" />
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent={open ? "left" : "center"}
            p={2}
            sx={{ cursor: "help" }}
          >
            <Tooltip title={`Logged in as: ${username}`} placement="right">
              <Avatar sx={{ bgcolor: color }}>{username[0]}</Avatar>
            </Tooltip>
            {open ? (
              <>
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
              </>
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </>
  );
};

const DeleteModal = ({ open, handleClose }) => {
  const { state, handleRemoveAnnotator } = useContext(DashboardContext);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRemove = () => {
    handleRemoveAnnotator({
      username: user["https://example.com/username"],
      projectId: state.projectId,
      removeAnnotations: true,
      userIsLeaving: true,
    });
    navigate("/projects-explorer");
    handleClose();
  };

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 800,
    bgcolor: "background.paper",
    borderRadius: 4,
    boxShadow: 24,
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ ...style, borderColor: "red" }} as={Paper} variant="outlined">
        <Box p="1rem 2rem">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="column">
              <Typography variant="h6">Leave Project</Typography>
              <Typography variant="caption">
                Leaving this project is permanent and your annotations will be
                removed. <strong>Please be certain.</strong>
              </Typography>
            </Stack>
            <Chip
              label="esc"
              sx={{ fontWeight: 700, fontSize: 12 }}
              onClick={handleClose}
              variant="outlined"
              clickable
              color="primary"
            />
          </Stack>
        </Box>
        <Box>
          <Divider flexItem />
        </Box>
        <Box p="2rem 2rem">
          <Stack direction="row" alignItems="center" spacing={2}>
            <TextField
              label={`Enter ${state.name} to remove`}
              fullWidth
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              color="error"
            />
            <Button
              color="error"
              variant="contained"
              disabled={state.name !== name}
              onClick={handleRemove}
            >
              Leave
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default PrimarySidebar;
