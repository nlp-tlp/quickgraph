import { AppBar, Grid, Toolbar, Typography } from "@mui/material";
import { HeaderFooterZIndex } from "../../shared/constants/layout";

function Footer({ minBreakpoint }) {
  return (
    <Grid container item p={2}>
      <AppBar
        position="fixed"
        elevation={0}
        color="primary"
        sx={{
          top: "auto",
          bottom: 0,
          padding: minBreakpoint ? 0 : "12px",
          zIndex: HeaderFooterZIndex,
        }}
      >
        <Toolbar style={{ justifyContent: "center" }}>
          <Typography variant="body2">
            Copyright © {new Date().getFullYear()} QuickGraph
          </Typography>
        </Toolbar>
      </AppBar>
    </Grid>
  );
}

export default Footer;
