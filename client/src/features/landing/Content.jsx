import {
  Button,
  Grid,
  Typography,
  Stack,
  Box,
  Container,
  Paper,
  Alert,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { grey } from "@mui/material/colors";
import Demo from "./Demo";

function Content({ minBreakpoint }) {
  return (
    <Container maxWidth="xl">
      <Box>
        <Grid
          container
          p={minBreakpoint ? 2 : 4}
          spacing={4}
          mb={minBreakpoint ? 4 : 0}
        >
          <Grid item xs={12} lg={4} pr={minBreakpoint ? 0 : 4}>
            <Stack
              direction="column"
              alignItems={minBreakpoint ? "center" : "left"}
              sx={{ textAlign: minBreakpoint ? "center" : "left" }}
              spacing={4}
            >
              <Typography
                variant="h3"
                sx={{ fontWeight: "bold", color: grey[900] }}
              >
                Quickly Build Knowledge Graphs from Text
              </Typography>
              <Typography
                variant="paragraph"
                sx={{ textAlign: minBreakpoint ? "center" : "justify" }}
              >
                QuickGraph is an annotation tool designed for rapid
                collaborative annotation of complex texts like those found in
                engineering and scientific domains.
              </Typography>
              {!minBreakpoint && (
                <Typography variant="paragraph" sx={{ textAlign: "justify" }}>
                  Like what you see? Make an account to access all of
                  QuickGraph's features such as annotation propagation!
                </Typography>
              )}
              <Box>
                <LoginButton />
              </Box>
            </Stack>
          </Grid>
          {!minBreakpoint && (
            <Grid item xs={12} lg={8}>
              <Alert color="error">
                Error: Demo WIP - need to update demo data to correct format
              </Alert>
              {/* <Box
                as={Paper}
                elevation={4}
                square
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Demo />
              </Box> */}
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
}

const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  if (isAuthenticated) {
    return (
      <Button
        variant="contained"
        component={Link}
        to="/home"
        endIcon={<ArrowForwardIosIcon />}
      >
        Enter
      </Button>
    );
  } else {
    return (
      <Button variant="contained" onClick={() => loginWithRedirect()}>
        Create a free account to get started
      </Button>
    );
  }
};

export default Content;
