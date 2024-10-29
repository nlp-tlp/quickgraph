import React from "react";
import {
  Typography,
  Box,
  Container,
  Paper,
  Button,
  Divider,
} from "@mui/material";
import { styled } from "@mui/system";
import { useTheme } from "@emotion/react";
import { Header, Footer, ResponsiveTypography } from "./Landing";
import { DocsLinks } from "../../shared/constants/general";
import InputIcon from "@mui/icons-material/Input";
import useMediaQuery from "@mui/material/useMediaQuery";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "center",
  marginBottom: theme.spacing(3),
}));

const MainContent = () => {
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
        <Container maxWidth="md">
          <ResponsiveTypography fontWeight={600} gutterBottom align="center">
            Pricing
          </ResponsiveTypography>
          <Typography variant="h5" component="h2" gutterBottom align="center">
            Our product is currently free to use!
          </Typography>
          <Box p="2rem 0rem">
            <Divider flexItem color="white" />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginTop: "2rem",
            }}
          >
            <StyledPaper>
              <Typography
                variant="h4"
                component="h3"
                gutterBottom
                color="primary"
              >
                Free Plan
              </Typography>
              <Typography variant="h6" gutterBottom>
                $0 per month
              </Typography>
              <Typography component="p" gutterBottom>
                Enjoy our product with all its features for free during the
                testing phase.
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  to="auth?option=signup"
                  component={Link}
                  endIcon={<InputIcon />}
                  title="Click to get started with QuickGraph"
                >
                  Get Started for Free
                </Button>
              </Box>
            </StyledPaper>
          </Box>
          <Typography variant="body1" align="center">
            We're working on creating a variety of pricing plans to suit your
            needs. Check back soon for updates!
          </Typography>

          {/* <Box p="1rem 0rem">
        <Divider flexItem color="white" />
      </Box> */}
          {/* Features List */}
          {/* <Typography variant="h4" component="h3" gutterBottom align="center">
        Free Plan Features
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="Feature 1"
            secondary="Description of Feature 1"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Feature 2"
            secondary="Description of Feature 2"
          />
        </ListItem>
      </List> */}

          <Box p="2rem 0rem">
            <Divider flexItem color="white" />
          </Box>
          <Typography variant="h4" component="h3" gutterBottom align="center">
            Become an Early Tester!
          </Typography>
          <Typography component="p" gutterBottom align="center">
            Join our early tester program to help shape the future of our
            product and enjoy free subscriptions when we introduce paid plans.
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginTop: "2rem",
            }}
          >
            <Button
              variant="contained"
              sx={{
                bgcolor: "white",
                color: "primary.dark",
                "&:hover": { color: "white" },
              }}
              title="Click to join Early Tester program"
              disableElevation
              color="bright"
              component="a"
              href={DocsLinks["early-tester-program"]}
              target="_blank"
              rel="noreferrer"
              alt="QuickGraph Early Tester Program"
            >
              Join Early Tester Program
            </Button>
          </Box>
        </Container>
      </Box>
    </Container>
  );
};

const PricingPage = () => {
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

export default PricingPage;
