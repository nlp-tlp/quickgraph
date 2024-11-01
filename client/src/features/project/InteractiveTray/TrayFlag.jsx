import { useState } from "react";
import { Tooltip, Menu, MenuItem, Chip, MenuList, Badge } from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import useProject from "../../../shared/hooks/api/project";

const options = ["issue", "quality", "uncertain"];

const TrayFlag = ({ state, dispatch, textId }) => {
  const { applyFlag, deleteFlag } = useProject({ state, dispatch });
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (event) => {
    const flagIndex = event.currentTarget.value;
    const flagState = options[flagIndex];

    if (
      state.texts[textId].flags.filter((f) => f.state === flagState).length ===
      1
    ) {
      deleteFlag({
        datasetItemId: textId,
        flagState: flagState,
      });
    } else {
      applyFlag({
        datasetItemId: textId,
        flagState: flagState,
      });
    }

    handleClose();
  };

  return (
    <>
      <Tooltip title="Click to flag this document" placement="top">
        <Badge
          badgeContent={state.texts[textId].flags.length}
          max={9}
          color="primary"
        >
          <Chip
            label={"Flag"}
            icon={<FlagIcon />}
            size="small"
            clickable
            variant="outlined"
            color="primary"
            onClick={handleOpen}
          />
        </Badge>
      </Tooltip>
      <Menu
        id="flag-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuList dense>
          {options.map((option, index) => (
            <FlagMenuItem
              state={state}
              textId={textId}
              option={option}
              onClick={handleClick}
              index={index}
            />
          ))}
        </MenuList>
      </Menu>
    </>
  );
};

const FlagMenuItem = ({ state, textId, option, onClick, index }) => {
  const hasFlag =
    state.texts[textId].flags.filter((f) => f.state === option).length === 1;

  return (
    <Tooltip
      title={`Click to ${hasFlag ? "remove" : "apply"} ${option} flag`}
      placement="right"
    >
      <MenuItem
        onClick={onClick}
        sx={{ textTransform: "capitalize" }}
        value={index}
        selected={hasFlag}
      >
        {option}
      </MenuItem>
    </Tooltip>
  );
};

export default TrayFlag;
