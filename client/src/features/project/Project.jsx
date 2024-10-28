import { useState } from "react";
import { Drawer, Box } from "@mui/material";
import ErrorBoundary from "../../shared/components/ErrorBoundary";
import PrimarySidebar from "./PrimarySidebar";
import { ProjectProvider } from "../../shared/context/ProjectContext";
import ProjectLayout from "./ProjectLayout";
import { AnnotationDrawerWidth } from "../../shared/constants/layout";

const Project = () => {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ display: "flex" }}>
      <ErrorBoundary name={"Annotation"}>
        <ProjectProvider>
          <Drawer
            sx={{
              width: AnnotationDrawerWidth,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: AnnotationDrawerWidth,
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
            <ProjectLayout />
          </Box>
        </ProjectProvider>
      </ErrorBoundary>
    </Box>
  );
};

export default Project;
