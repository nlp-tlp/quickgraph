import { useContext } from "react";
import {
  Modal,
  Paper,
  Typography,
  Box,
  Divider,
  Stack,
  IconButton,
  Chip,
} from "@mui/material";
import { ProjectContext } from "../../../shared/context/ProjectContext";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
};

const shortcuts = [
  {
    name: "Filters",
    shortcut: "ctrl + f",
    description: "Apply filters to the dataset.",
  },
  {
    name: "Label Search",
    shortcut: "ctrl + k",
    description: "Search for labels and get suggestions.",
  },
  // {
  //   name: "Toggle Annotation Mode",
  //   shortcut: "ctrl + m",
  //   description:
  //     "Toggle between entity and relation annotation modes - unaccepted entities will be hidden in relation mode.",
  // },
  //   {
  //     name: '',
  //     shortcut: '1-10',
  //     description: 'Apply '
  //   }
];

const ShortcutModal = () => {
  const { state, dispatch } = useContext(ProjectContext);
  const theme = useTheme();

  const handleClose = () => {
    dispatch({ type: "SET_VALUE", payload: { showShortcutModal: false } });
  };

  return (
    <Modal open={state.showShortcutModal} onClose={handleClose}>
      <Box sx={style} as={Paper} variant="outlined">
        <Box p="1rem 2rem">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="column">
              <Typography variant="h6">Keyboard Shortcuts</Typography>
              <Typography variant="caption">
                These are QuickGraph annotation keyboard shortcuts
              </Typography>
            </Stack>
            {/* <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton> */}
            <Chip
              label="esc"
              sx={{ fontWeight: 700, fontSize: 12 }}
              onClick={handleClose}
              variant="outlined"
              clickable
              color="primary"
            />
          </Stack>
        </Box>
        <Box>
          <Divider flexItem />
        </Box>
        <Box p="1rem 2rem">
          <Stack direction="column" spacing={2}>
            {shortcuts.map((sc) => (
              <Stack direction="row" spacing={4} alignItems="center">
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'Consolas, "Courier New", monospace',
                    fontSize: 14,
                    backgroundColor: "#f5f5f5",
                    padding: "0.5rem",
                    borderRadius: 4,
                    boxShadow: "0 0 0 1px #ddd",
                    overflowX: "auto",
                    textTransform: "capitalize",
                  }}
                >
                  {sc.shortcut}
                </Typography>
                <Stack direction="column" alignItems="left">
                  <Typography fontSize={16} fontWeight={500}>
                    {sc.name}
                  </Typography>
                  <Typography variant="caption">{sc.description}</Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
        <Box sx={{ height: 40 }}>
          <Divider flexItem />
        </Box>
      </Box>
    </Modal>
  );
};

export default ShortcutModal;
