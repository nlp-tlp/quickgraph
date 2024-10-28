import React from "react";
import {
  Typography,
  Container,
  Box,
  Paper,
  Stack,
  Button,
} from "@mui/material";
import AppsIcon from "@mui/icons-material/Apps";

const DeviceTooSmall = () => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        p: 4,
        height: "100vh",
        bgcolor: "primary.light",
      }}
    >
      <Box as={Paper} variant="outlined" p={2} sx={{ maxWidth: "50vw" }}>
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
          <Typography
            variant="paragraph"
            gutterBottom
            lineHeight={1.5}
            textAlign={"center"}
          >
            👋 Hey there! For the best experience, try resizing your screen,
            using a larger device, or switching to landscape mode on a tablet.
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              variant="outlined"
              size="small"
              as="a"
              href="/"
              sx={{ textDecoration: "none" }}
            >
              Go to Home
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default DeviceTooSmall;
