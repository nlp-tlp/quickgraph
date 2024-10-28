import { useState, useEffect } from "react";
import moment from "moment";
import {
  Menu,
  MenuItem,
  Badge,
  IconButton,
  Divider,
  Stack,
  Typography,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Box,
} from "@mui/material";
import useNotifications from "../hooks/api/notifications";
import { useTheme } from "@mui/material/styles";
import { MenuZIndex } from "../constants/layout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const NotificationBell = () => {
  const theme = useTheme();
  const {
    loading,
    error,
    data,
    fetchNotifications,
    acceptNotification,
    declineNotification,
  } = useNotifications();

  const unreadNotifications = Array.isArray(data)
    ? data.filter((i) => !i.seen)
    : [];

  const userHasNotifications = unreadNotifications.length > 0;

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    fetchNotifications();

    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (loading) {
      fetchNotifications();
    }
  }, [loading]);

  return (
    <>
      <Tooltip title="Click to view your notifications">
        <IconButton
          aria-label="notifications"
          id="bell-button"
          aria-controls={open ? "bell-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          sx={{
            border: "1px solid",
            width: "34px",
            height: "34px",
            borderRadius: "4px",
            borderColor: "#E0E3E7",
            color: theme.palette.primary.main,
            fontSize: "1.5rem",
          }}
        >
          <Badge
            badgeContent={unreadNotifications && unreadNotifications.length}
            color="primary"
            max={9}
          >
            {userHasNotifications ? (
              <NotificationsActiveIcon fontSize="1.5rem" />
            ) : (
              <NotificationsIcon fontSize="1.5rem" />
            )}
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        MenuListProps={{
          "aria-labelledby": "notifications-button",
        }}
        sx={{ zIndex: MenuZIndex }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
            maxWidth: 600,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box p={2} sx={{ textAlign: "left" }}>
          <Typography>
            Notifications ({unreadNotifications.length ?? 0})
          </Typography>
        </Box>
        <Divider />
        <List>
          {userHasNotifications ? (
            unreadNotifications.map((noti, index) => (
              <ListItem key={`noti-${index}`}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      textTransform: "capitalize",
                      bgcolor: theme.palette.primary.main,
                    }}
                  >
                    {noti.context[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${noti.context}: ${noti.detail.name}`}
                  secondary={
                    <>
                      <Typography
                        sx={{ display: "inline" }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        Sent by {noti.created_by}
                      </Typography>
                      {"  "}
                      {moment.utc(noti.created_at).fromNow()}
                    </>
                  }
                  primaryTypographyProps={{ textTransform: "capitalize" }}
                />
                <ListItemIcon>
                  <Stack direction="row" ml={2}>
                    <Tooltip title="Click to decline this invitation">
                      <IconButton
                        size="small"
                        onClick={() =>
                          declineNotification({ notificationId: noti.id })
                        }
                      >
                        <CancelIcon start="end" color="error" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Click to accept this invitation">
                      <IconButton
                        size="small"
                        onClick={() =>
                          acceptNotification({ notification: noti })
                        }
                      >
                        <CheckCircleIcon start="end" color="success" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItemIcon>
              </ListItem>
            ))
          ) : (
            <MenuItem>No new notifications</MenuItem>
          )}
        </List>
      </Menu>
    </>
  );
};

export default NotificationBell;
