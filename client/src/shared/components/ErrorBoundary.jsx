/**
 * Contextual error boundary for handling any unexpected errors.
 */
import React from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Stack,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import { DocsLinks } from "../constants/general";
import AppsIcon from "@mui/icons-material/Apps";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ hasError: true });

    // You can log the error to an error reporting service
  }

  refreshPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            justifyContent: "center",
            p: 4,
            height: "100vh",
            width: "100vw",
            bgcolor: "primary.light",
          }}
        >
          <Box as={Paper} variant="outlined" p={2}>
            <Stack direction="column" spacing={4} alignItems="center">
              <Stack
                direction="row"
                justifyContent="left"
                alignItems="center"
                width="100%"
                spacing={1}
              >
                <AppsIcon color="primary" />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                  color="primary.dark"
                >
                  QuickGraph
                </Typography>
              </Stack>
              <Typography variant="paragraph" gutterBottom>
                Oops. Something went wrong. Try refreshing the page.
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Button
                  as="a"
                  variant="outlined"
                  size="small"
                  href={DocsLinks.feedback}
                  target="_blank"
                  rel="noreferrer"
                  alt="QuickGraph Documentation - Feedback"
                  sx={{ textDecoration: "none" }}
                >
                  Report Issue
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  as="a"
                  href="/home"
                  sx={{ textDecoration: "none" }}
                >
                  Go to Home
                </Button>
                <Button
                  title="Click to refresh the page"
                  variant="contained"
                  size="small"
                  onClick={this.refreshPage}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
