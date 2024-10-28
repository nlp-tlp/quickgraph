import { useState, useContext } from "react";
import {
  Divider,
  IconButton,
  Box,
  Menu,
  MenuItem,
  MenuList,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import { ProjectContext } from "../../../shared/context/ProjectContext";
import { getFlatOntology } from "../../../shared/utils/tools";

const MiscContextMenuItems = ({ span, textId, handlePopoverClose }) => {
  const { state, handleEdit } = useContext(ProjectContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (ontologyItemId) => {
    handleEdit({
      markupId: span.id,
      ontologyItemId: ontologyItemId,
      datasetItemId: textId,
      finallyFunction: handleClose,
    });
    handleClose();
    handlePopoverClose();
  };

  return (
    <>
      <Divider orientation="vertical" variant="middle" flexItem />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "fit-content",
          padding: "0.25rem",
        }}
      >
        <IconButton
          title="Click to change entity type"
          id="edit-button"
          aria-controls={open ? "edit-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          onTouchStart={handleClick}
          size="small"
        >
          <EditIcon fontSize="inherit" />
        </IconButton>
        <Menu
          id="edit-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{ "aria-labelledby": "edit-button" }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          PaperProps={{
            style: {
              maxHeight: 200,
              width: "auto",
            },
          }}
        >
          {/* <Box>
            <Box p={1}>
              <Typography varaint="caption" gutterBottom>
                Recent Edits
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip label="hello world" size="small" />
                <Chip label="hello world" size="small" />
                <Chip label="hello world" size="small" />
              </Stack>
            </Box>
            <Box> */}
          <MenuList dense>
            {getFlatOntology(state.ontology.entity)
              .sort((a, b) => a.fullname.localeCompare(b.fullname))
              .map((item) => (
                <MenuItem
                  onClick={() => handleSelect(item.id)}
                  onTouchStart={() => handleSelect(item.id)}
                  selected={item.id === span.ontology_item_id}
                >
                  {item.fullname}
                </MenuItem>
              ))}
          </MenuList>
          {/* </Box>
          </Box> */}
        </Menu>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "fit-content",
          padding: "0.25rem",
        }}
      >
        <IconButton
          size="small"
          onClick={handlePopoverClose}
          onTouchStart={handlePopoverClose}
          title="Click to close"
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </Box>
    </>
  );
};

export default MiscContextMenuItems;
