import React, { useContext } from "react";
import "./Landing.css";
import "../common/Footer.css";
import history from "../utils/history";
import { BiSmile } from "react-icons/bi";
import { IoSpeedometer, IoEnter, IoExpand, IoTrophy } from "react-icons/io5";
import { IoLogoGithub, IoLogoYoutube } from "react-icons/io5";
import { Button, Navbar, Container, Row, Col } from "react-bootstrap";
import Logo from "../../media/quickgraph_logo.png";
import { selectIsAuthenticated } from "../auth/userSlice";
import { useSelector } from "react-redux";

import {
  IoArrowDownCircleOutline,
  IoArrowUpCircleOutline,
} from "react-icons/io5";

export const Landing = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <>
      <Container fluid className="landing">
        <IoLogoGithub
          className="nav-logo"
          id="github"
          onClick={() =>
            window.open("https://github.com/nlp-tlp/quickgraph", "_blank")
          }
        />
        <IoLogoYoutube
          className="nav-logo"
          id="youtube"
          onClick={() => window.open("https://youtu.be/ZlzH-AAoGXs", "_blank")}
        />
        <Row id="main">
          <Col>
            <Row id="row-title">
              <div id="title-container">
                <img src={Logo} alt="quickgraph logo" id="title-icon" />
                <h1>QuickGraph</h1>
              </div>
            </Row>
            <Row id="row-description">
              <Col xs={12} md={8} lg={8} xl={8}>
                <h3>
                  An annotation tool for rapid knowledge graph extraction from
                  text
                </h3>
              </Col>
            </Row>
            <Row id="row-signup">
              <div
                id="button-group"
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Button
                  id="signup-button"
                  href={isAuthenticated ? "/feed" : "/signup"}
                  // onClick={
                  //   isAuthenticated
                  //     ? () => history.push("/feed")
                  //     : () => history.push("/signup")
                  // }
                >
                  {isAuthenticated ? (
                    <div>
                      Enter <IoEnter />
                    </div>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
                {!isAuthenticated && (
                  <span
                    style={{
                      textAlign: "right",
                      marginRight: "0.5rem",
                      color: "#263238",
                    }}
                  >
                    or{" "}
                    <a
                      style={{
                        color: "#263238",
                      }}
                      href="/login"
                      // onClick={() => history.push("/login")}
                    >
                      <strong style={{ cursor: "pointer" }}>login</strong>
                    </a>
                  </span>
                )}
              </div>
            </Row>
            <Row style={{ justifyContent: "center" }}>
              <a href="#details">
                <IoArrowDownCircleOutline id="scroll-button-down" />
              </a>
            </Row>
          </Col>
        </Row>

        <Row id="details">
          <Col>
            <Row id="row-details">
              <Col xs={12} md={4} lg={4} xl={4}>
                <div id="box">
                  <IoSpeedometer id="icon" />
                  <h3>Fast</h3>
                  <p>
                    Accelerates annotation via entity and relation propagation,
                    and semantic clustering
                  </p>
                </div>
              </Col>
              <Col xs={12} md={4} lg={4} xl={4}>
                <div id="box">
                  <IoExpand id="icon" />
                  <h3>Powerful</h3>
                  <p>
                    Supports complex multi-task entity and open/closed relation
                    annotation and knowledge graph extraction
                  </p>
                </div>
              </Col>
            </Row>
            <Row id="row-details">
              <Col xs={12} md={4} lg={4} xl={4}>
                <div id="box">
                  <BiSmile id="icon" />
                  <h3>Intuitive</h3>
                  <p>
                    Maintains a simple and easy-to-use interface for improved
                    consistency
                  </p>
                </div>
              </Col>
              <Col xs={12} md={4} lg={4} xl={4}>
                <div id="box">
                  <IoTrophy id="icon" />
                  <h3>Insightful</h3>
                  <p>
                    Builds real-time knowledge graphs from annotations, and
                    provides three dimensions of inter-annotator agreement
                  </p>
                </div>
              </Col>
            </Row>
            <Row style={{ justifyContent: "right" }}>
              <a href="#main">
                <IoArrowUpCircleOutline id="scroll-button-up" />
              </a>
            </Row>
            <Row>
              <Navbar
                className="footer"
                style={{
                  width: "100%",
                  position: "absolute",
                  bottom: "0",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <p
                  style={{
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "1rem",
                  }}
                >
                  © UWA NLP-TLP Group 2021.
                </p>
                <p style={{ fontSize: "0.75rem" }}>
                  Developer: Tyler Bikaun (
                  <a
                    href="https://github.com/4theKnowledge"
                    target="_blank"
                    rel="noreferrer"
                    alt="github repository"
                    style={{
                      color: "#263238",
                      fontWeight: "bold",
                    }}
                  >
                    4theKnowledge
                  </a>
                  )
                </p>
              </Navbar>
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};
