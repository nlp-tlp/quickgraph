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
import Sidebar from "./Sidebar";
import ErrorBoundary from "../ErrorBoundary";
import { DrawerWidth } from "../../constants/layout";
import { useState } from "react";

const Layout = ({ children, context }) => {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ display: "flex" }}>
      <ErrorBoundary>
        <Drawer
          sx={{
            width: open ? DrawerWidth : 80,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: open ? DrawerWidth : 80,
              boxSizing: "border-box",
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Sidebar open={open} setOpen={setOpen} />
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
          }}
        >
          <Main children={children} context={context} />
        </Box>
      </ErrorBoundary>
    </Box>
  );
};

const Main = ({ children, context }) => {
  return (
    <Grid item>
      <Container maxWidth="xl">
        <Grid item xs={12} p={2}>
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

export default Layout;
