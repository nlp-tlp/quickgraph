import "../Create.css";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveStep,
  selectCorpus,
  selectSteps,
  setStepData,
  setStepValid,
} from "../createStepSlice";
import { setAlertContent, setAlertActive } from "../../alerts/alertSlice";

import { Grid, Input, Button, TextField, Chip, Stack } from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";

export const Upload = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);
  const corpus = useSelector(selectCorpus);
  const [loading, setLoading] = useState(false);

  const readFile = (fileMeta) => {
    let reader = new FileReader();
    reader.readAsText(fileMeta);
    reader.onload = () => {
      const fileExt = fileMeta.name.split(".").slice(-1)[0];

      if (fileExt === "txt") {
        dispatch(
          setStepData({
            corpus: reader.result.split("\n").filter((line) => line !== ""),
            corpusFileName: fileMeta.name,
          })
        );
        setLoading(false);
      } else {
        // console.log("incorrect format");
        setLoading(false);
        dispatch(
          setAlertContent({
            title: "Oops",
            body: "Incorrect file format. Please upload a corpus in .txt. format",
            level: "danger",
          })
        );
        dispatch(setAlertActive(true));
      }
    };
    reader.onloadend = () => {
      reader = new FileReader();
    };
  };

  useEffect(() => {
    if (corpus && corpus === "") {
      // console.log("erased corpus paste bin");

      // Reset corpus and remove file meta data if user erases all contents of corpus paste bin
      dispatch(
        setStepData({
          corpus: [],
          corpusFileName: null,
        })
      );
    }
  }, [corpus]);

  useEffect(() => {
    const valid = steps[activeStep].valid;

    if (!valid && corpus.length !== 0 && corpus[0] !== "") {
      dispatch(setStepValid(true));
    }
    if (valid && (corpus.length < 1 || corpus[0] === "")) {
      dispatch(setStepValid(false));
    }
  }, [steps]);

  return (
    <Grid item xs={12} container spacing={2}>
      <Grid
        item
        xs={12}
        container
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <h5>Project Corpus</h5>
          <Chip
            label={corpus.length}
            icon={<ArticleIcon />}
            title="Number of texts in corpus"
            style={{ cursor: "help" }}
          />
        </Stack>
        <label htmlFor="contained-button-file">
          <Input
            accept="txt"
            id="contained-button-file"
            type="file"
            onChange={(e) => readFile(e.target.files[0])}
          />
          <Button variant="contained" component="span" disableElevation>
            {steps[activeStep].data.corpusFileName === null
              ? "Upload File"
              : steps[activeStep].data.corpusFileName}
          </Button>
        </label>
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          id="outlined-multiline-flexible"
          label={
            corpus.length > 0 && corpus[0] !== ""
              ? "Project Corpus"
              : "Enter or Upload Project Corpus"
          }
          multiline
          maxRows={10}
          onChange={(e) =>
            dispatch(
              setStepData({
                corpus: e.target.value.split("\n"),
                corpusFileName: null,
              })
            )
          }
          value={corpus && corpus.join("\n")}
          fullWidth
        />
      </Grid>
    </Grid>
  );
};
