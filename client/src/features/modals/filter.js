import React from "react";
import { useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";

import { useDispatch } from "react-redux";
import { setActiveModal } from "../project/projectSlice";

export const Filter = () => {
  const dispatch = useDispatch();
  const history = useHistory();
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
          
      </div>
    </>
  );
};
