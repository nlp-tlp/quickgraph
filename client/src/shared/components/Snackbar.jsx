import { Alert, Snackbar as MuiSnackbar } from "@mui/material";
import { DocsLinks } from "../constants/general";

const Snackbar = ({
  open,
  message,
  severity,
  duration,
  anchorOrigin,
  onClose,
}) => {
  if (severity === "error") {
    message = (
      <>
        {message}
        {" - please try again or "}
        <a
          href={DocsLinks.feedback}
          target="_blank"
          rel="noreferrer"
          alt="QuickGraph Documentation - Feedback"
        >
          let us know
        </a>
      </>
    );
  }

  return (
    <MuiSnackbar
      autoHideDuration={duration}
      open={open}
      anchorOrigin={anchorOrigin}
      onClose={onClose}
      sx={{ zIndex: 10001 }}
    >
      <Alert severity={severity} onClose={onClose}>
        {message}
      </Alert>
    </MuiSnackbar>
  );
};

export default Snackbar;
