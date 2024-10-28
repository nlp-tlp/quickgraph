import { createTheme } from "@mui/material";
import { grey, purple } from "@mui/material/colors";

// import { ThemeOptions } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: purple[700],
      dark: purple[900],
      light: purple[500],
    },
    secondary: {
      main: "#9c27b0",
    },
    neutral: {
      main: grey[500],
      dark: grey[900],
      light: grey[100],
    },
    bright: {
      light: "rgba(255,255,255,0.95)",
      main: "rgba(255,255,255,0.8)",
      dark: "rgba(255,255,255,0.625)",
    },
    info: {
      main: purple[700],
    },
  },
  // components: {
  //   MuiListItemButton: {
  //     styleOverrides: {
  //       root: {
  //         "&:hover": {
  //           backgroundColor: purple[700],
  //           color: "white",
  //         },
  //         "&.Mui-selected": {
  //           backgroundColor: purple[700],
  //           color: "white",
  //           ":hover": {
  //             backgroundColor: purple[500],
  //             color: "white",
  //           },
  //         },
  //       },
  //     },
  //   },
  //   // MuiTooltip: {
  //   //   styleOverrides: {
  //   //     root: {
  //   //       color: "red",
  //   //     },
  //   //   },
  //   // },
  // },
});
