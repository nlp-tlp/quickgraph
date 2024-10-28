import { useState, useContext } from "react";
import {
  Button,
  Typography,
  Box,
  Stack,
  Modal,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Chip,
  Divider,
  Paper,
} from "@mui/material";
import { DashboardContext } from "../../../../shared/context/dashboard-context";
import { style as modalStyle } from "../../../../shared/styles/modal";

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

const DeleteModal = ({ open, handleClose, username }) => {
  const { state, handleRemoveAnnotator } = useContext(DashboardContext);
  const [enteredUsername, setEnteredUsername] = useState("");
  const [removeAnnotations, setRemoveAnnotations] = useState(true);

  const handleRemove = () => {
    handleRemoveAnnotator({
      username: username,
      projectId: state.projectId,
      removeAnnotations: removeAnnotations,
    });
    setEnteredUsername("");
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box as={Paper} variant="outlined" sx={{ ...style, borderColor: "red" }}>
        <>
          <Box p="1rem 2rem">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="column">
                <Typography id="modal-modal-title" variant="h6" component="h2">
                  Remove annotator
                </Typography>
                <Typography
                  id="modal-modal-description"
                  sx={{ mt: 2 }}
                  gutterBottom
                >
                  Enter <strong>{username}</strong> to permanently remove them
                  from this project
                </Typography>
              </Stack>
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
          <Stack p="1rem 2rem" direction="column" alignItems="left" spacing={2}>
            <TextField
              label={username}
              fullWidth
              size="small"
              value={enteredUsername}
              onChange={(e) => setEnteredUsername(e.target.value)}
              color="error"
            />
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={removeAnnotations}
                    onChange={() => setRemoveAnnotations(!removeAnnotations)}
                    color="error"
                  />
                }
                label="Remove annotations made by this annotator from this project"
              />
            </FormGroup>
          </Stack>
          <Box>
            <Divider flexItem />
          </Box>
          <Box p="1rem 2rem" display="flex" justifyContent="right">
            <Button
              color="error"
              variant="contained"
              disabled={username !== enteredUsername}
              onClick={handleRemove}
            >
              Remove
            </Button>
          </Box>
        </>
      </Box>
    </Modal>
  );
};

export default DeleteModal;
