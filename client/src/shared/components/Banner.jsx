import { Alert } from "@mui/material";
import { useLocation } from "react-router-dom";

const Banner = ({ message, onClose }) => {
  const location = useLocation();
  const path = location.pathname;
  const bannerWidth = "100%"; // path === "/" ? "100vw" : "calc(100vw - 300px)";

  const styles = {
    display: "flex",
    alignItems: "center",
    padding: "1rem",
    position: "fixed",
    top: 0,
    right: 0,
    zIndex: 10000,
    height: "2rem",
    width: bannerWidth,
  };
  return (
    <Alert
      sx={{ ...styles }}
      severity="warning"
      // onClose={onClose}
    >
      {message}
    </Alert>
  );
};

export default Banner;
