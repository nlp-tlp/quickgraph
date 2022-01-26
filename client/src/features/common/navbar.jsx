import { useEffect, useState } from "react";
import {
  Button,
  Container,
  Dropdown,
  Form,
  Nav,
  Navbar,
  NavDropdown,
  OverlayTrigger,
  Popover,
  ProgressBar,
} from "react-bootstrap";
import { FaArrowAltCircleLeft, FaEdit, FaInfoCircle } from "react-icons/fa";
import {
  IoCloseCircle,
  IoEnter,
  IoFilter,
  IoLogOut,
  IoLogOutOutline,
  IoNotifications,
  IoPersonCircleOutline,
  IoSave,
} from "react-icons/io5";
import { MdDashboard, MdSettings } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
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
import Logo from "../../media/quickgraph_logo.png";
import { AuthButton } from "../auth/authbutton";
import {
  acceptInvitation,
  declineInvitation,
  fetchInvitations,
  selectColour,
  selectInvitations,
  selectUserId,
  selectUsername,
} from "../auth/userSlice";
import { setIdle as setFeedIdle } from "../feed/feedSlice";
import {
  fetchMetrics,
  resetFilters,
  selectProject,
  selectProjectMetrics,
  selectProjectMetricsStatus,
  setActiveModal,
} from "../project/projectSlice";
import history from "../utils/history";
import { Filters } from "./features/Filters";
import "./Navbar.css";

export const NavBar = () => {
  const dispatch = useDispatch();
  const username = useSelector(selectUsername);
  const [navbarLoaded, setNavbarLoaded] = useState(false);
  const project = useSelector(selectProject);
  const metrics = useSelector(selectProjectMetrics);
  const metricsStatus = useSelector(selectProjectMetricsStatus);
  const texts = useSelector(selectTexts);
  const [savePending, setSavePending] = useState(false);
  const annotationMode = useSelector(selectAnnotationMode);
  const userId = useSelector(selectUserId);
  const showCluster = useSelector(selectShowCluster);
  const showQuickView = useSelector(selectShowQuickView);
  const [showFilters, setShowFilters] = useState(false);
  const pageBeforeViewChange = useSelector(selectPageBeforeViewChange);

  useEffect(() => {
    if (project._id && metricsStatus === "idle") {
      dispatch(fetchMetrics({ projectId: project._id }));
    }
  }, [project, metricsStatus]);

  useEffect(() => {
    const textsNotAnnotated =
      texts &&
      texts.filter((text) =>
        text.saved.map((s) => s.createdBy).includes(userId)
      ).length !== texts.length;
    setSavePending(textsNotAnnotated);

    dispatch(fetchMetrics({ projectId: project._id }));
  }, [texts]);

  useEffect(() => {
    if (!navbarLoaded) {
      dispatch(fetchInvitations());
    }
  }, [navbarLoaded]);

  const changeNavContext = () => {
    const path = window.location.pathname.split("/").slice(1).join("/");

    if (path.includes("feed")) {
      return "feed";
    } else if (path.includes("project/new")) {
      return "project/new";
    } else if (path.includes("dashboard")) {
      return "dashboard";
    } else if (path.includes("annotation")) {
      return "annotation";
    } else if (path.includes("profile")) {
      return "profile";
    }
  };
  const page = changeNavContext();

  const handleViewClose = () => {
    dispatch(setShowQuickView(false));
    dispatch(setShowCluster(false));
    dispatch(resetFilters());
    dispatch(setPage(pageBeforeViewChange));
    history.push(`/annotation/${project._id}/page=${pageBeforeViewChange}`);
    dispatch(setTextsIdle());
  };

  switch (page) {
    case "feed":
      return (
        <Navbar
          className="navbar"
          collapseOnSelect
          expand="lg"
          variant="light"
          sticky="top"
        >
          <Container fluid>
            <Navbar.Brand href="/">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignContent: "center",
                  alignItems: "center",
                }}
              >
                <img src={Logo} alt="quickgraph logo" id="brand" />
                <h3 style={{ fontWeight: "bold", color: "#263238" }}>
                  Project Feed
                </h3>
              </div>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="mr-auto"></Nav>
              <Nav.Link href="/project/new">New Project</Nav.Link>
              <NotificationBell />
              <Dropdown>
                <Dropdown.Toggle bsPrefix="custom-toggler" align="end">
                  <UserAvatar />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="/profile" id="dropdown-menu-item">
                    <IoPersonCircleOutline id="icon" />
                    My Profile
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item id="dropdown-menu-item">
                    <IoLogOutOutline id="icon" />
                    <AuthButton
                      variant={"Sign out"}
                      style={{ padding: "0", margin: "0" }}
                    />
                  </Dropdown.Item>
                  <Dropdown.Header>Signed in as: {username}</Dropdown.Header>
                </Dropdown.Menu>
              </Dropdown>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      );
    case "profile":
      return (
        <Navbar
          className="navbar"
          collapseOnSelect
          expand="lg"
          variant="light"
          sticky="top"
        >
          <Container fluid>
            <Navbar.Brand href="/feed">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignContent: "center",
                }}
              >
                <FaArrowAltCircleLeft
                  style={{
                    margin: "auto 0.5rem",
                    fontSize: "1.5rem",
                    "&:hover": { opacity: "0.5" },
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0",
                    margin: "0",
                  }}
                >
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "#263238",
                      margin: "-0.5rem 0rem 0rem 0rem",
                      padding: "0",
                    }}
                  >
                    User Profile
                  </p>
                </div>
              </div>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="mr-auto"></Nav>
              <NotificationBell />
              <Dropdown>
                <Dropdown.Toggle bsPrefix="custom-toggler" align="end">
                  <UserAvatar />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="/feed" id="dropdown-menu-item">
                    <FaArrowAltCircleLeft id="menu-icon" />
                    Feed
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item id="dropdown-menu-item">
                    <IoLogOutOutline id="icon" />
                    <AuthButton
                      variant={"Sign out"}
                      style={{ padding: "0", margin: "0" }}
                    />
                  </Dropdown.Item>
                  <Dropdown.Header>Signed in as: {username}</Dropdown.Header>
                </Dropdown.Menu>
              </Dropdown>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      );
    case "dashboard":
      return (
        <Navbar
          className="navbar"
          collapseOnSelect
          expand="lg"
          variant="light"
          sticky="top"
        >
          <Container fluid>
            <Navbar.Brand href="/feed">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignContent: "center",
                }}
              >
                <FaArrowAltCircleLeft
                  style={{
                    margin: "auto 0.5rem",
                    fontSize: "1.5rem",
                    "&:hover": { opacity: "0.5" },
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0",
                    margin: "0",
                  }}
                >
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "#263238",
                      margin: "-0.5rem 0rem 0rem 0rem",
                      padding: "0",
                    }}
                  >
                    Dashboard
                  </p>
                  <p
                    style={{
                      margin: "-0.5rem 0rem",
                      padding: "0",
                      fontSize: "0.75rem",
                      color: "#90a4ae",
                    }}
                  >
                    {project.name}
                  </p>
                </div>
              </div>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="mr-auto"></Nav>
              <Nav.Link
                className="nav-button"
                href={`/annotation/${project._id}/page=1`}
                style={{ fontWeight: "bold" }}
              >
                <IoEnter />
                Annotate
              </Nav.Link>
              <NotificationBell />
              <Dropdown>
                <Dropdown.Toggle bsPrefix="custom-toggler" align="end">
                  <UserAvatar />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="/profile" id="dropdown-menu-item">
                    <IoPersonCircleOutline id="icon" />
                    My Profile
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item id="dropdown-menu-item">
                    <IoLogOutOutline id="icon" />
                    <AuthButton
                      variant={"Sign out"}
                      style={{ padding: "0", margin: "0" }}
                    />
                  </Dropdown.Item>
                  <Dropdown.Header>Signed in as: {username}</Dropdown.Header>
                </Dropdown.Menu>
              </Dropdown>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      );
    case "annotation":
      const saveDetail =
        metrics && `${metrics.savedTexts} / ${metrics.totalTexts}`;

      return (
        <>
          <Navbar
            collapseOnSelect
            expand="lg"
            variant="light"
            sticky="top"
            id="project-navbar"
          >
            <Container fluid>
              <Navbar.Brand href={`/dashboard/${project._id}/overview`}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0",
                    margin: "0",
                  }}
                >
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "#263238",
                      margin: "-0.5rem 0rem 0rem 0rem",
                      padding: "0",
                    }}
                  >
                    {project.name}
                  </p>
                  <p
                    style={{
                      margin: "-0.5rem 0rem",
                      padding: "0",
                      fontSize: "0.75rem",
                      color: "#607d8b",
                    }}
                  >
                    {project.description}
                  </p>
                </div>
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="responsive-navbar-nav" />
              <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="ml-auto">
                  {showQuickView && (
                    <Navbar.Text
                      className="nav-button"
                      active="true"
                      style={{ color: "#b71c1c" }}
                      onClick={handleViewClose}
                    >
                      <IoCloseCircle id="nav-icon" />
                      <span>Close QuickView</span>
                    </Navbar.Text>
                  )}
                  {showCluster && (
                    <Navbar.Text
                      className="nav-button"
                      active="true"
                      style={{ color: "#b71c1c" }}
                      onClick={handleViewClose}
                    >
                      <IoCloseCircle id="nav-icon" />
                      <span>Close Cluster</span>
                    </Navbar.Text>
                  )}
                  <Navbar.Text
                    id="nav-save"
                    className="nav-button"
                    save={savePending ? "true" : "false"}
                    onClick={() => {
                      dispatch(
                        saveAnnotations({
                          textIds: texts.map((text) => text._id),
                        })
                      );
                      dispatch(setTextsIdle());
                      dispatch(fetchMetrics({ projectId: project._id }));
                    }}
                    title="Click to save the current pages suggested replacements and to mark all documents as saved"
                  >
                    <IoSave id="nav-icon" />
                    <span>Save Page</span>
                  </Navbar.Text>
                  {project &&
                    project.tasks &&
                    project.tasks.relationAnnotation && (
                      <Navbar.Text
                        className="nav-button"
                        active={
                          annotationMode === "relation" ? "true" : "false"
                        }
                        style={{
                          color: annotationMode === "relation" && "#1b5e20",
                        }}
                      >
                        <Form>
                          <Form.Check
                            type="switch"
                            id="switch-annotation-mode"
                            label={
                              annotationMode === "relation"
                                ? "Relation Mode"
                                : "Entity Mode"
                            }
                            title="Click to toggle between entity typing and relation extraction modes"
                            checked={annotationMode === "relation"}
                            onClick={() => {
                              dispatch(
                                setAnnotationMode(
                                  annotationMode === "concept"
                                    ? "relation"
                                    : "concept"
                                )
                              );
                              console.log(
                                "switched from annotation mode",
                                annotationMode
                              );
                            }}
                          />
                        </Form>
                      </Navbar.Text>
                    )}
                  {/* <Navbar.Text
                    className="nav-button"
                    active={showFilters ? "true": "false"}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <IoFilter id="nav-icon" />
                    <span>Filters</span>
                  </Navbar.Text> */}
                  <NavDropdown title="Menu" id="collasible-nav-dropdown">
                    <NavDropdown.Item
                      // style={{fontWeight: showFilters && "bold"}}
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <IoFilter id="menu-icon" />
                      Filters
                    </NavDropdown.Item>
                    <NavDropdown.Item
                      onClick={() => dispatch(setActiveModal("settings"))}
                    >
                      <MdSettings id="menu-icon" />
                      Settings
                    </NavDropdown.Item>
                    <NavDropdown.Item
                      onClick={() => dispatch(setActiveModal("help"))}
                    >
                      <FaInfoCircle id="menu-icon" />
                      Information
                    </NavDropdown.Item>
                    <NavDropdown.Item
                      href={`/dashboard/${project._id}/overview`}
                    >
                      <MdDashboard id="menu-icon" />
                      Dashboard
                    </NavDropdown.Item>
                    <NavDropdown.Item href="/feed">
                      <FaArrowAltCircleLeft id="menu-icon" />
                      Feed
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <IoLogOut id="menu-icon" />
                        <AuthButton
                          variant={"Sign out"}
                          style={{ padding: "0", margin: "0" }}
                        />
                      </span>
                    </NavDropdown.Item>
                  </NavDropdown>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
          {metrics && (
            <ProgressBar
              striped
              variant="success"
              now={metrics.value}
              label={saveDetail}
              title={`Annotation progress: ${saveDetail} (${metrics.value}%) texts have been saved.`}
              style={{ zIndex: "100", position: "sticky", top: "0" }}
            />
          )}
          {showFilters && <Filters />}
        </>
      );
    case "project/new":
      return (
        <Navbar
          className="navbar"
          collapseOnSelect
          expand="lg"
          variant="light"
          sticky="top"
        >
          <Container fluid>
            <Navbar.Brand href="/feed">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignContent: "center",
                }}
              >
                <FaArrowAltCircleLeft
                  style={{
                    margin: "auto 0.5rem",
                    fontSize: "1.5rem",
                    "&:hover": { opacity: "0.5" },
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0",
                    margin: "0",
                  }}
                >
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "#263238",
                      margin: "-0.5rem 0rem 0rem 0rem",
                      padding: "0",
                    }}
                  >
                    New Project
                  </p>
                </div>
              </div>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="mr-auto"></Nav>
              <NotificationBell />
              <Dropdown>
                <Dropdown.Toggle bsPrefix="custom-toggler" align="end">
                  <UserAvatar />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="/profile" id="dropdown-menu-item">
                    <IoPersonCircleOutline id="icon" />
                    My Profile
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item id="dropdown-menu-item">
                    <IoLogOutOutline id="icon" />
                    <AuthButton
                      variant={"Sign out"}
                      style={{ padding: "0", margin: "0" }}
                    />
                  </Dropdown.Item>
                  <Dropdown.Header>Signed in as: {username}</Dropdown.Header>
                </Dropdown.Menu>
              </Dropdown>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      );
    default:
      console.log("something went wrong in nav bar component");
      break;
  }
};

const UserAvatar = () => {
  const username = useSelector(selectUsername);
  const avatarColour = useSelector(selectColour);
  return (
    <div
      id="avatar"
      style={{
        backgroundColor: avatarColour,
        borderRadius: "50%",
        height: "40px",
        width: "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textTransform: "uppercase",
        fontSize: "22px",
        fontWeight: "bold",
      }}
    >
      {username ? username[0] : "?"}
    </div>
  );
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const invitations = useSelector(selectInvitations);

  const handleInviteAccept = (projectId) => {
    console.log("accepted invitation", projectId);
    dispatch(acceptInvitation({ projectId: projectId }));
    dispatch(setFeedIdle());
  };

  const handleInviteDecline = (projectId) => {
    console.log("declined invitation");
    dispatch(declineInvitation({ projectId: projectId }));
  };

  return (
    <span id="notification-bell-container">
      <OverlayTrigger
        trigger="click"
        placement="bottom"
        rootClose
        overlay={
          <Popover id="notification-popover-container">
            <Popover.Title>Notifications</Popover.Title>
            <Popover.Content id="notification-popover-content">
              <div id="notification-popover-content-container">
                {invitations && invitations.length > 0 ? (
                  invitations.map((invite) => (
                    <>
                      <span id="notification-popover-content-text">
                        You have been invited to the project:{" "}
                        <strong>{invite.project.name}</strong>
                      </span>
                      <div id="notification-popover-content-btn-group">
                        <Button
                          id="notification-popover-content-btn"
                          variant="danger"
                          onClick={() =>
                            handleInviteDecline(invite.project._id)
                          }
                        >
                          Decline
                        </Button>
                        <Button
                          id="notification-popover-content-btn"
                          variant="success"
                          onClick={() => handleInviteAccept(invite.project._id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </>
                  ))
                ) : (
                  <span>No new notifications</span>
                )}
              </div>
            </Popover.Content>
          </Popover>
        }
      >
        <IoNotifications id="notification-bell-icon" />
      </OverlayTrigger>
      {invitations && invitations.length > 0 && (
        <span
          id="notification-bell-icon-number"
          onClick={() => console.log("hello world")}
        >
          {invitations && invitations.length}
        </span>
      )}
    </span>
  );
};
