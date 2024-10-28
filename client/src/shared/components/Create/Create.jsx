import { useState, useEffect } from "react";
import { Grid, Stepper, Step, StepButton, Box, StepLabel } from "@mui/material";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Edit as EditIcon } from "@mui/icons-material";
import MainContainer from "../Layout/MainContainer";
import StepNavigation from "./StepNavigation";

const Create = ({
  defaultValues,
  defaultValidation,
  stepComponents,
  validationFunctions,
  reviewValidationFunction,
  baseURL,
  submitFunction,
  submitting,
  allowedSteps = [],
}) => {
  const navigate = useNavigate();
  const { step } = useParams();
  const [values, setValues] = useState(defaultValues);
  const [stepValidation, setStepValidation] = useState(defaultValidation);

  useEffect(() => {
    setStepValidation((prevState) => ({
      ...prevState,
      ...validationFunctions(values),
      review: reviewValidationFunction(values),
    }));
  }, [values]);

  if (!allowedSteps.includes(step)) {
    navigate("/unauthorized");
    return null;
  }

  const steps = stepComponents({
    values: values,
    setValues: setValues,
    stepValidation: stepValidation,
  });

  const stepInt = Object.assign(
    {},
    ...Object.keys(defaultValidation).map((name, index) => ({
      [name]: index,
    }))
  );

  const intStep = Object.fromEntries(
    Object.entries(stepInt).map(([key, value]) => [value, key])
  );

  const activeStep = stepInt[step];
  const totalSteps = Object.keys(defaultValidation).length;
  const isLastStep = activeStep === totalSteps - 1;

  const EditingIcon = () => {
    return (
      <span>
        <EditIcon color="primary" fontSize="inherit" />
      </span>
    );
  };

  return (
    <>
      <Grid item xs={12} mt={2}>
        <Box mb={4}>
          <Stepper alternativeLabel nonLinear activeStep={activeStep}>
            {Object.keys(steps).map((name, index) => {
              const editingIcon =
                activeStep === index && !stepValidation[name] && EditingIcon;
              return (
                <Step key={index} completed={stepValidation[name]}>
                  <StepButton component={Link} to={`${baseURL}/${name}`}>
                    <StepLabel
                      sx={{
                        textTransform: "capitalize",
                        textDecoration: activeStep === index && "underline",
                        color: activeStep === index ? "primary" : "inherit",
                      }}
                      StepIconComponent={editingIcon}
                    >
                      {name}
                    </StepLabel>
                  </StepButton>
                </Step>
              );
            })}
          </Stepper>
        </Box>
        <Box display="flex" flexDirection="column" justifyContent="flex-start">
          <MainContainer>
            <Grid
              item
              xs={12}
              sx={{ overflowY: "auto", maxHeight: "calc(100vh - 424px)" }}
              mt={2}
            >
              {steps[step]}
            </Grid>
          </MainContainer>
          <StepNavigation
            stepValidation={stepValidation}
            submitFunction={() => submitFunction(values)}
            submitting={submitting}
            baseURL={baseURL}
            intStep={intStep}
            activeStep={activeStep}
            isLastStep={isLastStep}
          />
        </Box>
      </Grid>
    </>
  );
};

export default Create;
