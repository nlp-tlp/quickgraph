import { Drawer, Box } from "@mui/material";
import ErrorBoundary from "../../shared/components/ErrorBoundary";
import { CleanerProvider } from "../../shared/context/cleaner-context";

import Sidebar from "./sidebar/CleanerSidebar";
import CleanerLayout from "./CleanerLayout";
import { DrawerWidth } from "../../shared/constants/layout";

const Cleaner = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <ErrorBoundary name={"Annotation"}>
        <CleanerProvider>
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
            {/* <Sidebar /> */}
          </Drawer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 0,
            }}
          >
            <CleanerLayout />
          </Box>
        </CleanerProvider>
      </ErrorBoundary>
    </Box>
  );
};

export default Cleaner;
