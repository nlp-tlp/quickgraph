import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  selectDeleteProjectStatus,
  deleteProject,
  setActiveModal,
} from "../../features/project/projectSlice";
import { setIdle } from "../../features/feed/feedSlice";
import history from "../utils/history";
import "./Modals.css";

export const Delete = ({ projectId, projectName }) => {
  const dispatch = useDispatch();
  const deleteProjectStatus = useSelector(selectDeleteProjectStatus);
  const [valueMatched, setValueMatched] = useState(false);
  const checkValueMatch = (value) => {
    setValueMatched(value === projectName);
  };

  useEffect(() => {
    if (deleteProjectStatus === "succeeded") {
      dispatch(setIdle());
      dispatch(setActiveModal(null));
      history.push("/feed");
    }
  }, [deleteProjectStatus]);

  const deleteHandler = async () => {
    dispatch(deleteProject({ projectId: projectId }));
  };

  return (
    <>
      {deleteProjectStatus === "loading" ? (
        <div className="delete-loading">
          <p id="loading-text">Deleting project - this may take a minute...</p>
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="delete">
          <p>
            Please enter <strong>{projectName}</strong> in the field below to
            delete this project
          </p>
          <input
            id="input-text"
            type="text"
            placeholder="Enter project name here"
            autoComplete={false}
            onChange={(e) => checkValueMatch(e.target.value)}
          />
          <div id="button">
            <Button
              variant="danger"
              disabled={!valueMatched}
              onClick={deleteHandler}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
