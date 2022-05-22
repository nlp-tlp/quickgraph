import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectInvitations,
  acceptInvitation,
  declineInvitation,
} from "../auth/userSlice";
import { setIdle as setFeedIdle } from "../feed/feedSlice";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { IoNotifications } from "react-icons/io5";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import {
  Menu,
  MenuItem,
  Button,
  Badge,
  IconButton,
  Divider,
} from "@mui/material";

export const NotificationBell = () => {
  const dispatch = useDispatch();
  const invitations = useSelector(selectInvitations);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleInviteAccept = (projectId) => {
    // console.log("accepted invitation", projectId);
    dispatch(acceptInvitation({ projectId: projectId }));
    dispatch(setFeedIdle());
  };

  const handleInviteDecline = (projectId) => {
    // console.log("declined invitation");
    dispatch(declineInvitation({ projectId: projectId }));
  };

  return (
    <>
      <IconButton
        aria-label="invitations"
        id="bell-button"
        aria-controls={open ? "bell-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <Badge
          badgeContent={invitations && invitations.length}
          color="primary"
          max={9}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="bell-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "bell-button",
        }}
      >
        <MenuItem style={{ fontWeight: "bold" }}>Notifications</MenuItem>
        <Divider />

        {invitations && invitations.length > 0 ? (
          invitations.map((invite) => (
            <MenuItem>
              <div>
                {/* <NotificationsActiveIcon /> */}
                <span style={{ fontSize: "0.75rem" }}>
                  Invitation to join <strong>{invite.project.name}</strong>
                </span>
                <div style={{ display: "flex", justifyContent: "right" }}>
                  <Button
                    color="success"
                    style={{ fontSize: "0.7rem" }}
                    onClick={() => handleInviteAccept(invite.project._id)}
                  >
                    Accept
                  </Button>
                  <Button
                    color="error"
                    style={{ fontSize: "0.7rem" }}
                    onClick={() => handleInviteDecline(invite.project._id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </MenuItem>
          ))
        ) : (
          <MenuItem>No new notifications</MenuItem>
        )}
      </Menu>
    </>
  );

  // return (
  //   <span id="notification-bell-container">
  //     <OverlayTrigger
  //       trigger="click"
  //       placement="bottom"
  //       rootClose
  //       overlay={
  //         <Popover id="notification-popover-container">
  //           <Popover.Title>Notifications</Popover.Title>
  //           <Popover.Content id="notification-popover-content">
  //             <div id="notification-popover-content-container">
  //               {invitations && invitations.length > 0 ? (
  //                 invitations.map((invite) => (
  //                   <>
  //                     <span id="notification-popover-content-text">
  //                       You have been invited to the project:{" "}
  //                       <strong>{invite.project.name}</strong>
  //                     </span>
  //                     {/* <div id="notification-popover-content-btn-group">
  //                       <Button
  //                         id="notification-popover-content-btn"
  //                         variant="danger"
  // onClick={() =>
  //   handleInviteDecline(invite.project._id)
  // }
  //                       >
  //                         Decline
  //                       </Button>
  //                       <Button
  //                         id="notification-popover-content-btn"
  //                         variant="success"
  // onClick={() => handleInviteAccept(invite.project._id)}
  //                       >
  //                         Accept
  //                       </Button>
  //                     </div> */}
  //                   </>
  //                 ))
  //               ) : (
  //                 <span>No new notifications</span>
  //               )}
  //             </div>
  //           </Popover.Content>
  //         </Popover>
  //       }
  //     >
  //       <IoNotifications id="notification-bell-icon" />
  //     </OverlayTrigger>
  //     {invitations && invitations.length > 0 && (
  //       <span
  //         id="notification-bell-icon-number"
  //         onClick={() => console.log("hello world")}
  //       >
  //         {invitations && invitations.length}
  //       </span>
  //     )}
  //   </span>
  // );
};
