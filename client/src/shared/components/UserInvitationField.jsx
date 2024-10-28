/** General component for username retrieval */
import {
  Typography,
  Box,
  Paper,
  Stack,
  TextField,
  List,
  ListItem,
  Button,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import AddBoxIcon from "@mui/icons-material/AddBox";

export const UserInvitationField = ({
  usernames,
  setUsernames,
  inviteFunction,
  submitting,
}) => {
  // const [errorMessage, setErrorMessage] = useState();

  return (
    <Box as={Paper} variant="outlined" m="1rem 0rem">
      <Stack direction="column" width="100%" p={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Enter one or more usernames (separated by comma)"
            value={usernames}
            onChange={(e) => setUsernames(e.target.value)}
          />
          <LoadingButton
            variant="contained"
            loadingPosition="start"
            disabled={!usernames}
            onClick={inviteFunction}
            loading={submitting}
            startIcon={<AddBoxIcon />}
          >
            {submitting ? "Searching" : "Add"}
          </LoadingButton>
        </Stack>
        <Typography p={0.5} variant="caption">
          Only valid users will be invited to the project
        </Typography>
      </Stack>
    </Box>
  );
};

export const UserList = ({ usernames, removeFunction }) => {
  /** Usernames is a list of strings */

  if (usernames.length === 0) {
    return null;
  }
  return (
    <List>
      {usernames.map((username, index) => {
        const labelId = `user-list-item-${index}`;
        return (
          <ListItem
            key={labelId}
            secondaryAction={
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={() => removeFunction(username)}
                title="Click to remove user from being invited to this project"
              >
                Remove
              </Button>
            }
          >
            <ListItemAvatar>
              <Avatar>{username[0]}</Avatar>
            </ListItemAvatar>
            <ListItemText id={labelId} primary={username} />
          </ListItem>
        );
      })}
    </List>
  );
};
