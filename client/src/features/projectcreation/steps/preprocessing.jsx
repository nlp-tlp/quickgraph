/* 
  Add option to split plurals; e.g. Tyler's car -> Tyler 's car. This enables open RE to use 's as the relation.
*/

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  IoDocuments,
  IoArrowForward,
  IoArrowDown,
  IoArrowUp,
} from "react-icons/io5";
import {
  selectCorpus,
  selectPreprocessingActions,
  setStepData,
} from "../createStepSlice";
import "../Create.css";

import {
  Grid,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  TextField,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";

export const Preprocessing = () => {
  const dispatch = useDispatch();
  const actions = useSelector(selectPreprocessingActions);
  const corpus = useSelector(selectCorpus);
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

      if (actions.lowercase) {
        preCorpus = preCorpus.map((text) => text.toLowerCase());
      }
      if (actions.removeDuplicates) {
        preCorpus = [...new Set(preCorpus)];
      }
      if (actions.removeChars) {
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

        const regexCharsEscaped = actions.removeCharSet
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
  }, [corpus, actions]);

  useEffect(() => {
    if (corpus && corpus[0] === "") {
      // console.log("erased corpus paste bin");
      // Reset preview content
      setPreviewContent("Upload texts to preview");
    }
  }, [corpus]);

  return (
    <Grid item xs={12}>
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <FormControl sx={{ m: 1 }} component="fieldset">
                <FormLabel component="legend">Preprocessing Actions</FormLabel>
                <FormGroup style={{ display: "flex", flexDirection: "row" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={actions.lowercase}
                        onChange={(e) => {
                          dispatch(
                            setStepData({ lowercase: e.target.checked })
                          );
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
                        checked={actions.removeChars}
                        onChange={(e) => {
                          dispatch(
                            setStepData({ removeChars: e.target.checked })
                          );
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
                        checked={actions.removeDuplicates}
                        onChange={(e) => {
                          dispatch(
                            setStepData({ removeDuplicates: e.target.checked })
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
                    value={actions.removeCharSet}
                    onChange={(e) => {
                      dispatch(setStepData({ removeCharSet: e.target.value }));
                    }}
                    disabled={!actions.removeChars}
                    placeholder={actions.removeCharSet}
                  />
                </FormGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid item container xs={12} spacing={2}>
        <Grid
          item
          container
          xs={12}
          spacing={2}
          justifyContent="space-evenly"
          alignItems="center"
          sx={{ mt: 1 }}
        >
          {Object.keys(corpusDetails).map((key) => {
            return (
              <Grid item xs={2}>
                <Card variant="outlined">
                  <CardContent>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {actions.lowercase ||
                      actions.removeDuplicates ||
                      actions.removeChars ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-evenly",
                          }}
                        >
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <span style={{ color: "#90a4ae" }}>
                              {originalCorpusDetails[key].toLocaleString()}
                            </span>
                            <IoArrowForward
                              style={{ margin: "0rem 0.25rem" }}
                            />
                            <span>{corpusDetails[key].toLocaleString()}</span>
                          </div>
                          {/* This operator doesnt seem to avoid showing up/down when original equals processed... TODO */}
                          {originalCorpusDetails[key] !==
                            corpusDetails[key] && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color:
                                  originalCorpusDetails[key] >
                                  corpusDetails[key]
                                    ? "#2e7d32"
                                    : "#c62828",
                              }}
                            >
                              {originalCorpusDetails[key] >
                              corpusDetails[key] ? (
                                <IoArrowDown />
                              ) : (
                                <IoArrowUp />
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
                            </span>
                          )}
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
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
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
