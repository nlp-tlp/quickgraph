import React from "react";
import { Box, Alert, AlertTitle, CircularProgress } from "@mui/material";

const LoadingAlert = ({ message }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Alert severity="info" variant="outlined">
        <AlertTitle>Loading</AlertTitle>
        <>
          {message}
          <CircularProgress size="small" />
        </>
      </Alert>
    </Box>
  );
};

export default LoadingAlert;
