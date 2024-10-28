/**
 * This feature has optional preprocessing options that the user can select for their dataset.
 * The results of each option are rendered on the data as a preview
 *
 * This feature is only available for manually entered datasets.
 */
import { useState, useEffect } from "react";

import {
  Grid,
  TextField,
  Tooltip,
  Typography,
  MenuItem,
  Stack,
  Chip,
  Badge,
} from "@mui/material";
import { parseTextData } from "./Editor";

const Preprocessing = ({ values, setValues }) => {
  const [preview, setPreview] = useState(
    values.dataType === "text"
      ? parseTextData(values.data)
      : "Preprocessing is not available for JSON datasets"
  );
  const [details, setDetails] = useState({ original: {}, preview: {} });
  const disabled = values.dataType !== "text";

  useEffect(() => {
    // Update preview data whenever corpus or preprocessing values are changed.
    if (values.dataType === "text" && values.data.length > 0) {
      const originalData = values.data
        .filter((text) => text !== "")
        .map((text) => text.replace(/\s+/g, " ").trim());
      setDetails((prevState) => ({
        ...prevState,
        original: {
          dataset_items: originalData.length,
          vocabulary: new Set(
            originalData.map((text) => text.split(" ")).flat()
          ).size,
          tokens: originalData.map((text) => text.split(" ")).flat().length,
        },
      }));

      let dataCopy = [...originalData];

      if (values.preprocessing.lowercase) {
        dataCopy = dataCopy.map((text) => text.toLowerCase());
      }
      if (values.preprocessing.removeDuplicates) {
        dataCopy = [...new Set(dataCopy)];
      }
      if (values.preprocessing.removeCharacters !== "") {
        const escapedChars = [
          "[",
          "]",
          "{",
          "}",
          "(",
          ")",
          "*",
          "+",
          "?",
          "|",
          "^",
          "$",
          ".",
          "\\",
        ];

        const regexCharsEscaped = values.preprocessing.removeCharacters
          .split("")
          .map((char) => (escapedChars.includes(char) ? `\\${char}` : char));
        const regex = new RegExp("[" + regexCharsEscaped + "]", "g");
        dataCopy = dataCopy.map((text) => text.replace(regex, " "));
        // Remove multiple white space and trim
        dataCopy = dataCopy.map((text) => text.replace(/\s+/g, " ").trim());
      }

      // Add data uploaded to preview content
      setPreview(dataCopy.slice(0, 250).join("\n"));

      setDetails((prevState) => ({
        ...prevState,
        preview: {
          dataset_items: dataCopy.length,
          vocabulary: new Set(dataCopy.map((text) => text.split(" ")).flat())
            .size,
          tokens: dataCopy.map((text) => text.split(" ")).flat().length,
        },
      }));
    }
  }, [values.preprocessing, values.data]);

  const handleChange = ({ field, value }) => {
    setValues((prevState) => ({
      ...prevState,
      preprocessing: { ...prevState.preprocessing, [field]: value },
    }));
  };

  return (
    <>
      <Grid item xs={12} mt={1}>
        <Grid item container xs={12} alignItems="center" spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6">Preprocessing Options</Typography>
            <Typography variant="caption">
              Preprocessing steps that will be applied to your dataset
            </Typography>
          </Grid>
          <Grid item xs={12} md={8} xl={6}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
            >
              <TextField
                disabled={disabled}
                select
                label="Lowercase"
                fullWidth
                value={values.preprocessing.lowercase}
                onChange={(e) =>
                  handleChange({ field: "lowercase", value: e.target.value })
                }
              >
                <MenuItem value={false}>No</MenuItem>
                <MenuItem value={true}>Yes</MenuItem>
              </TextField>
              <TextField
                disabled={disabled}
                select
                label="Remove Duplicates"
                fullWidth
                value={values.preprocessing.removeDuplicates}
                onChange={(e) =>
                  handleChange({
                    field: "removeDuplicates",
                    value: e.target.value,
                  })
                }
              >
                <MenuItem value={false}>No</MenuItem>
                <MenuItem value={true}>Yes</MenuItem>
              </TextField>
              <TextField
                disabled={disabled}
                label="Remove Characters"
                fullWidth
                placeholder='~",?;!:()[]_{}*.$"'
                value={values.preprocessing.removeCharacters}
                onChange={(e) =>
                  handleChange({
                    field: "removeCharacters",
                    value: e.target.value,
                  })
                }
              />
              <Tooltip title="Punkt tokenizer is currently not available. Default is whitespace.">
                <TextField
                  // disabled={disabled}
                  disabled
                  select
                  label="Tokenizer"
                  fullWidth
                  value={values.preprocessing.tokenizer}
                  onChange={(e) =>
                    handleChange({
                      field: "tokenizer",
                      value: e.target.value,
                    })
                  }
                >
                  <MenuItem value={"whitespace"}>Whitespace</MenuItem>
                  <MenuItem value={"punkt"} disabled>
                    Punkt
                  </MenuItem>
                </TextField>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Tooltip title="This is a preview of your preprocessed dataset">
          <TextField
            disabled={disabled}
            sx={{ width: "100%", cursor: "help" }}
            id="outlined-multiline-flexible"
            placeholder="Preview of preprocessed dataset"
            multiline
            rows={20}
            value={preview}
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: true,
            }}
          />
        </Tooltip>
      </Grid>
      <Grid item xs={12} width="100%">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="left"
          spacing={2}
          pt={1}
        >
          {Object.keys(details.original).map((key) => (
            <div>
              <Badge
                badgeContent={
                  details.original[key] === details.preview[key]
                    ? 0
                    : `${Math.round(
                        Math.abs(
                          ((details.original[key] - details.preview[key]) *
                            100) /
                            details.original[key]
                        )
                      )}%`
                }
                color={
                  details.original[key] > details.preview[key]
                    ? "primary"
                    : "error"
                }
                invisible={details.original[key] === details.preview[key]}
              >
                <Chip
                  variant="outlined"
                  color="primary"
                  sx={{ textTransform: "capitalize" }}
                  label={`${key.replace("_", " ")}: ${
                    details.original[key]
                  } → ${details.preview[key]}`}
                />
              </Badge>
            </div>
          ))}
        </Stack>
      </Grid>
    </>
  );
};

export default Preprocessing;
