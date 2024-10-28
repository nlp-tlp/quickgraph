import { useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Grid,
  Typography,
  CircularProgress,
  IconButton,
  Drawer,
  Box,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import { DrawerWidth } from "../../shared/constants/layout";
import { ProjectContext } from "../../shared/context/ProjectContext";
// import Sidebar from "./sidebar/Sidebar";
import AnnotationTable from "./AnnotationTable";
import Paginator from "./Paginator";
// import AnnotationToast from "./AnnotationToast";

const CleanerLayout = () => {
  const { projectId, pageNumber } = useParams();
  // const [state, dispatch] = useContext(ProjectContext);

  // useEffect(() => {
  //   dispatch({ type: "SET_PROJECTID", payload: projectId });
  // }, [projectId]);

  // useEffect(() => {
  //   dispatch({ type: "SET_VALUE", payload: { pageNumber: pageNumber } });
  // }, [pageNumber]);

  //   // <Box sx={{ display: "flex" }}>
  //   {
  //     /* {state.showToast && <AnnotationToast />} */
  //   }
  //   {
  //     /* <Drawer
  //   sx={{
  //     width: DrawerWidth,
  //     flexShrink: 0,
  //     "& .MuiDrawer-paper": {
  //       width: DrawerWidth,
  //       boxSizing: "border-box",
  //     },
  //   }}
  //   variant="permanent"
  //   anchor="left"
  //   >
  //   {!state.projectLoading && <Sidebar />}
  // </Drawer> */
  //   }
  // </Box>
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        bgcolor: "grey",
        p: 0,
      }}
    >
      <Grid
        item
        container
        xs={12}
        direction="column"
        justifyContent="space-evenly"
      >
        <Grid item container p={2} justifyContent="center" alignItems="center">
          <Grid item xs={10} sx={{ textAlign: "left" }}>
            {/* {!state.projectLoading && (
              <Typography variant="h4" title={state.project.name}>
                {!state.project.name.length > 35
                  ? state.project.name.slice(0, 35) + "..."
                  : state.project.name}
              </Typography>
            )} */}
          </Grid>
          <Grid
            container
            item
            xs={1}
            justifyContent="center"
            alignItems="center"
          >
            {/* {state.operationLoading && (
              <CircularProgress size="1rem" disableShrink />
            )} */}
          </Grid>
        </Grid>
        <Grid
          item
          container
          sx={{
            overflowY: "auto",
            height: "calc(100vh - 84px - 74px)",
            "::-webkit-scrollbar": {
              width: "10px",
            },
            "::-webkit-scrollbar-track": {
              background: grey[300],
            },
            "::-webkit-scrollbar-thumb": {
              background: grey[400],
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: grey[500],
            },
          }}
        >
          {/* <AnnotationTable /> */}
        </Grid>
        <Grid item container justifyContent="center" p={2}>
          {/* <Paginator /> */}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CleanerLayout;
