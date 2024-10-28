import { useContext } from "react";
import {
  Typography,
  AppBar,
  Toolbar,
  Stack,
  IconButton,
  CircularProgress,
  Button,
  Tooltip,
  Chip,
} from "@mui/material";
import { ProjectContext } from "../../shared/context/ProjectContext";
import NotificationBell from "../../shared/components/NotificationBell";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { alpha } from "@mui/material/styles";

const ProjectAppBar = () => {
  const theme = useTheme();
  const { state, dispatch } = useContext(ProjectContext);

  return (
    <AppBar
      position="static"
      color="transparent"
      sx={{ width: "100%" }}
      elevation={0}
    >
      <Toolbar>
        <Stack
          direction="row"
          sx={{ width: "100%" }}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {state.name.length > 35
              ? state.name.slice(0, 35) + "..."
              : state.name}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            {state.submitting && <CircularProgress size={18} />}
            <Tooltip title="Toggle annotation filters">
              <Button
                color="neutral"
                variant="outlined"
                sx={{
                  color: theme.palette.neutral.dark,
                  height: "34px",
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }}
                onClick={() =>
                  dispatch({
                    type: "SET_VALUE",
                    payload: { showFilterModal: true },
                  })
                }
                startIcon={
                  <FilterListIcon sx={{ color: theme.palette.primary.main }} />
                }
                endIcon={
                  <Chip
                    label={
                      <Typography
                        fontSize={12}
                        fontWeight={500}
                        sx={{
                          textTransform: "capitalize",
                          cursor: "pointer",
                        }}
                      >
                        Ctrl + F
                      </Typography>
                    }
                    variant="outlined"
                    sx={{ height: "22px" }}
                    size="small"
                  />
                }
              >
                Filters
              </Button>
            </Tooltip>
            <Tooltip title="Toggle entity label search">
              <Button
                color="neutral"
                sx={{
                  color: theme.palette.neutral.dark,
                  height: "34px",
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }}
                variant="outlined"
                onClick={() =>
                  dispatch({
                    type: "SET_VALUE",
                    payload: { showSearchModal: true },
                  })
                }
                startIcon={
                  <SearchIcon sx={{ color: theme.palette.primary.main }} />
                }
                endIcon={
                  <Chip
                    label={
                      <Typography
                        fontSize={12}
                        fontWeight={500}
                        sx={{
                          textTransform: "capitalize",
                          cursor: "pointer",
                        }}
                      >
                        Ctrl + K
                      </Typography>
                    }
                    variant="outlined"
                    sx={{ height: "22px" }}
                    size="small"
                  />
                }
              >
                Label Search
              </Button>
            </Tooltip>
            <NotificationBell />
            <Tooltip title="Toggle information drawer">
              <IconButton
                sx={{
                  border: "1px solid",
                  width: "34px",
                  height: "34px",
                  borderRadius: "4px",
                  borderColor: "#E0E3E7",
                  color: theme.palette.primary.main,
                }}
              >
                <MenuOpenIcon
                  onClick={() => dispatch({ type: "TOGGLE_MENU" })}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default ProjectAppBar;
