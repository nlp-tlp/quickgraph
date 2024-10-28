import { useEffect } from "react";
import {
  Typography,
  Button,
  Stack,
  CircularProgress,
  Container,
  Box,
  Paper,
} from "@mui/material";
import { Link } from "react-router-dom";
import { DocsLinks } from "../../constants/general";
import AppsIcon from "@mui/icons-material/Apps";

const AuthPages = ({ page }) => {
  useEffect(() => {
    if (page === "error") {
      setTimeout(() => {
        // history.push("/projects-explorer");
      }, 1000);
    }
  }, [page]);

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          justifyContent: "center",
          p: 4,
          height: "100vh",
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
            <Typography variant="h5" gutterBottom color="primary">
              No authorization found
            </Typography>
            <Typography sx={{ fontSize: 14 }}>
              This page is not publicly available. To access it please log in
              first.
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
                variant="contained"
                size="small"
                as={Link}
                to="/"
                sx={{ textDecoration: "none" }}
              >
                Go to Home
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
};

// const ReturnAction = () => {
//   return (
//     <Button component={Link} to="/">
//       Return to landing page
//     </Button>
//   );
// };

// const NotExistContent = () => {
//   return (
//     <Typography variant="paragraph" gutterBottom>
//       Page does not exist
//     </Typography>
//   );
// };

// const ErrorContent = () => {
//   useEffect(() => {
//     setTimeout(() => {
//       // history.push("/projects-explorer");
//     }, 2000);
//   }, []);

//   return (
//     <Stack
//       direction="column"
//       justifyContent="center"
//       alignItems="center"
//       spacing={2}
//     >
//       <Typography variant="button">Oops. Something went wrong</Typography>
//       <Typography variant="paragraph">Redirecting to projects</Typography>
//       <CircularProgress />
//     </Stack>
//   );
// };

// const UnauthorizedContent = () => {
//   return (
//     <Typography variant="paragraph" gutterBottom>
//       Unable to Access Page (Unauthorised)
//     </Typography>
//   );
// };

export default AuthPages;
