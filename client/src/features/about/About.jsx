import { useState, useEffect } from "react";
import { Container, Grid } from "@mui/material";
import ReactMarkdown from "react-markdown";
import aboutMarkdown from "./about.md";

export default function About() {
  const [markdown, setMarkdown] = useState(null);

  useEffect(() => {
    if (markdown === null) {
      fetch(aboutMarkdown)
        .then((res) => res.text())
        .then((text) => setMarkdown(text));
    }
  }, [markdown]);

  if (markdown === null) {
    return <h1>Loading...</h1>;
  } else {
    return (
      <Grid
        container
        direction="column"
        alignItems="center"
        spacing={0}
        // justifyContent="center"
        style={{ minHeight: "100vh" }}
      >
        <Grid item xs={12}>
          Header
        </Grid>
        <Grid item xs={12} justifContent="center" alignItems="center">
          <ReactMarkdown children={markdown} />
        </Grid>
      </Grid>
    );
  }
}
