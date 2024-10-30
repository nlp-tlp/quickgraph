import {
  Stack,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AppsIcon from "@mui/icons-material/Apps";
import { Link, useLocation } from "react-router-dom";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";

import { PrimaryNavItems, RedirectMenuItems } from "./data";
import ListItemWithChildren from "./ListItemWithChildren";
import UserListItem from "./UserListItem";
import { useAuth } from "../../../context/AuthContext";
import { useAuthRedirect } from "../../../hooks/useAuthRedirect";

const Sidebar = ({ open, setOpen }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { logoutWithRedirect } = useAuthRedirect();
  const location = useLocation();

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      sx={{ height: "100vh", bgcolor: theme.palette.neutral.light }}
    >
      <Box>
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "left" }}
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
              sx={{ textDecoration: "none" }}
              direction="row"
              justifyContent={open ? "left" : "center"}
              alignItems="center"
              width="100%"
              spacing={open ? 2 : 0}
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
        <Box pl={open ? 2 : 0}>
          <List>
            {PrimaryNavItems.map((item, index) =>
              item.children ? (
                <ListItemWithChildren
                  menuOpen={open}
                  index={index}
                  item={item}
                  location={location}
                />
              ) : (
                <Tooltip title={item.title} placement="right">
                  <ListItem
                    disablePadding
                    key={`primary-menu-item-${index}`}
                    sx={{ display: "block" }}
                  >
                    <ListItemButton
                      component={Link}
                      to={item.href}
                      selected={location.pathname.startsWith(item.href)}
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
                        {item.icon}
                      </ListItemIcon>
                      {open ? <ListItemText>{item.name}</ListItemText> : null}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )
            )}
          </List>
        </Box>
      </Box>
      <Box>
        <Box pl={open ? 2 : 0}>
          <List>
            {RedirectMenuItems.map((item, index) => (
              <Tooltip title={item.title} placement="right">
                <ListItem disablePadding key={`redirect-menu-item-${index}`}>
                  <ListItemButton
                    component="a"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
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
                      {item.icon}
                    </ListItemIcon>
                    {open ? <ListItemText>{item.name}</ListItemText> : null}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            ))}
            <Tooltip title="Click to access account settings" placement="right">
              <ListItem disablePadding key={"item-account-settings"}>
                <ListItemButton
                  component={Link}
                  to={"/profile"}
                  selected={location.pathname.startsWith("/profile")}
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
                    <AccountCircleIcon />
                  </ListItemIcon>
                  {open ? <ListItemText>Account Settings</ListItemText> : null}
                </ListItemButton>
              </ListItem>
            </Tooltip>
            <Tooltip title="Click to logout" placement="right">
              <ListItem disablePadding>
                <ListItemButton
                  onClick={logoutWithRedirect}
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
                  {open ? <ListItemText>Logout</ListItemText> : null}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          </List>
        </Box>
        <Divider variant="middle" />
        <UserListItem open={open} user={user} />
      </Box>
    </Stack>
  );
};

export default Sidebar;
