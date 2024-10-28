import { useState } from "react";
import { Box, Grid, Typography, Paper } from "@mui/material";
import {
  UserInvitationField,
  UserList,
} from "../../../shared/components/UserInvitationField";
import useCreateProject from "../../../shared/hooks/api/createProject";
import { useAuth0 } from "@auth0/auth0-react";

export const Invite = ({ values, setValues }) => {
  const { user } = useAuth0();
  const { submitting, validateUsernames } = useCreateProject();
  const [usernames, setUsernames] = useState();
  const updateValue = (key, value) => {
    setValues((prevState) => ({ ...prevState, [key]: value }));
  };

  const setSelectedUsers = (usernames) => {
    updateValue("invitedUsers", usernames);
  };

  const removeSelectedUser = (username) => {
    updateValue(
      "invitedUsers",
      values.invitedUsers.filter((u) => u !== username)
    );
  };

  const handleInvite = async () => {
    // Sanitize usernames before sending to backend (user cannot invite themself)
    const usernamesToInvite = usernames
      .split(",")
      .map((name) => name.trim())
      .filter((u) => u !== user["https://example.com/username"]);
    // Validate usernames
    const validUsernames = await validateUsernames({
      usernames: usernamesToInvite,
    });
    // Set State
    if (validUsernames.length > 0) {
      setSelectedUsers([...values.invitedUsers, ...validUsernames]);
    }
    setUsernames("");
  };

  return (
    <Grid item xs={12} md={12} lg={10} xl={8}>
      <Box as={Paper} variant="outlined" p={2}>
        <UserInvitationField
          usernames={usernames}
          setUsernames={setUsernames}
          inviteFunction={handleInvite}
          submitting={submitting}
        />
        <Box mt={2} justifyContent="center" alignItems="center" display="flex">
          <Typography variant="caption">
            Document distribution can be set after project creation by visiting
            the annotators tab in the project dashboard
          </Typography>
        </Box>
        <Box p={2} sx={{ maxHeight: 200, overflowY: "auto" }}>
          <UserList
            usernames={values.invitedUsers}
            removeFunction={removeSelectedUser}
          />
        </Box>
      </Box>
    </Grid>
  );
};
