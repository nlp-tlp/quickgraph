/**
 * TODO: Require information and methodology for handling unique external ids on dataset items; this way documents can be
 * associated with their fortuitous information (if applicable). This will need to be documented (TODO).
 */

import { useState, useEffect } from "react";
import {
  Grid,
  Stack,
  Typography,
  TextField,
  Tooltip,
  Chip,
  Button,
  MenuItem,
} from "@mui/material";
import {
  FileUpload as FileUploadIcon,
  Delete as DeleteIcon,
  DataObject as DataObjectIcon,
} from "@mui/icons-material";
import {
  prettifyJson,
  validateNewlineSeparatedText,
  validateData,
  printErrorLine,
} from "./utils";
import FileUploadButton from "./FileUploadButton";

const Editor = ({ values, setValues }) => {
  const [metrics, setMetrics] = useState({
    items: 0,
    vocabulary: 0,
    tokens: 0,
    characters: 0,
  });

  const handleReset = () => {
    setValues((prevState) => ({
      ...prevState,
      data: prevState.dataType === "text" ? [] : "",
    }));
  };

  useEffect(() => {
    // console.log("Checking error state");
    switch (values.dataType) {
      case "text":
        setValues((prevState) => ({
          ...prevState,
          errors: validateNewlineSeparatedText(values.data),
        }));
        break;
      case "json":
        // console.log("values.resources", values.resources);
        setValues((prevState) => ({
          ...prevState,
          errors: validateData({
            data: values.data,
            datasetType: values.datasetType,
            entityClasses: values.resources.entityClasses,
            relationClasses: values.resources.relationClasses,
          }),
        }));

        break;
      default:
        break;
    }
  }, [values.data]);

  useEffect(() => {
    if (values.errors.length === 0) {
      let items, vocabulary, tokens, characters;
      try {
        if (values.dataType === "text") {
          items = values.data.length;
          tokens = values.data.flatMap((d) => d.split(" "));
          characters = tokens.reduce((acc, curr) => acc + curr.length, 0);
          vocabulary = new Set(tokens).size;
        } else if (values.dataType === "json" && values.data !== "") {
          const data = JSON.parse(values.data);
          items = data.length;
          tokens = data.flatMap((d) => d.tokens);
          characters = tokens.reduce((acc, curr) => acc + curr.length, 0);
          vocabulary = new Set(tokens).size;
        }
        setMetrics({
          items: Number.isInteger(items) ? items : "N/A",
          vocabulary: Number.isInteger(vocabulary) ? vocabulary : "N/A",
          tokens: Array.isArray(tokens) ? tokens.length : "N/A",
          characters: Number.isInteger(characters) ? characters : "N/A",
        });
      } catch (error) {
        // This error will be likely triggered for invalid JSON - passing.
        // console.log("error creating metrics", error);
      }
    }
  }, [values.data, values.errors]);

  return (
    <ManualCorpus
      values={values}
      setValues={setValues}
      handleReset={handleReset}
      metrics={metrics}
    />
  );
};

export const parseTextData = (data) => {
  return data.join("\n");
};

const ManualCorpus = ({ values, setValues, handleReset, metrics }) => {
  const handleDataChange = (e) => {
    let datasetItems;

    switch (values.dataType) {
      case "text":
        datasetItems = e.target.value ? e.target.value.split("\n") : [];
        break;
      case "json":
        datasetItems = e.target.value ?? "";
        break;
      default:
        break;
    }

    setValues((prevState) => ({ ...prevState, data: datasetItems }));
  };

  const onUpload = ({ fileExtension, fileContents }) => {
    if (fileExtension) {
      const dataType = fileExtension === "txt" ? "text" : "json";
      const data =
        fileExtension === "txt"
          ? fileContents.split("\n")
          : JSON.stringify(fileContents);
      setValues((prevState) => ({ ...prevState, dataType, data }));
    }
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
                  validateData({
                    data: values.data,
                    datasetType: values.datasetType,
                    entityClasses: values.resources.entityClasses,
                    relationClasses: values.resources.relationClasses,
                  }).length !== 0
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
              <MenuItem value={"text"} disabled={values.datasetType}>
                Text
              </MenuItem>
              <MenuItem value={"json"}>JSON</MenuItem>
            </TextField>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="left"
            spacing={2}
            pt={1}
          >
            <Tooltip
              title="This is how many items are in your dataset"
              arrow
              placement="top"
            >
              <Chip
                variant="outlined"
                label={`Dataset Items: ${metrics.items}`}
                color="primary"
                sx={{ cursor: "help" }}
              />
            </Tooltip>
            <Tooltip
              title="This is the size of your datasets vocabulary"
              arrow
              placement="top"
            >
              <Chip
                variant="outlined"
                label={`Vocabulary: ${metrics.vocabulary}`}
                color="primary"
                sx={{ cursor: "help" }}
              />
            </Tooltip>
            <Tooltip
              title="This is how many tokens are in your dataset"
              arrow
              placement="top"
            >
              <Chip
                variant="outlined"
                label={`Tokens: ${metrics.tokens}`}
                color="primary"
                sx={{ cursor: "help" }}
              />
            </Tooltip>
            <Tooltip
              title="This is how many characters are in your dataset"
              arrow
              placement="top"
            >
              <Chip
                variant="outlined"
                label={`Characters: ${metrics.characters}`}
                color="primary"
                sx={{ cursor: "help" }}
              />
            </Tooltip>
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        {values.dataType === "text" ? (
          <TextEntryField values={values} handleDataChange={handleDataChange} />
        ) : (
          <JsonEntryField values={values} handleDataChange={handleDataChange} />
        )}
      </Grid>
      <Grid item xs={12}>
        <Typography
          variant="button"
          color={values.errors.length > 0 && "error"}
        >
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
                  : "") +
                printErrorLine(values.dataType, e, values.data)
            )
            .join(", ")}
          fullWidth
          margin="normal"
          autoComplete="false"
          InputProps={{ readOnly: true }}
          error={values.errors.length > 0}
        />
      </Grid>
    </>
  );
};

const TextEntryField = ({ values, handleDataChange }) => {
  return (
    <TextField
      sx={{ width: "100%" }}
      required
      id="outlined-multiline-flexible"
      placeholder="Manually enter text data as newline separated items"
      multiline
      rows={20}
      onChange={handleDataChange}
      value={parseTextData(values.data)}
      fullWidth
      margin="normal"
      autoComplete="false"
      error={
        values.data && validateNewlineSeparatedText(values.data).length > 0
      }
    />
  );
};

const JsonEntryField = ({ values, errors, handleDataChange }) => {
  return (
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
  );
};

export default Editor;
