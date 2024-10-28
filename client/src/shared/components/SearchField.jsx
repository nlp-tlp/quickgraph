import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";
import {
  IconButton,
  FormControl,
  InputLabel,
  InputAdornment,
  Stack,
} from "@mui/material";

import OutlinedInput from "@mui/material/OutlinedInput";
import ClearIcon from "@mui/icons-material/Clear";

function SearchField({ value, onSearch, onReset }) {
  const [searchValue, setSearchValue] = useState(value);

  const handleSearch = () => {
    onSearch(searchValue);
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <FormControl variant="outlined" size="small">
      <InputLabel htmlFor="outlined-adornment-search">Search</InputLabel>
      <OutlinedInput
        id="outlined-adornment-search"
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle search"
              onClick={handleSearch}
              edge="end"
            >
              <SearchIcon />
            </IconButton>
          </InputAdornment>
        }
        label="Search"
      />
    </FormControl>
  );
}

export default SearchField;
