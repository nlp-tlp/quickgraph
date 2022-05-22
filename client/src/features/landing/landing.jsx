import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../auth/userSlice";
import "./Landing.css";

import { AppBar, Button, Grid, Toolbar, IconButton } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import YouTubeIcon from "@mui/icons-material/YouTube";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import InfoIcon from "@mui/icons-material/Info";

import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import ParticlesConfig from "./particle-config";

export const Landing = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const particlesInit = async (main) => {
    await loadFull(main);
  };

  return (
    <>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={ParticlesConfig}
      />
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        style={{ zIndex: 999 }}
      >
        <Grid item xs={12} style={{ flexGrow: 1 }}>
          <AppBar position="fixed" elevation={0} style={{ background: "none" }}>
            <Toolbar style={{ display: "flex", justifyContent: "right" }}>
              <div style={{ display: "flex" }}>
                <IconButton
                  href="https://github.com/nlp-tlp/quickgraph"
                  target="_blank"
                  rel="noreferrer"
                  alt="Github repository"
                >
                  <GitHubIcon fontSize="large" color="secondary" id="github" />
                </IconButton>
                <IconButton
                  href="https://youtu.be/DTWrR67-nCU"
                  target="_blank"
                  rel="noreferrer"
                  alt="YouTube demonstration video"
                >
                  <YouTubeIcon
                    fontSize="large"
                    color="secondary"
                    id="youtube"
                  />
                </IconButton>
                <IconButton
                  href="https://github.com/nlp-tlp/quickgraph/blob/main/About.md"
                  target="_blank"
                  rel="noreferrer"
                  alt="QuickGraph About Page"
                >
                  <InfoIcon
                    fontSize="large"
                    color="secondary"
                    id="information"
                  />
                </IconButton>
              </div>
            </Toolbar>
          </AppBar>
        </Grid>
        <Grid
          container
          item
          justifyContent="center"
          alignItems="center"
          direction="column"
          style={{ textAlign: "center", height: "100vh", zIndex: 999 }}
          spacing={2}
        >
          <Grid container item spacing={2}>
            <Grid item xs={12}>
              <h1>QuickGraph</h1>
            </Grid>
            <Grid item xs={12}>
              <h3 style={{ fontWeight: "normal" }}>
                An annotation tool for rapid knowledge graph extraction from
                text
              </h3>
            </Grid>
          </Grid>
          <Grid item>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                href={isAuthenticated ? "/feed" : "/signup"}
                sx={{
                  ":hover": {
                    bgcolor: "primary.light", // theme.palette.primary.main
                    color: "white",
                  },
                }}
                endIcon={isAuthenticated ? <ArrowForwardIosIcon /> : null}
              >
                {isAuthenticated ? "Enter" : "Sign up"}
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
                  >
                    <strong style={{ cursor: "pointer" }}>login</strong>
                  </a>
                </span>
              )}
            </div>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};
