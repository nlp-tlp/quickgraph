import { useContext } from "react";
import { Box, Button, Divider, Drawer, Stack } from "@mui/material";
import { ProjectContext } from "../../../shared/context/ProjectContext";
import Insights from "./Insights/Insights";
import Guidelines from "./Guidelines/Guidelines";
import Social from "./Social/Social";
import History from "./History/History";

import HistoryIcon from "@mui/icons-material/History";
import InsightsIcon from "@mui/icons-material/Insights";
import ChatIcon from "@mui/icons-material/Chat";
import SubjectIcon from "@mui/icons-material/Subject";

const DiscussionDrawerWidth = 420;

const InformationSidebar = () => {
  const { state, dispatch } = useContext(ProjectContext);
  const components = {
    insights: {
      title: "Click to show annotation insights",
      component: Insights,
      icon: <InsightsIcon />,
    },
    social: {
      title: "Click to show socials",
      component: Social,
      icon: <ChatIcon />,
      // disabled: state.settings.disable_discussion,
    },
    history: {
      title: "Click to show this sessions annotation history",
      component: History,
      icon: <HistoryIcon />,
    },
    guidelines: {
      title: "Click to show annotation guidelines",
      component: Guidelines,
      icon: <SubjectIcon />,
    },
  };

  const Component = components[state.menuView].component ?? <p>Loading...</p>;

  const handleView = (view) => {
    dispatch({ type: "SET_VALUE", payload: { menuView: view } });
  };

  return (
    <Drawer
      sx={{
        width: DiscussionDrawerWidth,
        flexShrink: 0,
        // zIndex: 10001,
        "& .MuiDrawer-paper": {
          width: DiscussionDrawerWidth,
          boxSizing: "border-box",
        },
      }}
      open={state.showMenu}
      anchor="right"
      onClose={() => dispatch({ type: "TOGGLE_MENU" })}
    >
      <Box p={2}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          justifyContent="space-evenly"
        >
          {Object.keys(components).map((name) => (
            <Button
              color={state.menuView === name ? "primary" : "neutral"}
              onClick={() => handleView(name)}
              startIcon={components[name].icon}
              title={components[name].title}
              disabled={components[name].disabled}
              size="small"
            >
              {name}
            </Button>
          ))}
        </Stack>
      </Box>
      <Divider flexItem />
      <Box>
        <Component state={state} dispatch={dispatch} />
      </Box>
    </Drawer>
  );
};

export default InformationSidebar;
