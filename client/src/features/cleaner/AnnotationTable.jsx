import { useState, useContext } from "react";
import { Grid, Stack, Skeleton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { TextContainer } from "./TextContainer";
import { ProjectContext } from "../../shared/context/ProjectContext";
// import { useAuth0 } from "@auth0/auth0-react";

const AnnotationTable = () => {
  const [state, dispatch] = useContext(ProjectContext);

  //   const pageBeforeViewChange = useSelector(selectPageBeforeViewChange);

  // useEffect(() => {
  //   axios
  //     .post(
  //       "/api/text/filter",
  //       { projectId: projectId },
  //       { params: { page: pageNumber, limit: pageLimit } }
  //     )
  //     .then((response) => {
  //       setTexts(response.data.texts);
  //       setLoading(false);
  //     });

  //   // Puts annotation div at the top on page change
  //   const element = document.getElementById("text-container-0");
  //   if (element) {
  //     element.scrollIntoView();
  //   }
  // }, [pageNumber]);

  const skeletonMask = (index) => (
    <Stack
      key={`table-skeleton-mask-${index}`}
      id={`${index}`}
      direction="row"
      sx={{ width: "80%" }}
      spacing={4}
      justifyContent="center"
      alignItems="center"
    >
      <Skeleton variant="text" width={100} height={100} />
      <Skeleton variant="text" width="70%" height={100} />
      <Skeleton variant="text" width={100} height={100} />
    </Stack>
  );

  return (
    <Grid
      item
      container
      direction="column"
      //   onKeyDown={(e) => handleMarkupKeyDownEvent(e)}
      tabIndex="-1"
      sx={{ outline: "none" }}
      mb={4}
    >
      {!state.textsLoading &&
        state.texts &&
        Object.keys(state.texts).length > 0 &&
        Object.keys(state.texts).map((id, index) => (
          <TextContainer
            text={state.texts[id]}
            textId={id}
            textIndex={index}
            key={id}
          />
        ))}
      {!state.textsLoading && Object.keys(state.texts).length == 0 && (
        <div
          style={{
            marginTop: "25vh",
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#607d8b",
          }}
        >
          <SearchIcon sx={{ fontSize: "5rem", textAlign: "center" }} />
          <p>Sorry, no results were found</p>
        </div>
      )}
      {state.textsLoading && (
        <Stack
          spacing={4}
          direction="column"
          justifyContent="center"
          alignItems="center"
          mt={4}
        >
          {Array(8)
            .fill()
            .map((_, index) => skeletonMask(index))}
        </Stack>
      )}
    </Grid>
  );
};

export default AnnotationTable;
