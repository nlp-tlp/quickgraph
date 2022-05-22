import { useState, useEffect } from "react";
import {
  Grid,
  AppBar,
  Toolbar,
  Button,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import { grey, teal, red } from "@mui/material/colors";
import { useDispatch, useSelector } from "react-redux";
import history from "../utils/history";

import { NotificationBell } from "./NotificationBell";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { Filters } from "./Filters";
import LinearProgress from "@mui/material/LinearProgress";
import {
  saveAnnotations,
  selectAnnotationMode,
  selectPageBeforeViewChange,
  selectShowCluster,
  selectTexts,
  setAnnotationMode,
  setPage,
  setShowCluster,
  selectShowQuickView,
  setTextsIdle,
  setShowQuickView,
} from "../../app/dataSlice";
import {
  fetchMetrics,
  resetFilters,
  selectProject,
  selectProjectMetrics,
  selectProjectMetricsStatus,
  setActiveModal,
} from "../project/projectSlice";
import {
  selectUsername,
  selectUserId,
  fetchInvitations,
  selectColour,
} from "../auth/userSlice";

import { logoutUser } from "../auth/utils";

export default function Layout({ children, context }) {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const metrics = useSelector(selectProjectMetrics);
  const metricsStatus = useSelector(selectProjectMetricsStatus);
  const [navbarLoaded, setNavbarLoaded] = useState(false);
  const username = useSelector(selectUsername);
  const [showFilters, setShowFilters] = useState(false);
  const userColour = useSelector(selectColour);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!navbarLoaded) {
      dispatch(fetchInvitations());
    }
  }, [navbarLoaded]);

  useEffect(() => {
    if (project._id && metricsStatus === "idle") {
      dispatch(fetchMetrics({ projectId: project._id }));
    }
  }, [project, metricsStatus]);

  const projectProgress =
    metrics && `${metrics.savedTexts} / ${metrics.totalTexts}`;

  return (
    <Grid container>
      <Grid item xs={12}>
        <AppBar
          position="sticky"
          elevation={0}
          style={{
            background: grey[200],
            color: grey[800],
            borderBottom: `1px solid ${grey[400]}`,
          }}
        >
          <Toolbar
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0rem 2rem",
            }}
          >
            <h3>
              {context.name === "Annotation" ? (
                <BrandProjectDetail />
              ) : (
                context.name
              )}
            </h3>
            <div style={{ display: "flex", alignItems: "center" }}>
              {context.name === "Annotation" ? (
                <AnnotationItems
                  showFilters={showFilters}
                  setShowFilters={setShowFilters}
                />
              ) : (
                <>
                  <Button
                    style={{ color: grey[800], marginRight: "0.5rem" }}
                    href="/project/new"
                  >
                    New Project
                  </Button>
                  <NotificationBell />
                  <Button
                    style={{ color: grey[800] }}
                    id="basic-button"
                    aria-controls={open ? "basic-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={handleClick}
                  >
                    Menu
                    <ExpandMoreIcon />
                  </Button>
                  <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                      "aria-labelledby": "basic-button",
                    }}
                  >
                    <MenuItem onClick={() => history.push("/project/new")}>
                      New Project
                    </MenuItem>
                    <MenuItem onClick={() => history.push("/profile")}>
                      My Profile
                    </MenuItem>
                    <MenuItem onClick={() => history.push("/feed")}>
                      All Projects
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={logoutUser}>Log out</MenuItem>
                  </Menu>
                </>
              )}
            </div>
          </Toolbar>
          {context.name === "Annotation" && metrics && (
            <LinearProgress
              variant="determinate"
              value={metrics.value}
              title={projectProgress}
            />
          )}
        </AppBar>
      </Grid>
      {/* Filter component that is wrapped in a Grid component */}
      {showFilters && <Filters />}
      {/* Child component */}
      <Grid
        container
        item
        alignItems="center"
        direction="column"
        style={{
          height: `calc(100vh - ${showFilters ? "219px" : "140px"})`,
          marginBottom: "64px",
          overflowY: "auto",
        }}
      >
        {children}
      </Grid>
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          height: "64px",
          borderTop: `1px solid ${grey[300]}`,
          backgroundColor: grey[200],
          width: "100vw",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0rem 4rem",
          zIndex: 2000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <EmailIcon style={{ fontSize: "1.25rem", marginRight: "0.25rem" }} />
          <a
            href="mailto:tyler.bikaun@research.uwa.edu.au?subject=QuickGraph Feedback&body=Feedback/Feature/Bug%0DPlease%20specify%20type%20of%20feedback%0D%0DFeedback%0DEnter%20your%20feedback%20here"
            target="_blank"
            rel="noreferrer"
            alt="Email feedback"
            style={{ color: grey[900] }}
          >
            Feedback
          </a>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span>
            ©{" "}
            <a
              href="https://nlp-tlp.org/"
              target="_blank"
              rel="noreferrer"
              alt="nlp tlp group website"
              style={{ color: teal[900] }}
            >
              UWA NLP-TLP Group
            </a>{" "}
            2022
          </span>
          <span style={{ fontSize: "0.75rem" }}>
            Developed by{" "}
            <a
              href="https://github.com/4theKnowledge"
              target="_blank"
              rel="noreferrer"
              alt="github repository"
              style={{ color: teal[900] }}
            >
              Tyler Bikaun
            </a>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <AccountCircleIcon
            style={{ fontSize: "1.25rem", marginRight: "0.25rem" }}
          />
          <a href="/profile" style={{ color: userColour }}>
            {username}
          </a>
        </div>
      </footer>
    </Grid>
  );
}

const BrandProjectDetail = () => {
  const project = useSelector(selectProject);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span>{project.name}</span>
      <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>
        {project.description}
      </span>
    </div>
  );
};

const AnnotationItems = ({ showFilters, setShowFilters }) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const texts = useSelector(selectTexts);
  const userId = useSelector(selectUserId);
  const pageBeforeViewChange = useSelector(selectPageBeforeViewChange);
  const annotationMode = useSelector(selectAnnotationMode);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // TODO: review whether this is necessary; it triggers whenever the state of the tokens change.
  useEffect(() => {
    const textsNotAnnotated =
      texts &&
      Object.values(texts).filter((text) =>
        text.saved.map((s) => s.createdBy).includes(userId)
      ).length !== Object.values(texts).length;
    setSavePending(textsNotAnnotated);

    dispatch(fetchMetrics({ projectId: project._id }));
  }, [texts]);

  const [savePending, setSavePending] = useState(false);
  const showCluster = useSelector(selectShowCluster);
  const showQuickView = useSelector(selectShowQuickView);

  const handleViewClose = () => {
    dispatch(setShowQuickView(false));
    dispatch(setShowCluster(false));
    dispatch(resetFilters());
    dispatch(setPage(pageBeforeViewChange));
    history.push(`/annotation/${project._id}/page=${pageBeforeViewChange}`);
    dispatch(setTextsIdle());
  };

  const buttons = [
    {
      name: "Save Page",
      fnc: () => {
        dispatch(
          saveAnnotations({
            textIds: Object.keys(texts), //.map((text) => text._id),
          })
        );
        dispatch(setTextsIdle());
        dispatch(fetchMetrics({ projectId: project._id }));
      },
      display: true,
      color: savePending ? teal[500] : grey[500],
    },
    {
      name: "Close QuickView",
      fnc: handleViewClose,
      display: showQuickView,
      color: red[500],
    },
    {
      name: "Close Cluster",
      fnc: handleViewClose,
      display: showCluster,
      color: red[500],
    },
    {
      name:
        annotationMode === "relation"
          ? "Relation Mode (ctrl+m)"
          : "Entity Mode (ctrl+m)",
      fnc: () => {
        dispatch(
          setAnnotationMode(annotationMode === "entity" ? "relation" : "entity")
        );
        // console.log("switched from annotation mode", annotationMode);
      },
      display: project.tasks && project.tasks.relationAnnotation,
      color: annotationMode === "entity" ? grey[900] : teal[500],
    },
  ];

  return (
    <>
      {buttons
        .filter((btn) => btn.display)
        .map((btn) => (
          <Button
            variant="outlined"
            style={{
              border: `1px solid ${btn.color}`,
              color: btn.color,
              margin: "0rem 0.5rem",
            }}
            onClick={btn.fnc}
          >
            {btn.name}
          </Button>
        ))}
      <Button
        style={{ color: grey[800] }}
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        Menu
        <ExpandMoreIcon />
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuItem
          onClick={() => {
            setShowFilters(!showFilters);
            handleClose();
          }}
        >
          Filters
        </MenuItem>
        <MenuItem onClick={() => dispatch(setActiveModal("settings"))}>
          Settings
        </MenuItem>
        <MenuItem onClick={() => history.push(`/dashboard/${project._id}`)}>
          Dashboard
        </MenuItem>
        <MenuItem onClick={() => history.push("/feed")}>All Projects</MenuItem>
        <Divider />
        <MenuItem onClick={logoutUser}>Log out</MenuItem>
      </Menu>
    </>
  );
};
