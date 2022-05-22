import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../Create.css";
import {
  selectActiveStep,
  selectSteps,
  setStepData,
  setStepValid,
} from "../createStepSlice";

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  TextField,
} from "@mui/material";

export const Details = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);

  useEffect(() => {
    const valid = steps[activeStep].valid;
    const data = steps[activeStep].data;

    if (!valid && data.name !== "" && data.description !== "") {
      dispatch(setStepValid(true));
    }
    if (valid && (data.name === "" || data.description === "")) {
      dispatch(setStepValid(false));
    }
  }, [steps]);

  return (
    <Grid item xs={12}>
      <Grid item container xs={12} spacing={4}>
        <Grid item xs={6}>
          <TextField
            required
            id="project-name-text-field"
            label="Project Name"
            helperText="This can be modified at any time"
            placeholder="Enter project name"
            variant="standard"
            fullWidth
            value={steps[activeStep].data.name}
            onChange={(e) => dispatch(setStepData({ name: e.target.value }))}
            autoComplete="off"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            required
            id="project-description-text-field"
            label="Project Description"
            helperText="This can be modified at any time"
            placeholder="Enter project description"
            variant="standard"
            fullWidth
            value={steps[activeStep].data.description}
            onChange={(e) =>
              dispatch(setStepData({ description: e.target.value }))
            }
            autoComplete="off"
          />
        </Grid>
      </Grid>
      <Grid item container xs={12} spacing={4}>
        <Grid item xs={6}>
          <FormControl sx={{ mt: 4 }} component="fieldset" variant="standard">
            <FormLabel component="legend">Multi-task Configuration</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      steps[activeStep].data.performRelationAnnotation &&
                      steps[activeStep].data.relationAnnotationType === "closed"
                    }
                    onChange={(e) => {
                      dispatch(
                        setStepData({
                          performRelationAnnotation: true,
                          relationAnnotationType: "closed",
                        })
                      );
                    }}
                    name="ea-ra-closed"
                  />
                }
                label="Entity and Closed Relation Annotation"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    disabled
                    checked={
                      steps[activeStep].data.performRelationAnnotation &&
                      steps[activeStep].data.relationAnnotationType === "open"
                    }
                    onChange={(e) => {
                      dispatch(
                        setStepData({
                          performRelationAnnotation: true,
                          relationAnnotationType: "open",
                        })
                      );
                    }}
                    name="ea-ra-open"
                  />
                }
                label="Entity and Open Relation Annotation"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!steps[activeStep].data.performRelationAnnotation}
                    onChange={(e) => {
                      dispatch(
                        setStepData({
                          performRelationAnnotation: false,
                        })
                      );
                    }}
                    name="ea-only"
                  />
                }
                label="Entity Annotation Only"
              />
            </FormGroup>
            <FormHelperText>
              Be careful as this choice is irreversible. Open relation
              annotation is currently single-user only.
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl sx={{ mt: 4 }} component="fieldset" variant="standard">
            <FormLabel component="legend">Document Clustering</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={steps[activeStep].data.performClustering}
                    onChange={(e) => {
                      dispatch(
                        setStepData({
                          performClustering:
                            !steps[activeStep].data.performClustering,
                        })
                      );
                    }}
                    name="gilad"
                  />
                }
                label="Perform document clustering"
              />
            </FormGroup>
            <FormHelperText>
              Be careful as this choice is irreversible.
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </Grid>
  );
};