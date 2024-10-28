import { useLocation } from "react-router-dom";
import { Grid } from "@mui/material";
import InfoSnackbar from "../InfoSnackbar";

const MainContainer = ({ children, location: propLocation }) => {
  let location = useLocation();

  if (propLocation) {
    location = propLocation;
  } else {
    // Remove 24 char hexidecimal ObjectID from path
    location = location.pathname.replace(/\/[0-9a-fA-F]{24}(?=\/|$)/, "");
  }

  return (
    <>
      <Grid item xs={12} mb={2}>
        <InfoSnackbar location={location} />
      </Grid>
      {children}
    </>
  );
};

export default MainContainer;
