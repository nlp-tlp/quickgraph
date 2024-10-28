import {
  Grid,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Stack,
  Typography,
  Divider,
  Container,
} from "@mui/material";
import NotificationBell from "../NotificationBell";
import DefaultSidebar from "./Sidebar";
import ErrorBoundary from "../ErrorBoundary";
import { DrawerWidth } from "../../constants/layout";

const LayoutHOC = ({
  Sidebar = DefaultSidebar,
  AppBar,
  ContextProviders,
  children,
  context,
}) => {
  return (
    <Box sx={{ display: "flex" }}>
      <ErrorBoundary>
        {/* {AppBar && <AppBar />} */}
        <Drawer
          sx={{
            width: DrawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DrawerWidth,
              boxSizing: "border-box",
            },
          }}
          variant="permanent"
          anchor="left"
        >
          {Sidebar && Sidebar}
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
          }}
        >
          {ContextProviders ? (
            <ContextProviders>
              <Main children={children} context={context} AppBar={AppBar} />
            </ContextProviders>
          ) : (
            <Main children={children} context={context} AppBar={AppBar} />
          )}
        </Box>
      </ErrorBoundary>
    </Box>
  );
};

const LayoutAppBar = ({ context }) => {
  return (
    <AppBar
      position="static"
      color="transparent"
      sx={{
        width: "100%",
      }}
      elevation={0}
    >
      <Toolbar>
        <Stack
          direction="row"
          sx={{ width: "100%" }}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {context.name}
          </Typography>
          <NotificationBell />
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

const Main = ({ children, context, AppBar = LayoutAppBar }) => {
  return (
    <Grid item>
      <Container maxWidth="xl">
        <Grid item xs={12} p={2}>
          {AppBar && <AppBar context={context} />}
        </Grid>
      </Container>
      <Divider />
      <Grid
        item
        alignItems="center"
        justifyContent="center"
        p={2}
        sx={{ height: "calc(100vh - 129px)", overflowY: "auto" }}
      >
        <Container maxWidth="xl">{children}</Container>
      </Grid>
    </Grid>
  );
};

export default LayoutHOC;
