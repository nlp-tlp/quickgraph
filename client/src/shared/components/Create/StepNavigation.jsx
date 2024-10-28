import { Box, Stack, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { LoadingButton } from "@mui/lab";
import AddBoxIcon from "@mui/icons-material/AddBox";

const SubmitButton = ({ stepValidation, submitFunction, submitting }) => {
  return (
    <LoadingButton
      variant="contained"
      loadingPosition="start"
      startIcon={<AddBoxIcon />}
      disabled={!stepValidation["review"]}
      onClick={submitFunction}
      loading={submitting}
    >
      Create
    </LoadingButton>
  );
};

const StepNavigation = (props) => {
  const {
    stepValidation,
    submitFunction,
    submitting,
    baseURL,
    intStep,
    activeStep,
    isLastStep,
  } = props;
  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="right"
    >
      <Stack direction="row" spacing={2} p="1rem 0rem">
        <Button
          component={Link}
          variant="outlined"
          color="primary"
          disabled={activeStep === 0}
          to={`${baseURL}/${intStep[activeStep - 1]}`}
        >
          Back
        </Button>
        {isLastStep ? (
          <SubmitButton
            stepValidation={stepValidation}
            submitFunction={submitFunction}
            submitting={submitting}
          />
        ) : (
          <Button
            component={Link}
            variant="contained"
            color="primary"
            to={`${baseURL}/${intStep[activeStep + 1]}`}
          >
            Next
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default StepNavigation;
