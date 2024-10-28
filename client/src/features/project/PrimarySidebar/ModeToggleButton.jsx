/**
 * TODO: Put shortcuts modal that includes `ctrl + m` for rotating annotation modes.
 */
import {
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { useTheme } from "@mui/material/styles";

const ModeToggleButton = ({ state, dispatch }) => {
  const theme = useTheme();
  return (
    state.tasks &&
    state.tasks.relation && (
      <Tooltip title="Click to toggle annotation mode" placement="right">
        <ListItem
          key="mode-switch-btn"
          disablePadding
          onClick={() => dispatch({ type: "TOGGLE_ANNOTATION_MODE" })}
        >
          <ListItemButton>
            <ListItemIcon
              sx={{
                color: state.entityAnnotationMode
                  ? theme.palette.neutral.main
                  : theme.palette.primary.light,
              }}
            >
              {state.entityAnnotationMode ? (
                <ToggleOffIcon />
              ) : (
                <ToggleOnIcon />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                state.entityAnnotationMode ? "Entity Mode" : "Relation Mode"
              }
            />
          </ListItemButton>
        </ListItem>
      </Tooltip>
    )
  );
};

export default ModeToggleButton;
