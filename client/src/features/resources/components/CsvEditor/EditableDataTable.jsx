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

const columns = [
  {
    field: "id",
    headerName: "#",
    align: "center",
    headerAlign: "center",
    maxWidth: 60,
  },
  {
    field: "surface_form",
    headerName: "Surface Form",
    width: 200,
    flex: 1,
    editable: true,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "classification",
    headerName: "Classification",
    width: 200,
    align: "center",
    editable: true,
    headerAlign: "center",
  },
];

const rows = [
  {
    id: 1,
    surface_form: "hello",
    classification: "PhysicalObject",
  },
];

export default function EditableDataTable(props) {
  return <DataGrid rows={rows} columns={columns} />;
}
