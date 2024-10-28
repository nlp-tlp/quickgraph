import { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Box,
  Stack,
  Modal,
  Paper,
  Divider,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material";
import { getFlatOntology } from "../../shared/utils/tools";
import Editor from "./components/Editor";
import Preprocessing from "./components/Preprocessing";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
};

const DATA_TYPE_MAPPING = {
  0: "text",
  1: "json",
  2: "json",
};

const getEntityClasses = (dataset) => {
  if ([1, 2].includes(dataset.dataset_type)) {
    return getFlatOntology(dataset.project.ontology.entity).map(
      (i) => i.fullname
    );
  }
  return [];
};

const getRelationClasses = (dataset) => {
  if (dataset.dataset_type === 2) {
    return getFlatOntology(dataset.project.ontology.relation).map(
      (i) => i.fullname
    );
  }
  return [];
};

const mergePreprocessing = (prevState, dataset) => {
  const { preprocessing } = dataset;
  return {
    lowercase: preprocessing?.lowercase ?? prevState.preprocessing.lowercase,
    removeDuplicates:
      preprocessing?.remove_duplicates ??
      prevState.preprocessing.removeDuplicates,
    removeCharacters:
      preprocessing?.remove_charset ?? prevState.preprocessing.removeCharacters,
    tokenizer: preprocessing?.tokenizer ?? prevState.preprocessing.tokenizer,
  };
};

const UploadModal = ({
  open,
  handleClose,
  dataset,
  uploadDatasetItems,
  submitting,
}) => {
  const [values, setValues] = useState({
    data: [],
    errors: [],
    dataType: "json",
    preprocessing: {
      lowercase: false,
      removeDuplicates: false,
      removeCharacters: "",
      tokenizer: "whitespace", //"punkt",
    },
    resources: {
      entityClasses: [],
      relationClasses: [],
    },
  });

  useEffect(() => {
    if (dataset && open) {
      setValues((prevState) => ({
        ...prevState,
        dataType: DATA_TYPE_MAPPING[dataset.dataset_type],
        datasetType: dataset.dataset_type,
        resources: {
          entityClasses: getEntityClasses(dataset),
          relationClasses: getRelationClasses(dataset),
        },
        preprocessing: mergePreprocessing(prevState, dataset),
      }));
    }
  }, [dataset, open]);

  const handleSubmit = () => {
    uploadDatasetItems({
      dataset_id: dataset._id,
      data_type: values.dataType,
      items: values.dataType === "text" ? values.data : JSON.parse(values.data),
      is_annotated: dataset.is_annotated,
      preprocessing: {
        lowercase: values.preprocessing.lowercase,
        remove_duplicates: values.preprocessing.removeDuplicates,
        remove_chars: values.preprocessing.removeCharacters !== "",
        remove_charset: values.preprocessing.removeCharacters,
        tokenizer: "whitespace", //values.preprocessing.tokenizer,  // TODO: reimplement in the future.
      },
    });
    handleClose();
  };

  const handleReset = () => {
    setValues((prevState) => ({ ...prevState, data: [] }));
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ ...style }} as={Paper} variant="outlined" minWidth={1000}>
        <Box
          p={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="column">
            <Typography variant="h6" component="h2">
              Upload Dataset Items
            </Typography>
            <Typography variant="caption">
              Select a file to upload additional items to this dataset
            </Typography>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="left"
            spacing={2}
          >
            <Chip
              label={`${
                dataset.dataset_type === 0
                  ? "Standard"
                  : dataset.dataset_type === 1
                  ? "Entity Annotated"
                  : "Entity and Relation Annotated"
              }`}
              color="primary"
            />
            <Chip
              label={
                dataset.is_blueprint ? "Blueprint Dataset" : "Project Dataset"
              }
              color="primary"
            />
          </Stack>
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            overflowY: "auto",
            maxHeight: "calc(80vh - 120px)",
          }}
        >
          <Box p={2}>
            {values && <Editor values={values} setValues={setValues} />}
          </Box>
          {values.dataType === "text" && (
            <>
              <Divider />
              <Box p={2}>
                <Preprocessing values={values} setValues={setValues} />
              </Box>
            </>
          )}
        </Box>
        <Box
          sx={{
            height: 60,
            bgcolor: alpha("#f3e5f5", 0.25),
            borderRadius: "0px 0px 16px 16px",
          }}
        >
          <Stack
            direction="row"
            justifyContent="right"
            spacing={2}
            p="0.5rem 2rem"
          >
            <Button onClick={handleReset} disabled={values.data.length === 0}>
              Reset
            </Button>
            <Divider flexItem orientation="vertical" />
            <Button
              variant="outlined"
              title="Click to close"
              onClick={handleClose}
              sx={{
                textDecoration: "none",
                bgcolor: "white",
              }}
              disableElevation
            >
              Close
            </Button>
            <Button
              variant="contained"
              disableElevation
              disabled={values.data.length === 0}
              onClick={handleSubmit}
            >
              Add {values.data.length === 0 ? "" : values.data.length} Item
              {values.data.length > 1 ? "s" : ""}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default UploadModal;
