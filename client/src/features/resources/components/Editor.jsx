import { useState, useEffect } from "react";
import {
  Grid,
  Stack,
  Typography,
  Tooltip,
  Button,
  Link,
  Paper,
  TextField,
  MenuItem,
  Chip,
  Divider,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import EditResource from "./EditResource";
import {
  FileUpload as FileUploadIcon,
  Delete as DeleteIcon,
  DataObject as DataObjectIcon,
  AccountTree as AccountTreeIcon,
  Subject as SubjectIcon,
} from "@mui/icons-material";
import FileUploadButton from "./FileUploadButton";
import CsvEditor from "./CsvEditor/CsvEditor";
import JsonEditor from "./JsonEditor/JsonEditor";
import { validateJSONData, prettifyJson } from "./utils";

import { countTreeItemsAndMaxDepth } from "../../../shared/utils/treeView";

const Editor = ({ values, setValues }) => {
  const [metrics, setMetrics] = useState({ count: 0, maxDepth: 0 });

  useEffect(() => {
    try {
      switch (values.classification) {
        case "ontology":
          setMetrics(
            countTreeItemsAndMaxDepth(JSON.parse(values.data || "[]"))
          );

          break;
        case "preannotation":
          setMetrics({ count: JSON.parse(values.data).length });
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Error parsing JSON data", error);
    }
  }, [values.data]);

  const handleReset = () => {
    setValues((prevState) => ({
      ...prevState,
      data: "",
    }));
  };

  const onUpload = ({ fileExtension, fileContents }) => {
    if (fileContents) {
      setValues((prevState) => ({
        ...prevState,
        data: JSON.stringify(fileContents),
      }));
    }
  };

  useEffect(() => {
    // Validate the data whenever its value changes.
    setValues((prevState) => ({
      ...prevState,
      errors: validateJSONData(
        values.classification,
        values.sub_classification,
        values.data,
        values.resources.entityClasses,
        values.resources.relationClasses
      ),
    }));
  }, [values.data]);

  const handleDataChange = (e) => {
    const datasetItems = e.target.value ?? "";
    setValues((prevState) => ({ ...prevState, data: datasetItems }));
  };

  return (
    <>
      <Grid item xs={12}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip
              title="Click to upload a dataset from file"
              arrow
              placement="top"
            >
              <FileUploadButton onUpload={onUpload} />
            </Tooltip>
            <Tooltip title="Click to reset the editor" arrow placement="top">
              <Button startIcon={<DeleteIcon />} onClick={handleReset}>
                Clear
              </Button>
            </Tooltip>
            <Tooltip title="Click to prettify JSON data" arrow placement="top">
              <Button
                startIcon={<DataObjectIcon />}
                disabled={
                  values.dataType !== "json" ||
                  values.data === "" ||
                  values.errors.length !== 0
                }
                onClick={() =>
                  setValues((prevState) => ({
                    ...prevState,
                    data: prettifyJson(prevState.data),
                  }))
                }
              >
                Prettify
              </Button>
            </Tooltip>
            {/* <Tooltip
              title={`Click to toggle ${
                values.visualMode ? "text" : "visual"
              } editor`}
              arrow
              placement="top"
            >
              <Button
                startIcon={
                  values.visualMode ? <SubjectIcon /> : <AccountTreeIcon />
                }
                onClick={() =>
                  setValues((prevState) => ({
                    ...prevState,
                    visualMode: !values.visualMode,
                  }))
                }
                disabled
              >
                {values.visualMode ? "Text" : "Visual"} Mode
              </Button>
            </Tooltip> */}
            <TextField
              title="Click to change the data format"
              variant="standard"
              select
              value={values.dataType}
              size="small"
              InputProps={{ disableUnderline: true }}
              onChange={(e) =>
                setValues((prevState) => ({
                  ...prevState,
                  dataType: e.target.value,
                  data: e.target.value === "text" ? [] : "",
                }))
              }
            >
              <MenuItem
                value={"csv"}
                disabled={values.classification !== "preannotation"}
              >
                CSV
              </MenuItem>
              <MenuItem
                value={"json"}
                disabled={values.classification === "preannotation"}
              >
                JSON
              </MenuItem>
            </TextField>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="left"
            spacing={2}
            pt={1}
          >
            <Chip
              label={`${values.classification} - ${values.sub_classification}`}
              color="primary"
              varaint="contained"
              sx={{ textTransform: "capitalize" }}
            />
            <Divider orientation="vertical" flexItem />
            {Object.keys(metrics).map((key) => (
              <Chip
                variant="outlined"
                label={`${key.split(/(?=[A-Z])/).join(" ")}: ${metrics[key]}`}
                color="primary"
                sx={{ textTransform: "capitalize" }}
              />
            ))}
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        {values.dataType === "csv" ? (
          <CsvEditor data={values.data} />
        ) : values.visualMode ? (
          <JsonEditor />
        ) : (
          <JsonTextEditor values={values} handleDataChange={handleDataChange} />
        )}
      </Grid>
    </>
  );
};

const JsonTextEditor = ({ values, handleDataChange }) => {
  return (
    <>
      <TextField
        sx={{ width: "100%" }}
        required
        id="outlined-multiline-flexible"
        placeholder="Manually enter JSON data"
        multiline
        rows={20}
        onChange={handleDataChange}
        value={values.data}
        fullWidth
        margin="normal"
        autoComplete="false"
        error={values.errors.length > 0}
      />
      <Typography variant="button" color={values.errors.length > 0 && "error"}>
        Problems ({values.errors.length})
      </Typography>
      <TextField
        sx={{ width: "100%" }}
        required
        id="outlined-multiline-flexible"
        placeholder="No problems detected"
        multiline
        rows={2}
        value={values.errors
          .map(
            (e) =>
              e.message +
              (e.hasOwnProperty("instancePath")
                ? ` (loc: ${e.instancePath})`
                : "")
          )
          .join(", ")}
        fullWidth
        margin="normal"
        autoComplete="false"
        InputProps={{ readOnly: true }}
        error={values.errors.length > 0}
      />
    </>
  );
};

export default Editor;
