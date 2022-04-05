import React from "react";
import "./Auth.css";
import { Card, Button } from "react-bootstrap";
import UnauthorizedImage from "../../media/unauthorized.jpeg";
import history from "../utils/history";

export const Unauthorized = () => {
  return (
    <Card id="unauthorized-card">
      <Card.Img src={UnauthorizedImage} />
      <Card.Body>
        <Card.Title>Unable to Access Page (Unauthorised)</Card.Title>
        <div id="unauthorized-container">
          <Button
            variant="secondary"
            href="/signup"
            // onClick={() => history.push("/signup")}
          >
            Sign Up
          </Button>
          <Button
            variant="dark"
            href="/login"
            // onClick={() => history.push("/login")}
          >
            Log In
          </Button>
        </div>
        <div id="return-button">
          <a href="/" className="text-muted">
            Return to landing page
          </a>
        </div>
      </Card.Body>
    </Card>
  );
};
