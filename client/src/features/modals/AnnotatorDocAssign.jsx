import React, { useState, useEffect } from "react";
import axios from "../utils/api-interceptor";
import "./Modals.css";
import { Button, Form, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { inviteAnnotators, setActiveModal } from "../project/projectSlice";

export const AnnotatorDocAssign = ({ projectId }) => {
  const dispatch = useDispatch();
  return (
    <div>
      <p>Please select annotators to invite to this project</p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="dark"
          size="sm"
          // onClick={handleAddAnnotators}
        >
          Invite
        </Button>
      </div>
    </div>
  );
};
