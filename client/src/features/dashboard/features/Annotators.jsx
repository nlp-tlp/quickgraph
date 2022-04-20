import { useState, useEffect } from "react";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoHourglass,
  IoLink,
  IoTrash,
  IoLockOpen,
  IoLockClosed,
  IoDocuments,
} from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import {
  selectProject,
  setActiveModal,
  updateAnnotator,
  setModalInfo,
} from "../../project/projectSlice";
import axios from "../../utils/api-interceptor";
import "../Dashboard.css";

import {
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

export const Annotators = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const copyButton = () => {
    setShowCopyTooltip(true);

    setTimeout(() => {
      setShowCopyTooltip(false);
    }, 1000);
  };

  if (project.annotators && project.annotators.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          margin: "auto",
          alignItems: "center",
        }}
      >
        <p>No annotators assigned to this project</p>
        <Button
          // variant="dark"
          variant="contained"
          onClick={() => dispatch(setActiveModal("annotatorInvite"))}
        >
          Invite annotators
        </Button>
      </div>
    );
  } else {
    return (
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "right",
            margin: "0rem 0.5rem 1rem 0rem",
          }}
        >
          <Button
            disableElevation
            variant="contained"
            color="primary"
            onClick={() => dispatch(setActiveModal("annotatorInvite"))}
            endIcon={<AddCircleOutlineIcon />}
          >
            Invite annotators
          </Button>
        </div>
        <TableContainer style={{ display: "flex", justifyContent: "center" }}>
          <Table sx={{ maxWidth: 1000 }}>
            <caption>An overview of annotators invited to the current project</caption>
            <TableHead>
              <TableRow>
                <TableCell align="right"></TableCell>
                <TableCell align="center">Username</TableCell>
                <TableCell align="center">Role</TableCell>
                <TableCell align="center">State</TableCell>
                {/* <TableCell colSpan="3">Actions</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {project.annotators?.map((annotator, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell align="center">
                    {annotator.user.username}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ textTransform: "capitalize" }}
                  >
                    {annotator.role.replace("_", " ")}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ textTransform: "capitalize" }}
                  >
                    {annotator.state}
                  </TableCell>
                  {/* Activated means anon accepted invite otherwise denied and not activated.
                                  if no accepted state (e.g. undefined) then its in limbo, waiting. */}
                  {/* {annotator.state === "invited" ? (
                      <IoHourglass />
                    ) : annotator.state === "accepted" ? (
                      <IoCheckmarkCircle style={{ margin: "auto 0rem" }} />
                    ) : (
                      !annotator.state === "declined" && (
                        <IoCloseCircle style={{ margin: "auto 0rem" }} />
                      )
                    )} */}
                  {/* {annotator.role === "projectManager" ? (
                  <TableCell colSpan="3"></TableCell>
                ) : (
                  <>
                    <TableCell>
                      <Button
                        disableElevation
                        variant="contained"
                        style={{ margin: "0.25rem" }}
                        onClick={() =>
                          dispatch(setActiveModal("annotatorDocAssign"))
                        }
                        title="Click to view annotators assigned documents"
                        startIcon={<IoDocuments />}
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>
                          {annotator.assignment.length > 0
                            ? "Modify Assignment"
                            : "Assign Documents"}
                        </span>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        disableElevation
                        variant="contained"
                        // variant={!annotator.disabled ? "warning" : "success"}
                        style={{ margin: "0.25rem" }}
                        onClick={() =>
                          dispatch(
                            updateAnnotator({
                              projectId: project._id,
                              userId: annotator.user._id,
                              action: !annotator.disabled
                                ? "disable"
                                : "activate",
                            })
                          )
                        }
                        title={
                          !annotator.disabled
                            ? "Click to disable annotator"
                            : "Click to activate annotator"
                        }
                        startIcon={
                          !annotator.disabled ? (
                            <IoLockClosed />
                          ) : (
                            <IoLockOpen />
                          )
                        }
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>
                          {!annotator.disabled ? "Disable" : "Activate"}
                        </span>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={() => {
                          dispatch(
                            setModalInfo({
                              username: annotator.user.username,
                              userId: annotator.user._id,
                              action: "remove",
                            })
                          );
                          dispatch(setActiveModal("annotatorRemove"));
                        }}
                        title="Click to remove annotator from project"
                      >
                        <IoTrash />
                      </IconButton>
                    </TableCell>
                  </>
                )} */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  }
};
