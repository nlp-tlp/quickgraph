import { Col, Container, Row } from "react-bootstrap";
import { useSelector } from "react-redux";
import { selectActiveStep } from "./createStepSlice";
import { Stepper, StepperControls } from "./stepper";
import { Details } from "./steps/details";
import { Preannotation } from "./steps/preannotation";
import { Preprocessing } from "./steps/preprocessing";
import { Review } from "./steps/review";
import { Schema } from "./steps/schema";
import { Upload } from "./steps/upload";

export const Create = () => {
  const components = {
    details: <Details />,
    upload: <Upload />,
    preprocessing: <Preprocessing />,
    schema: <Schema />,
    preannotation: <Preannotation />,
    review: <Review />,
  };

  const activeStep = useSelector(selectActiveStep);

  return (
    <Container fluid className="create">
      <Col id="container">
        <Row>
          <Col sm={12}>
            <Stepper />
          </Col>
        </Row>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <p
            id="section-title"
            style={{
              backgroundColor: "white",
              fontSize: "1.5rem",
              textAlign: "center",
              padding: "0",
              margin: "0",
              textTransform: 'capitalize'
            }}
          >
            {activeStep}
          </p>
          <span
            style={{
              display: "block",
              borderColor: "#bdbdbd",
              borderTopStyle: "solid",
              borderTopWidth: "2px",
              width: "75px",
              margin: "auto",
              marginTop: "0.5rem",
              marginBottom: "1.5rem",
            }}
          />
        </div>
        {components[activeStep]}

        <Row id="stepper-control-row">
          <Col
            sm={12}
            md={12}
            style={{ display: "flex", justifyContent: "right" }}
          >
            <StepperControls />
          </Col>
        </Row>
      </Col>
    </Container>
  );
};
