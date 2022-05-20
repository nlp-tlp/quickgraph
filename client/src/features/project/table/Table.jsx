import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import "react-contexify/dist/ReactContexify.css";
import { IoSearch } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import history from "../../utils/history";
import { ClusterActionBar } from "../cluster/ClusterActionBar";
import {
  fetchProject,
  selectFilters,
  selectKeyBinding,
  selectProject,
  setFilters,
  resetFilters,
} from "../projectSlice";
import { TextContainer } from "../text/TextContainer";
import {
  fetchClusterMetrics,
  fetchTexts,
  getTotalPages,
  applyAnnotation,
  selectActiveCluster,
  selectPage,
  selectPageBeforeViewChange,
  selectPageLimit,
  selectTexts,
  setActiveCluster,
  setTextsIdle,
  setPage,
  selectTextsStatus,
  selectTextsError,
  selectAnnotationMode,
  selectSelectMode,
} from "../../../app/dataSlice";
import "./Table.css";

export const Table = () => {
  const dispatch = useDispatch();
  const { projectId: activeProjectId } = useParams();
  let { pageNumber } = useParams();

  const project = useSelector(selectProject);
  const projectStatus = useSelector((state) => state.project.status);
  const filters = useSelector(selectFilters);

  const pageLimit = useSelector(selectPageLimit);
  const page = useSelector(selectPage);

  const textsStatus = useSelector(selectTextsStatus);
  const textsError = useSelector(selectTextsError);
  const texts = useSelector(selectTexts);

  const [clusterExpanded, setClusterExpanded] = useState(false);
  const pageBeforeViewChange = useSelector(selectPageBeforeViewChange);
  const activeCluster = useSelector(selectActiveCluster);

  const annotationMode = useSelector(selectAnnotationMode);
  const keyBinding = useSelector(selectKeyBinding);
  const selectMode = useSelector(selectSelectMode);

  useEffect(() => {
    dispatch(setPage(pageNumber));
    dispatch(setTextsIdle());
    // Puts annotation div at the top on page change
    const element = document.getElementById("text-container-0");
    if (element) {
      element.scrollIntoView();
    }
  }, [pageNumber]);

  useEffect(() => {
    if (activeProjectId && projectStatus === "idle") {
      dispatch(fetchProject({ projectId: activeProjectId }));
    }
  }, [activeProjectId, projectStatus, dispatch]);

  useEffect(() => {
    if (
      activeProjectId &&
      projectStatus === "succeeded" &&
      textsStatus === "idle"
    ) {
      // Fetches the count of total pages based on current settings
      // and the tokens associated with the texts on the current page.
      dispatch(
        getTotalPages({
          projectId: project._id,
          getPages: true,
          filters: filters,
          pageLimit: pageLimit,
        })
      );
      dispatch(
        fetchTexts({
          projectId: project._id,
          getPages: false,
          filters: filters,
          pageLimit: pageLimit,
          page: page,
        })
      );
      dispatch(fetchClusterMetrics({ projectId: project._id }));
    }
  }, [textsStatus, projectStatus]);

  const handleMarkupKeyDownEvent = (e) => {
    if (annotationMode === "entity") {
      // TODO: Handle for multiple key presses within a certain timeframe... 11, 12, etc. like RedCoat.
      // console.log(e);
      // User wants to markup a span of text

      // If user is holding shift, e.key will be the shift version e.g. 1 -> !; need to correct for this.
      const key = e.code.split("Digit")[1]; // will be null if no number is pressed

      if (
        Object.keys(keyBinding).includes(key) &&
        selectMode.tokenIds.length > 0
      ) {
        // Only operate on existing bindings

        // Get start and end indexes
        const textId = selectMode.textId;
        const tokenIds = selectMode.tokenIds;

        // Use text object and tokenIds to find token details
        const tokens = Object.values(texts[textId].tokens).filter((token) =>
          tokenIds.includes(token._id)
        );

        // Create payload
        const payload = {
          entitySpanStart: tokens[0].index,
          entitySpanEnd:
            tokens.length === 1
              ? tokens[0].index
              : tokens[tokens.length - 1].index,
          entityLabel: keyBinding[key].name,
          entityLabelId: keyBinding[key]._id,
          textId: textId,
          projectId: project._id,
          applyAll: e.shiftKey,
          annotationType: "entity",
          suggested: false,
          textIds: Object.keys(texts),
          entityText: tokens.map((t) => t.value).join(" "),
        };

        dispatch(applyAnnotation({ ...payload }));
      }
    }
  };

  if (textsStatus === "loading" || textsStatus === "idle") {
    return (
      <div
        style={{
          textAlign: "center",
        }}
      >
        <Spinner animation="border" style={{ marginTop: "50vh" }} />
      </div>
    );
  } else if (textsStatus === "succeeded" && Object.keys(texts).length === 0) {
    return (
      <div
        style={{
          marginTop: "25vh",
          textAlign: "center",
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#607d8b",
        }}
      >
        <IoSearch style={{ fontSize: "5rem", textAlign: "center" }} />
        <p>Sorry, no results were found</p>
      </div>
    );
  } else if (textsStatus === "succeeded") {
    return (
      <div
        className="annotation-table"
        onKeyDown={(e) => handleMarkupKeyDownEvent(e)}
        tabIndex={-1}
      >
        {texts &&
          Object.keys(texts).map((textId, textIndex) => (
            <TextContainer textId={textId} textIndex={textIndex} />
          ))}
      </div>
    );
  } else if (textsStatus === "failed") {
    return <div>{textsError}</div>;
  }
};
