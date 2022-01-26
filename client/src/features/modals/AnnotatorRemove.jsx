import React, { useState } from "react";
import "./Modals.css";
import { Button } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { setActiveModal, updateAnnotator } from "../project/projectSlice";

export const AnnotatorRemove = ({ projectId, data }) => {
  const dispatch = useDispatch();
  const [valueMatched, setValueMatched] = useState(false);
  const checkValueMatch = (value) => {
    setValueMatched(value === data.username);
  };

  const handleRemove = () => {
    dispatch(
      updateAnnotator({
        projectId: projectId,
        userId: data.userId,
        action: "remove",
      })
    );
    dispatch(setActiveModal(null));
  };

  return (
    <div>
      <div className="delete">
        <p>
          Please enter <strong>{data.username}</strong> in the field below to
          remove this annotator
        </p>
        <input
          id="input-text"
          type="text"
          placeholder="Enter username here"
          autoComplete={false}
          onChange={(e) => checkValueMatch(e.target.value)}
        />
        <div id="button">
          <Button
            variant="danger"
            size="sm"
            disabled={!valueMatched}
            onClick={handleRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};
