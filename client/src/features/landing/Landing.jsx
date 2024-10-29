import React, { useState } from "react";
import {
  Grid,
  Box,
  Stack,
  Typography,
  Container,
  Button,
  AppBar,
  Toolbar,
  Paper,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Link as MuiLink,
  ListItemButton,
  ListItemIcon,
} from "@mui/material";
import { useTheme } from "@emotion/react";
import useMediaQuery from "@mui/material/useMediaQuery";
import FilterNoneIcon from "@mui/icons-material/FilterNone";
import BoltIcon from "@mui/icons-material/Bolt";
import GroupIcon from "@mui/icons-material/Group";
import CelebrationIcon from "@mui/icons-material/Celebration";
import { Link, NavLink } from "react-router-dom";
import InputIcon from "@mui/icons-material/Input";
import LoginIcon from "@mui/icons-material/Login";
import { DocsLinks } from "../../shared/constants/general";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import AppsIcon from "@mui/icons-material/Apps";
import HomeIcon from "@mui/icons-material/Home";
import ArticleIcon from "@mui/icons-material/Article";
import PaymentsIcon from "@mui/icons-material/Payments";
import { useAuth } from "../../shared/context/AuthContext";
import { useAuthRedirect } from "../../shared/hooks/useAuthRedirect";

const FeatureData = [
  {
    name: "Multi-task",
    description: "Perform simultaneous entity and relation annotation",
    icon: <FilterNoneIcon fontSize="inherit" color="bright" />,
  },
  {
    name: "Rapid",
    description: "Use annotation propagation to rapidly create graphs",
    icon: <BoltIcon fontSize="inherit" color="bright" />,
  },
  {
    name: "Collaborative",
    description:
      "Annotate by yourself or as a team with comprehensive adjudication",
    icon: <GroupIcon fontSize="inherit" color="bright" />,
  },
  {
    name: "Delightful",
    description: "Minimalistic design that is intuitive and a pleasure to use",
    icon: <CelebrationIcon fontSize="inherit" color="bright" />,
  },
];

export const ResponsiveTypography = (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Typography variant={isMobile ? "h4" : "h1"} {...props}>
      {props.children}
    </Typography>
  );
};

export const Header = () => {
  const theme = useTheme();
  const { logout, isAuthenticated } = useAuth();
  const { logoutWithRedirect } = useAuthRedirect();

  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const activeStyle = {
    color: "red",
    fontWeight: "bold",
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      color="transparent"
      sx={{ bgcolor: theme.palette.primary.light, color: "bright.light" }}
    >
      <Container>
        <Toolbar>
          <AppsIcon />
          <Button
            as={NavLink}
            to="/"
            sx={{
              color: "bright.light",
              textDecoration: "none",
              flexGrow: 1,
            }}
          >
            QuickGraph
          </Button>
          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerOpen}
              >
                <MenuIcon />
              </IconButton>
              <Drawer anchor="right" open={open} onClose={handleDrawerClose}>
                <Box
                  sx={{ width: 250 }}
                  role="presentation"
                  onClick={handleDrawerClose}
                  onKeyDown={handleDrawerClose}
                >
                  <List>
                    <ListItem key={"pricing"}>
                      <ListItemButton
                        component={NavLink}
                        to={"/pricing"}
                        activeStyle={activeStyle}
                      >
                        <ListItemIcon>
                          <PaymentsIcon />
                        </ListItemIcon>
                        <ListItemText primary={"Pricing"} />
                      </ListItemButton>
                    </ListItem>
                    <ListItem key={"documentation"}>
                      <ListItemButton
                        component={NavLink}
                        to={DocsLinks.home}
                        target="_blank"
                        rel="noreferrer"
                        alt="QuickGraph Documentation"
                      >
                        <ListItemIcon>
                          <ArticleIcon />
                        </ListItemIcon>
                        <ListItemText primary={"Documentation"} />
                      </ListItemButton>
                    </ListItem>
                    <ListItem key={isAuthenticated ? "logout" : "login"}>
                      <ListItemButton
                        onClick={() =>
                          isAuthenticated ? logout() : loginWithRedirect()
                        }
                      >
                        <ListItemIcon>
                          {isAuthenticated ? <LogoutIcon /> : <LoginIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={isAuthenticated ? "Logout" : "Login"}
                        />
                      </ListItemButton>
                    </ListItem>
                    <ListItem key={"home"}>
                      <ListItemButton component={NavLink} to="/">
                        <ListItemIcon>
                          <HomeIcon />
                        </ListItemIcon>
                        <ListItemText primary={"Home"} />
                      </ListItemButton>
                    </ListItem>
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            <Box sx={{ "& > :not(style)": { m: 1 } }}>
              <Button
                as={NavLink}
                sx={{ textDecoration: "none", color: "inherit" }}
                to="/"
                activeClassName="active-link"
              >
                Home
              </Button>
              <Button
                as={NavLink}
                sx={{ textDecoration: "none", color: "inherit" }}
                to="/pricing"
                activeClassName="active-link"
              >
                Pricing
              </Button>
              <Button
                component="a"
                href={DocsLinks.home}
                target="_blank"
                rel="noreferrer"
                alt="QuickGraph Documentation"
                sx={{ color: "inherit" }}
              >
                Documentation
              </Button>
              <Button
                variant="contained"
                disableElevation
                title={isAuthenticated ? "Click to logout" : "Click to log in"}
                onClick={isAuthenticated ? logout : undefined}
                component={isAuthenticated ? "button" : Link}
                to={isAuthenticated ? undefined : "/auth?option=login"}
                endIcon={isAuthenticated ? <LogoutIcon /> : <LoginIcon />}
              >
                {isAuthenticated ? "Logout" : "Log In"}
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

const MainContent = ({ isMobile }) => {
  return (
    <Container
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        color: "bright.light",
      }}
    >
      <Box my={4} textAlign="center">
        <ResponsiveTypography fontWeight={700}>QuickGraph</ResponsiveTypography>
        <Typography variant="subtitle1">
          Turn information into understanding with QuickGraph
        </Typography>
        <Box mt={2}>
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <LoginButton />
            <Button
              component="a"
              variant="outlined"
              disableElevation
              color="bright"
              href={DocsLinks.home}
              target="_blank"
              rel="noreferrer"
              alt="QuickGraph Documentation"
            >
              Learn More
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box my={4}>
        <Grid container spacing={2} justifyContent="center">
          {FeatureData.map((item, index) => (
            <Grid key={index} item xs={12} sm={6} md={3} textAlign="center">
              <Paper
                variant="outlined"
                sx={{
                  border: "1px solid white",
                  color: "inherit",
                  bgcolor: "transparent",
                  p: "0.5rem",
                  minHeight: "100px",
                }}
              >
                <Typography variant="h6">{item.name}</Typography>
                <Typography>{item.description}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export const Footer = ({ isMobile }) => {
  return (
    <Box mt={5} py={3}>
      <Container>
        <Grid container direction="column" alignItems="center">
          <Grid item>
            <Stack
              direction={isMobile ? "column" : "row"}
              justifyContent="center"
              alignItems="center"
              spacing={isMobile ? 1 : 2}
            >
              <Box component="span" my={!isMobile && 1}>
                <MuiLink
                  color="inherit"
                  href={DocsLinks.feedback}
                  target="_blank"
                  rel="noreferrer"
                  alt="QuickGraph Contact Us"
                >
                  Contact
                </MuiLink>
              </Box>
              <Box component="span" my={!isMobile && 1}>
                <MuiLink
                  color="inherit"
                  href={DocsLinks["terms-and-conditions"]}
                  target="_blank"
                  rel="noreferrer"
                  alt="QuickGraph Terms and Conditions"
                >
                  Terms and Conditions
                </MuiLink>
              </Box>
              <Box component="span" my={!isMobile && 1}>
                <MuiLink
                  color="inherit"
                  href={DocsLinks["privacy-policy"]}
                  target="_blank"
                  rel="noreferrer"
                  alt="QuickGraph Privacy Policy"
                >
                  Privacy Policy
                </MuiLink>
              </Box>
            </Stack>
          </Grid>
          <Grid item>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Launched into the digital cosmos by{" "}
              <span role="img" aria-label="rocket">
                🚀
              </span>{" "}
              <MuiLink
                data-testid="footer-github-link"
                href="https://github.com/4theKnowledge"
                color="primary"
                underline="hover"
                target="_blank"
                rel="noreferrer"
                sx={{ color: "inherit" }}
              >
                Tyler Bikaun (4theKnowledge)
              </MuiLink>
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

const Landing = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      sx={{
        backgroundColor: theme.palette.primary.light,
        color: "bright.light",
      }}
    >
      <Header isMobile={isMobile} />
      <MainContent isMobile={isMobile} />
      <Footer isMobile={isMobile} />
    </Box>
  );
};

const LoginButton = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Button
      variant="contained"
      disableElevation
      component={Link}
      to={isAuthenticated ? "/home" : "/auth?option=signup"}
      endIcon={isAuthenticated ? <LoginIcon /> : <InputIcon />}
      title={
        isAuthenticated
          ? "Click to enter QuickGraph"
          : "Click to get started with QuickGraph"
      }
      sx={{
        bgcolor: "white",
        color: "primary.dark",
        "&:hover": { color: "white" },
      }}
    >
      {isAuthenticated ? "Enter" : "Get started"}
    </Button>
  );
};

export default Landing;
