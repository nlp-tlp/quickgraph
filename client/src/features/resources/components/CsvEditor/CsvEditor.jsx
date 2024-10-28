/**
 * TODO:
 * - Validate each row and indicate to the user whether the row is valid; An aggregation of the 'errors' should be displayed.
 * - Validate that hierarchical elements are using forward slashes (put this in the "info")
 * - "Classifications" should be editable with a dropdown box allowing the user to select any of those that have been entered, but also permitting the text entry of any arbitrary string. The new string should update the select items.
 * - if user select exisitng ontology then clear the name of the new one and vice versa.
 */

import { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Box,
  MenuItem,
  Stack,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import EditableDataTable from "./EditableDataTable";

export default function CsvEditor(props) {
  const [data, setData] = useState(props.data || []);

  const handleCellValueChange = (event, rowIndex, colIndex) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = event.target.value;
    setData(newData);
  };

  const handleSave = () => {
    // Here, you could send the updated CSV data to your server for processing
    console.log("Updated CSV data:", data);
  };

  if (!data || !data.length) {
    return (
      <Box>
        <Typography>No data to display</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box p={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography>
            Select an existing ontology or create a new one...
          </Typography>
          <TextField select label="Existing Ontologies" fullWidth>
            <MenuItem>Hello world</MenuItem>
          </TextField>
          <Typography>or</Typography>
          <Stack>
            <TextField label="New ontology name" />
          </Stack>
        </Stack>
      </Box>
      <Box sx={{ height: 300, width: "100%" }} mt={2}>
        <EditableDataTable />
      </Box>
    </>
  );
}
