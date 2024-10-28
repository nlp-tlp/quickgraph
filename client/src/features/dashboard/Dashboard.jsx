import { useState } from "react";

import { Drawer, Box } from "@mui/material";
import ErrorBoundary from "../../shared/components/ErrorBoundary";
import DashboardLayout from "./DashboardLayout";
import PrimarySidebar from "./PrimarySidebar";
import { DashboardDrawerWidth } from "../../shared/constants/layout";
import { DashboardProvider } from "../../shared/context/dashboard-context";
import { GraphProvider } from "../../shared/context/graph-context";

const Dashboard = () => {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ display: "flex" }}>
      <ErrorBoundary>
        <DashboardProvider>
          <GraphProvider>
            <Drawer
              sx={{
                width: open ? DashboardDrawerWidth : 80,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                  width: open ? DashboardDrawerWidth : 80,
                  boxSizing: "border-box",
                },
              }}
              variant="permanent"
              anchor="left"
            >
              <PrimarySidebar open={open} setOpen={setOpen} />
            </Drawer>
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 0,
              }}
            >
              <DashboardLayout />
            </Box>
          </GraphProvider>
        </DashboardProvider>
      </ErrorBoundary>
    </Box>
  );
};

export default Dashboard;
