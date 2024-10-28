import { useEffect, useContext } from "react";
import Paginator from "./Paginator";
import { Table as AnnotationTable } from "./Table";
import { Grid, Box, Container, Divider } from "@mui/material";
import { useSearchParams, useParams } from "react-router-dom";
import { ProjectContext } from "../../shared/context/ProjectContext";
import LinearProgressWithLabel from "./LinearProgressWithLabel";
import InformationSidebar from "./InformationSidebar/InformationSidebar";
import SearchModal from "./Modals/SearchModal";
import FilterModal from "./Modals/FilterModal";
import ShortcutModal from "./Modals/ShortcutModal";
import ProjectAppBar from "./AppBar";

const ProjectLayout = () => {
  const { state, dispatch, handleFetchDatasetItems } =
    useContext(ProjectContext);
  const { projectId } = useParams();
  let [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;
  const searchterm = searchParams.get("searchterm") || null;
  const dataset_item_ids = searchParams.get("dataset_item_ids") || null;
  const saved = searchParams.get("saved") || 2;
  const relations = searchParams.get("relations") || 2;
  const quality = searchParams.get("quality") || 2;
  const flag = searchParams.get("flag") || 4;

  // TODO: handle case where project does not exist; this should redirect the user to a unauthorized route...

  useEffect(() => {
    dispatch({ type: "SET_PROJECTID", payload: projectId });
  }, [projectId]);

  useEffect(() => {
    if (page && projectId && !state.projectLoading) {
      handleFetchDatasetItems({
        project_id: projectId,
        search_term: searchterm,
        dataset_item_ids: dataset_item_ids,
        saved: saved,
        quality: quality,
        relations: relations,
        flag: flag,
        skip: page - 1,
        limit: limit,
      });
    }
  }, [searchParams, projectId, state.projectLoading]);

  return (
    <>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
        }}
      >
        <Grid item>
          <Container maxWidth="xl">
            <Grid item xs={12} p={2}>
              <ProjectAppBar />
            </Grid>
          </Container>
          <Divider />
          <LinearProgressWithLabel />
          <Grid
            item
            xs={12}
            container
            justifyContent="space-apart"
            direction="column"
          >
            <Container maxWidth="xl">
              <Grid
                item
                container
                sx={{ overflowY: "auto", height: "calc(100vh - 181px)" }}
              >
                <AnnotationTable state={state} dispatch={dispatch} />
              </Grid>
              <Grid item container justifyContent="center">
                <Paginator />
              </Grid>
            </Container>
          </Grid>
        </Grid>
      </Box>
      <InformationSidebar />
      <SearchModal />
      <FilterModal />
      <ShortcutModal />
    </>
  );
};

export default ProjectLayout;
