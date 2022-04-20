import { createTheme } from "@mui/material";
import { teal, grey } from "@mui/material/colors";

export const theme = createTheme({
  palette: {
    primary: {
      main: teal[700],
      light: teal[400]
    },
    secondary: {
      main: grey[500],
    },
  },
});
