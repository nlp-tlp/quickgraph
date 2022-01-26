import React from "react";
import { useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";

import { useDispatch } from "react-redux";
import { setActiveModal } from "../project/projectSlice";

export const Annotate = ({ projectId }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const confirmationAction = () => {
    dispatch(setActiveModal(null));
    history.push(`/annotation/${projectId}/page=1`);
  };

  return (
    <>
      <p style={{ textAlign: "center" }}>
        Load project and commence annotating?
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          marginTop: "1em",
        }}
      >
        <Button variant="dark" onClick={() => confirmationAction()}>
          Lets Go!
        </Button>
      </div>
    </>
  );
};
