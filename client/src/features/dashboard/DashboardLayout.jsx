import { useEffect, useContext } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  Button,
  Typography,
  Box,
  Toolbar,
  Divider,
  Tooltip,
  Stack,
  Grid,
  Container,
  AppBar,
} from "@mui/material";
import { DashboardContext } from "../../shared/context/dashboard-context";
import { getComponents } from "./data";
import { useTheme } from "@mui/material/styles";
import LoadingAlert from "../../shared/components/LoadingAlert";
import NotificationBell from "../../shared/components/NotificationBell";
import MainContainer from "../../shared/components/Layout/MainContainer";

const DashboardLayout = () => {
  const theme = useTheme();
  const { projectId, view } = useParams();
  const { state, dispatch } = useContext(DashboardContext);
  const location = useLocation();
  const name = location.pathname.split("/").pop();
  const components = getComponents({ state, dispatch });

  useEffect(() => {
    dispatch({ type: "SET_PROJECT_ID", payload: projectId });
  }, [projectId]);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 0,
      }}
    >
      <Box>
        <Container maxWidth="xl">
          <Grid item xs={12} p={2}>
            <AppBar
              position="static"
              color="transparent"
              sx={{ width: "100%" }}
              elevation={0}
            >
              <Toolbar>
                <Stack
                  direction="row"
                  sx={{ width: "100%" }}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "bold", textTransform: "capitalize" }}
                    >
                      {name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.neutral.main }}
                    >
                      Dashboard
                    </Typography>
                  </Stack>
                  <Tooltip
                    title="Click to start annotating"
                    arrow
                    placement="left"
                  >
                    <Button
                      component={Link}
                      variant="contained"
                      to={`/annotation/${state.projectId}?page=1`}
                    >
                      Annotate
                    </Button>
                  </Tooltip>
                </Stack>
                <Box ml={4}>
                  <NotificationBell />
                </Box>
              </Toolbar>
            </AppBar>
          </Grid>
        </Container>
      </Box>
      <Divider />
      <Box
        p={2}
        sx={{
          height: "calc(100vh - 97px)",
          overflowY: "auto",
        }}
      >
        <Container maxWidth="xl">
          <MainContainer>
            {state.loading ? (
              <Grid item xs={12} p={2}>
                <LoadingAlert message="Fetching dashboard information" />
              </Grid>
            ) : (
              components[view].body
            )}
          </MainContainer>
        </Container>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
