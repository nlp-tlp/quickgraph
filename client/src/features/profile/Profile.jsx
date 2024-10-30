import { useEffect, useState } from "react";
import { grey, teal, orange, purple, blue, green } from "@mui/material/colors";
import { getFontColor } from "../../shared/utils/text";
import {
  Grid,
  Stack,
  TextField,
  Avatar,
  Typography,
  Button,
  IconButton,
  Box,
  Divider,
  Tooltip,
} from "@mui/material";
import moment from "moment";
import ErrorAlert from "../../shared/components/ErrorAlert";
import useProfile from "../../shared/hooks/api/profile";
import MainContainer from "../../shared/components/Layout/MainContainer";

const Profile = () => {
  const { loading, data, error, getProfile, updateProfile } = useProfile();
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (loading) {
        getProfile();
      }
    };
    fetchProfile();
  }, [loading]);

  useEffect(() => {
    if (!loading && data) {
      setSelectedColor(data.color);
    }
  }, [loading]);

  const handleUpdate = () => {
    updateProfile({ body: { color: selectedColor } });
  };

  if (error) {
    return <ErrorAlert details={"Unable to fetch user profile."} />;
  } else {
    return (
      <MainContainer>
        <Grid item container xs={12}>
          <Grid item container xs={12} alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Stack direction="column">
                <Typography variant="h6">Username</Typography>
                <Typography variant="caption">
                  Update your publicly visible username
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={8} xl={6}>
              <Tooltip title="Usernames are currently not modifiable" arrow>
                <TextField
                  key="profile-username-textfield"
                  type="text"
                  margin="normal"
                  fullWidth
                  placeholder="Username"
                  value={data?.username}
                  autoComplete="false"
                  InputProps={{
                    readOnly: true,
                  }}
                  disabled={loading}
                />
              </Tooltip>
            </Grid>
          </Grid>
          <Box sx={{ width: "100%" }} p="2rem 0rem">
            <Divider />
          </Box>
          <Grid item container xs={12} alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Stack direction="column">
                <Typography variant="h6">Email Address</Typography>
                <Typography variant="caption">
                  Update the email address associated with this acount
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={8} xl={6}>
              <Tooltip
                title="Email addresses are currently not modifiable"
                arrow
              >
                <TextField
                  key="profile-email-textfield"
                  type="email"
                  margin="normal"
                  fullWidth
                  placeholder="Email"
                  value={data?.email}
                  autoComplete="false"
                  InputProps={{
                    readOnly: true,
                  }}
                  disabled={loading}
                />
              </Tooltip>
            </Grid>
          </Grid>
          <Box sx={{ width: "100%" }} p="2rem 0rem">
            <Divider />
          </Box>
          <Grid item container xs={12} alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Stack direction="column">
                <Typography variant="h6">Avatar Color</Typography>
                <Typography variant="caption">
                  Update the color of your personal avatar
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={8}>
              <ColorPicker
                loading={loading}
                username={data?.username}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
              />
            </Grid>
          </Grid>
          <Box sx={{ width: "100%" }} p="2rem 0rem">
            <Divider />
          </Box>
          <Grid item xs={12}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                width: "100%",
              }}
            >
              <Typography variant="caption">
                Last Updated: {moment.utc(data?.updated_at).fromNow()}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" color="secondary" disabled>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdate}
                  disabled={loading}
                >
                  Update
                </Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </MainContainer>
    );
  }
};

const ColorPicker = ({
  loading,
  username = "Avatar",
  selectedColor,
  setSelectedColor,
}) => {
  const level = 500;
  const colors = {
    grey: grey[level],
    orange: orange[level],
    green: green[level],
    blue: blue[level],
    teal: teal[level],
    purple: purple[level],
  };

  return (
    <Stack direction="row" spacing={2} justifyContent="space-between" p={2}>
      {Object.keys(colors).map((name, index) => (
        <IconButton
          onClick={() => {
            setSelectedColor(colors[name]);
          }}
          key={`color-${name}-${index}`}
          disabled={loading}
        >
          <Tooltip
            title={`Click to change avatar color to ${name}`}
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: colors[name],
                  color: getFontColor(colors[name]),
                  "& .MuiTooltip-arrow": {
                    color: colors[name],
                  },
                },
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: colors[name],
                opacity: selectedColor === colors[name] ? 1 : 0.25,
                color: getFontColor(colors[name]),
              }}
            >
              {username[0]}
            </Avatar>
          </Tooltip>
        </IconButton>
      ))}
    </Stack>
  );
};

export default Profile;
