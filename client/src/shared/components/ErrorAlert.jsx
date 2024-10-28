import { Alert, AlertTitle } from "@mui/material";
import { DocsLinks } from "../constants/general";

const ErrorAlert = () => {
  return (
    <Alert severity="error">
      <AlertTitle>Oops.</AlertTitle>
      An error occurred - please try again later or{" "}
      <a
        href={DocsLinks.feedback}
        target="_blank"
        rel="noreferrer"
        alt="QuickGraph Documentation - Feedback"
      >
        let us know
      </a>
    </Alert>
  );
};

export default ErrorAlert;
