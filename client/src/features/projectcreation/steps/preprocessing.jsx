import { useEffect, useState } from "react";
import {
  Grid,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Paper,
  Stack,
} from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export const Preprocessing = (props) => {
  const { values, updateValue } = props;
  const corpus = values["corpus"];
  const [originalCorpusDetails, setOriginalCorpusDetails] = useState({});
  const [previewContent, setPreviewContent] = useState(
    "Upload texts to preview"
  );
  const [corpusDetails, setCorpusDetails] = useState({});

  useEffect(() => {
    // Update preview data whenever a text file is uploaded and the pre-processing
    // actions are changed
    if (Object.keys(originalCorpusDetails).length === 0) {
      // Add original corpus details for user
      // Remove multiple white space and trim
      const originalCorpus = corpus.map((text) =>
        text.replace(/\s+/g, " ").trim()
      );
      setOriginalCorpusDetails({
        corpusSize: originalCorpus.length,
        vocabSize: new Set(originalCorpus.map((text) => text.split(" ")).flat())
          .size,
        tokenSize: originalCorpus.map((text) => text.split(" ")).flat().length,
      });
    }

    if (corpus) {
      // Remove multiple white space and trim
      let preCorpus = corpus.map((text) => text.replace(/\s+/g, " ").trim());

      if (values["preprocessLowerCase"]) {
        preCorpus = preCorpus.map((text) => text.toLowerCase());
      }
      if (values["preprocessRemoveDuplicates"]) {
        preCorpus = [...new Set(preCorpus)];
      }
      if (values["preprocessRemoveChars"]) {
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

        const regexCharsEscaped = values["preprocessRemoveCharSet"]
          .split("")
          .map((char) => (escapedChars.includes(char) ? `\\${char}` : char));
        const regex = new RegExp("[" + regexCharsEscaped + "]", "g");
        preCorpus = preCorpus.map((text) => text.replace(regex, " "));
        // Remove multiple white space and trim
        preCorpus = preCorpus.map((text) => text.replace(/\s+/g, " ").trim());
      }

      // Add data uploaded to preview content
      setPreviewContent(preCorpus.slice(0, 1000).join("\n"));

      setCorpusDetails({
        corpusSize: preCorpus.length,
        vocabSize: new Set(preCorpus.map((text) => text.split(" ")).flat())
          .size,
        tokenSize: preCorpus.map((text) => text.split(" ")).flat().length,
      });
    }
  }, [corpus, values]);

  useEffect(() => {
    if (corpus && corpus[0] === "") {
      // Reset preview content
      setPreviewContent("Upload texts to preview");
    }
  }, [corpus]);

  const actionAppliedToCorpus =
    values["preprocessLowerCase"] ||
    values["preprocessRemoveDuplicates"] ||
    values["preprocessRemoveChars"];

  return (
    <Grid container item xs={12}>
      <Grid
        item
        container
        xs={12}
        justifyContent="space-evenly"
        alignItems="center"
        component={Paper}
        variant="outlined"
        mb={2}
      >
        {Object.keys(corpusDetails).map((key) => {
          return (
            <Grid item xs={3} p={2} key={`grid-item-${key}`}>
              <Stack direction="column" alignItems="center">
                {actionAppliedToCorpus ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-evenly",
                    }}
                  >
                    <Stack direction="row" alignItems="center">
                      <span style={{ color: "#90a4ae" }}>
                        {originalCorpusDetails[key].toLocaleString()}
                      </span>
                      <ArrowRightAltIcon
                        sx={{
                          margin: "0rem 0.25rem",
                          fontSize: "1rem",
                        }}
                      />
                      <span>{corpusDetails[key].toLocaleString()}</span>
                      {originalCorpusDetails[key] !== corpusDetails[key] && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          sx={{
                            fontSize: "0.75rem",
                            color:
                              originalCorpusDetails[key] > corpusDetails[key]
                                ? "#2e7d32"
                                : "#c62828",
                          }}
                        >
                          {originalCorpusDetails[key] > corpusDetails[key] ? (
                            <ArrowDownwardIcon sx={{ fontSize: "1rem" }} />
                          ) : (
                            <ArrowUpwardIcon sx={{ fontSize: "1rem" }} />
                          )}
                          {Math.round(
                            Math.abs(
                              ((originalCorpusDetails[key] -
                                corpusDetails[key]) *
                                100) /
                                originalCorpusDetails[key]
                            )
                          )}
                          %
                        </Stack>
                      )}
                    </Stack>
                    {/* This operator doesnt seem to avoid showing up/down when original equals processed... TODO */}
                  </div>
                ) : (
                  <span style={{ fontWeight: "bold" }}>
                    {corpusDetails[key].toLocaleString()}
                  </span>
                )}
                <span
                  id="section-subtitle"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textTransform: "capitalize",
                  }}
                >
                  {key.replace("Size", "")} Size
                </span>
              </Stack>
            </Grid>
          );
        })}
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={12} component={Paper} variant="outlined" mb={2}>
          <FormControl sx={{ m: 1 }} component="fieldset">
            <FormLabel component="legend">Preprocessing Actions</FormLabel>
            <FormGroup style={{ display: "flex", flexDirection: "row" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={values["preprocessLowerCase"]}
                    onChange={(e) => {
                      updateValue("preprocessLowerCase", e.target.checked);
                    }}
                    name="remove-casing"
                    title="Removes casing from characters. This can reduce annotation effort."
                  />
                }
                label="Lower Case"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={values["preprocessRemoveChars"]}
                    onChange={(e) => {
                      updateValue("preprocessRemoveChars", e.target.checked);
                    }}
                    title="Removes special characters from corpus. This can reduce annotation effort."
                    name="remove-chars"
                  />
                }
                label="Remove Characters"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={values["preprocessRemoveDuplicates"]}
                    onChange={(e) => {
                      updateValue(
                        "preprocessRemoveDuplicates",
                        e.target.checked
                      );
                    }}
                    title="Removes duplicate documents from your corpus. This can reduce annotation effort."
                    name="remove-duplicates"
                  />
                }
                label="Remove Duplicates"
              />
              <TextField
                id="remove-char-text-field"
                label="Characters To Remove"
                variant="standard"
                size="small"
                autoComplete="off"
                value={values["preprocessRemoveCharSet"]}
                onChange={(e) => {
                  updateValue("preprocessRemoveCharSet", e.target.value);
                }}
                disabled={!values["preprocessRemoveChars"]}
                placeholder={values["preprocessRemoveCharSet"]}
              />
            </FormGroup>
          </FormControl>
        </Grid>
      </Grid>

      <Grid item container xs={12} spacing={2}>
        <Grid item xs={12}>
          <TextField
            id="outlined-multiline-flexible"
            label="Corpus Preview"
            multiline
            maxRows={10}
            value={previewContent}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};
