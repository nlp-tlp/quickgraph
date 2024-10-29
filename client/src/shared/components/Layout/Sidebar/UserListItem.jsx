import React from "react";
import { Avatar, Stack, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const UserListItem = ({ open, user }) => {
  const theme = useTheme();
  const username = user?.username ?? "";
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      justifyContent={open ? "left" : "center"}
      p={2}
    >
      <Tooltip title={`Logged in as: ${username}`} placement="right">
        <Avatar
          sx={{
            bgcolor: user?.color ?? theme.palette.primary.main,
            cursor: "help",
          }}
        >
          {username[0]}
        </Avatar>
      </Tooltip>
      {open ? (
        <>
          <Stack direction="column" alignItems="left" width="100%">
            <Typography
              variant="body2"
              sx={{ wordWrap: "break-word", fontWeight: 600 }}
            >
              {username}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "inline",
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {user?.name ?? ""}
            </Typography>
          </Stack>
        </>
      ) : null}
    </Stack>
  );
};

export default UserListItem;
