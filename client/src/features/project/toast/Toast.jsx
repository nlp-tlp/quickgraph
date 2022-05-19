import "./Toast.css";
import history from "../../utils/history";
import { Toast } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  selectShowToast,
  selectToastInfo,
  setShowToast,
  selectPage,
  setPageBeforeViewChange,
  setShowQuickView,
  setShowCluster,
  setPage,
  setTextsIdle,
  unsetSourceTargetRels,
} from "../../../app/dataSlice";
import { IoEnter, IoDocuments } from "react-icons/io5";
import {
  MdLabel,
  MdCreate,
  MdContentPaste,
  MdDelete,
  MdDeleteSweep,
  MdDone,
  MdDoneAll,
} from "react-icons/md";
import {
  selectFilters,
  setFilters,
  resetFilters,
  selectProject,
} from "../projectSlice";

export const AnnotationToast = () => {
  const dispatch = useDispatch();
  const toastInfo = useSelector(selectToastInfo);
  const showToast = useSelector(selectShowToast);
  const toastAvailable = Object.keys(toastInfo).length > 0;
  const filters = useSelector(selectFilters);
  const project = useSelector(selectProject);

  const page = useSelector(selectPage);

  const handleFilter = (info) => {
    // Applies filter based on user action.

    dispatch(setPageBeforeViewChange(page));
    dispatch(resetFilters());
    dispatch(
      setFilters({
        ...filters,
        textIds: { ...filters["textIds"], value: info.content.textIds },
      })
    );
    dispatch(unsetSourceTargetRels()); // Unselect span
    dispatch(setShowQuickView(true));
    dispatch(setShowCluster(false)); //In case user is in cluster view when going to quick view
    dispatch(setPage(1));
    history.push(`/annotation/${project._id}/page=1`);
    dispatch(setTextsIdle());
  };

  const toastContent = (info) => {
    let title;
    let content;
    let icon;
    let color;

    switch (info.action) {
      case "accept":
        title = "Accepted";
        content = `Accepted ${
          info.annotationType === "entity" ? "entity" : "relation"
        } annotation${info.applyAll ? "s" : ""}`;
        icon = info.applyAll ? <MdDoneAll /> : <MdDone />;
        color = info.applyAll ? "#26a69a" : "#66bb6a";
        break;
      case "delete":
        title = "Deleted";
        content = `Deleted ${
          info.annotationType === "entity" ? "entity" : "relation"
        } annotation${info.applyAll ? "s" : ""}`;
        icon = info.applyAll ? <MdDeleteSweep /> : <MdDelete />;
        color = info.applyAll ? "#ef5350" : "orange";
        break;
      case "apply":
        title = "Applied";
        content = `Applied ${
          info.annotationType === "entity" ? "entity" : "relation"
        } annotation${info.applyAll ? "s" : ""}`;
        icon = info.applyAll ? <MdContentPaste /> : <MdCreate />;
        color = info.applyAll ? "#26a69a" : "#66bb6a";

        break;
      default:
        title = "Error 😞";
        content = "Something went wrong..";
        break;
    }

    return (
      <>
        <Toast.Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "none",
            alignItems: "center",
            borderLeft: `6px solid ${color}`,
            overflowWrap: "break-word",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", color: "#455a64" }}
          >
            <span
              style={{
                fontSize: "1rem",
                marginRight: "0.25rem",
              }}
            >
              {icon}
            </span>
            <span style={{ fontWeight: "bold" }}>{title}</span>
          </div>
        </Toast.Header>
        <Toast.Body style={{ borderLeft: `6px solid ${color}`, paddingTop: 0 }}>
          <div>
            <span
              style={{ display: "flex", color: "#263238", textAlign: "left" }}
            >
              {content}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "0.5rem 0rem",
              }}
            >
              {info.content.label && (
                <>
                  <span style={{ color: "#78909c", marginRight: "0.25rem" }}>
                    <MdLabel />
                  </span>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#263238",
                      overflowWrap: "break-word",
                      width: "80%",
                    }}
                  >
                    {info.content.label}
                  </span>
                </>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ color: "#78909c", marginRight: "0.25rem" }}>
                <IoDocuments />
              </span>
              <span style={{ fontWeight: "bold", color: "#263238" }}>
                {info.content.count}
              </span>
            </div>
            {["apply", "accept"].includes(info.action) &&
              info.content.count > 1 && (
                <span id="toast-go-to" onClick={() => handleFilter(info)}>
                  <span id="toast-go-to-icon">
                    <IoEnter />
                  </span>
                  <span>Click to filter</span>
                </span>
              )}
          </div>
        </Toast.Body>
      </>
    );
  };

  if (!toastAvailable) {
    return <></>;
  } else {
    return (
      <Toast
        show={showToast}
        onClose={() => dispatch(setShowToast(false))}
        style={{
          position: "fixed",
          top: 90,
          right: 20,
          width: 200,
          zIndex: 1000,
        }}
        delay={4000}
        autohide
      >
        {toastContent(toastInfo)}
      </Toast>
    );
  }
};
