import React from "react";
import history from "../utils/history";
import { useParams } from "react-router-dom";

export const Anonpage = () => {
  const { projectId, accessId } = useParams();

  const handleAccept = () => {
    //   Update annotator status with 'accepted'
    // Redirect anon user to the project page for annotation.
    history.push(`/project/${projectId}/${accessId}/page/1`);
  };

  const handleDeny = () => {
    //   Annon denies to participate; update annotator state with 'denied' status.
  };

  const name = "anonX"; // Will be updated with side effect on load

  return (
    <div
      style={{ display: "flex", flexDirection: "column", textAlign: "center" }}
    >
      Hello {name} ({accessId})!
      <div
        style={{ display: "flex", flexDirection: "column", margin: "0.5rem" }}
      >
        Accept invitation and commence annotating
        <button
          style={{ width: "100px", margin: "auto" }}
          onClick={handleAccept}
        >
          Accept
        </button>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", margin: "0.5rem" }}
      >
        Decline invitation
        <button style={{ width: "100px", margin: "auto" }}>Decline</button>
      </div>
    </div>
  );
};
