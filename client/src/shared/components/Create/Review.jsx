import { Link } from "react-router-dom";
import {
  Grid,
  Button,
  Box,
  Alert,
  AlertTitle,
  Chip,
  Stack,
} from "@mui/material";

const Review = ({ reviewData, stepValidation, baseURL }) => {
  return (
    <>
      <Grid item xs={12}>
        {Object.keys(reviewData).map((step, index) => (
          <Box mt={2} key={`step-${index}`}>
            <Alert
              severity={stepValidation[step] ? "success" : "error"}
              action={
                <Button
                  color="inherit"
                  size="small"
                  component={Link}
                  to={`${baseURL}/${step}`}
                  variant="outlined"
                >
                  {stepValidation[step] ? "REVIEW" : "FIX"}
                </Button>
              }
            >
              <AlertTitle sx={{ textTransform: "capitalize" }}>
                {step}
              </AlertTitle>
              <Stack
                direction="row"
                spacing={2}
                width="100%"
                display="flex"
                flexWrap="wrap"
              >
                {reviewData[step].summary
                  .filter((i) => i) // Remove nulls
                  .map((item, index) => (
                    <Chip
                      key={`review-${step}-chip-${index}`}
                      label={item}
                      size="small"
                    />
                  ))}
              </Stack>
            </Alert>
          </Box>
        ))}
      </Grid>
    </>
  );
};

export default Review;
