import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  OverlayTrigger,
  Tooltip,
  Col,
  Row,
  Table,
} from "react-bootstrap";
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
          variant="dark"
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
            variant="success"
            size="sm"
            onClick={() => dispatch(setActiveModal("annotatorInvite"))}
          >
            + Invite annotators
          </Button>
        </div>
        <Table striped bordered hover size="sm">
          <thead>
            <tr style={{ textAlign: "center" }}>
              <th></th>
              <th>Username</th>
              <th>Role</th>
              <th>State</th>
              <th colSpan="3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {project.annotators?.map((annotator, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{annotator.user.username}</td>
                <td style={{ textTransform: "capitalize" }}>
                  {annotator.role.replace("_", " ")}
                </td>
                <td style={{ textTransform: "capitalize" }}>
                  {annotator.state}
                </td>
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
                {annotator.role === "projectManager" ? (
                  <td colSpan="3"></td>
                ) : (
                  <>
                    <td>
                      <Button
                        variant="secondary"
                        size="sm"
                        style={{ margin: "0.25rem" }}
                        onClick={() =>
                          dispatch(setActiveModal("annotatorDocAssign"))
                        }
                        title="Click to view annotators assigned documents"
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <IoDocuments style={{ marginRight: "0.25rem" }} />
                          {annotator.assignment.length > 0
                            ? "Modify Assignment"
                            : "Assign Documents"}
                        </span>
                      </Button>
                    </td>
                    <td>
                      <Button
                        variant={!annotator.disabled ? "warning" : "success"}
                        size="sm"
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
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>
                          {!annotator.disabled ? (
                            <IoLockClosed />
                          ) : (
                            <IoLockOpen />
                          )}
                          {!annotator.disabled ? "Disable" : "Activate"}
                        </span>
                      </Button>
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        style={{ margin: "0.25rem" }}
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
                        <IoTrash style={{ fontSize: "1rem" }} />
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        {/* <OverlayTrigger
                      trigger="click"
                      key={`copy-trigger-${index}`}
                      placement="right"
                      rootClose
                      delay={{ show: 250, hide: 100 }}
                      overlay={
                        showCopyTooltip ? (
                          <Tooltip id={`copy-access-link-${index}`}>
                            Copied!
                          </Tooltip>
                        ) : (
                          <div />
                        )
                      }
                    >
                      <IoLink
                        onClick={() => {
                          copyButton();
                          navigator.clipboard.writeText(
                            `localhost:3000/project/${project._id}/${annotator.accessId}`
                          );
                        }}
                        style={{
                          color: "#007bff",
                          margin: "auto 0.5rem",
                          fontSize: "1.25rem",
                          cursor: "pointer",
                        }}
                      />
                    </OverlayTrigger> */}
      </>
    );
  }
};
