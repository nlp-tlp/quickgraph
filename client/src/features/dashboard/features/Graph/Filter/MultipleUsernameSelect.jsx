import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import { Tooltip } from "@mui/material";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const MultipleUsernameSelect = ({
  names,
  selectedUsernames,
  setSelectedUsernames,
}) => {
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedUsernames(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  return (
    <div>
      <FormControl fullWidth size="small">
        <InputLabel id="multiple-username-label">Annotator(s)</InputLabel>
        <Tooltip
          title="Filter graph based on indidual annotators"
          arrow
          placement="left"
        >
          <Select
            labelId="multiple-username-label"
            id="multiple-username-checkbox"
            multiple
            value={selectedUsernames}
            onChange={handleChange}
            input={<OutlinedInput label="Annotators" />}
            renderValue={(selected) => selected.join(", ")}
            MenuProps={MenuProps}
          >
            {names.map((name) => (
              <MenuItem key={name} value={name}>
                <Checkbox checked={selectedUsernames.indexOf(name) > -1} />
                <ListItemText primary={name} />
              </MenuItem>
            ))}
          </Select>
        </Tooltip>
      </FormControl>
    </div>
  );
};

export default MultipleUsernameSelect;
