import React, { useState } from "react";
import clsx from "clsx";
import styles from "../HomepageFeatures/styles.module.css";
import {
  Grid,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  MenuItem,
} from "@mui/material";
import { purple } from "@mui/material/colors";
import { useTheme } from "@mui/material/styles";
import { useColorMode } from "@docusaurus/theme-common";

const FeedbackOptions = [
  "Feedback",
  "Bug",
  "Request",
  "Question",
  "User Management",
  "Early Tester Program",
];

const Form = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Send the form data to your server or API here
    console.log(name, email, subject, message);
  };

  return (
    <Grid
      container
      component="form"
      as={Paper}
      variant="outlined"
      width="100%"
      p={2}
      direction="column"
      className="main-wrapper"
    >
      <Grid item>
        <Typography fontSize={24} fontWeight={700} gutterBottom>
          Get in touch
        </Typography>
      </Grid>
      <Grid item mb={2}>
        <TextField
          label="Email address"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Grid>
      <Grid item mb={2}>
        <TextField
          label="Username (Optional)"
          type="text"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </Grid>
      <Grid item mb={2}>
        <TextField
          label="Subject"
          fullWidth
          select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          {FeedbackOptions.map((i, index) => (
            <MenuItem value={index}>{i}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item mb={2}>
        <TextField
          label="Enter your message"
          type="email"
          fullWidth
          multiline
          rows={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Grid>
      <Grid item>
        <Box display="flex" justifyContent="right">
          <Button
            variant="contained"
            sx={{ bgcolor: purple[500] }}
            disabled={subject === null || email === "" || message === ""}
          >
            Submit
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default function ContactForm() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <Form />
        </div>
      </div>
    </section>
  );
}
