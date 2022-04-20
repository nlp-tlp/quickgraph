import { Grid, CircularProgress, Typography } from "@mui/material";

export const Loader = ({ message }) => {
  return (
    <Grid
      item
      xs={12}
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Typography variant="h5">{message}</Typography>
      <CircularProgress sx={{ color: "primary" }} />
    </Grid>
  );
};
