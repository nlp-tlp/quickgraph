import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  decrementActiveStep,
  incrementActiveStep,
  selectActiveStep,
  saveStep,
} from "./createStepSlice";
import { setIdle } from "../feed/feedSlice";
import { Details } from "./steps/details";
import { Preannotation } from "./steps/preannotation";
import { Preprocessing } from "./steps/preprocessing";
import { Review } from "./steps/review";
import { Schema } from "./steps/schema";
import { Upload } from "./steps/upload";

import axios from "../utils/api-interceptor";
import history from "../utils/history";

// New
import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Stepper,
  Step,
  StepLabel,
  Button,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import { selectSteps } from "./createStepSlice";
import LoadingButton from "@mui/lab/LoadingButton";
import AddCircleIcon from "@mui/icons-material/AddCircle";
export const Create = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);

  const components = {
    details: <Details />,
    upload: <Upload />,
    preprocessing: <Preprocessing />,
    schema: <Schema />,
    preannotation: <Preannotation />,
    review: <Review />,
  };

  const descriptions = {
    details: "Enter project details including task type and clustering",
    upload: "Create or upload a corpus",
    preprocessing: "Apply text preprocessing to your corpus",
    schema: "Build an ontology/schema for entity/relation annotation",
    preannotation: "Upload data for pre-annotation",
    review: "Review project before creation",
  };

  const activeStep = useSelector(selectActiveStep);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = () => {
    dispatch(saveStep());
    dispatch(incrementActiveStep());
  };

  const handleCreate = async () => {
    const payload = {
      name: steps.details.data.name,
      description: steps.details.data.description,
      tasks: {
        entityAnnotation: true,
        relationAnnotation: steps.details.data.performRelationAnnotation,
        relationAnnotationType: steps.details.data.relationAnnotationType,
      },
      performClustering: steps.details.data.performClustering,
      texts: steps.upload.data.corpus,
      entityDictionary: steps.preannotation.data.entityDictionary,
      typedTripleDictionary: steps.preannotation.data.typedTripleDictionary,
      entityOntology: steps.schema.data.entityLabels,
      relationOntology: steps.details.data.performRelationAnnotation
        ? steps.schema.data.relationLabels
        : [],
      lowerCase: steps.preprocessing.data.lowercase,
      removeDuplicates: steps.preprocessing.data.removeDuplicates,
      charsRemove: steps.preprocessing.data.removeChars,
      charsetRemove: steps.preprocessing.data.removeCharSet,
    };

    // console.log("Form payload ->", payload);
    if (formSubmitted === false) {
      setIsSubmitting(true);
      await axios
        .post("/api/project/create", payload)
        .then((response) => {
          if (response.status === 200) {
            setFormSubmitted(true);
            setIdle(true);
            setTimeout(() => {
              history.push("/feed");
            }, 1000);
          }
        })
        .catch((error) => {
          if (error.response.status === 401 || 403) {
            history.push("/unauthorized");
          }
        });
    }
  };

  return (
    <Grid item style={{ width: "75vw", maxWidth: "1600px" }}>
      <Grid item style={{ margin: "1rem 0rem" }}>
        <Card variant="outlined">
          <CardContent>
            <Stepper activeStep={activeStep}>
              {Object.keys(steps).map((label, index) => {
                const stepProps = { completed: steps[label].saved };
                const labelProps = {};
                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel {...labelProps}>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </CardContent>
        </Card>
      </Grid>
      <Grid item style={{ margin: "1rem 0rem" }}>
        <Card variant="outlined">
          <CardHeader
            title={activeStep}
            subheader={descriptions[activeStep]}
            style={{ textTransform: "capitalize" }}
          />
          <CardContent>
            <Grid item xs={12}>
              <Stepper />
            </Grid>
            {components[activeStep]}
          </CardContent>
          <CardActions
            sx={{ m: 2 }}
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIosIcon />}
              disabled={activeStep === "details"}
              onClick={() => dispatch(decrementActiveStep())}
            >
              Back
            </Button>
            {activeStep === Object.keys(steps).at(-1) ? (
              <LoadingButton
                loading={isSubmitting}
                variant="contained"
                endIcon={<AddCircleIcon />}
                loadingPosition="end"
                onClick={handleCreate}
              >
                Create
              </LoadingButton>
            ) : (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIosIcon />}
                onClick={handleContinue}
                disabled={!steps[activeStep].valid}
              >
                Save and Continue
              </Button>
            )}
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );
};
