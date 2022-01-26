import { getFlatDataFromTree } from "@nosferatu500/react-sortable-tree";
import { useState } from "react";
import { Badge, Button, Spinner } from "react-bootstrap";
import { IoArrowBack, IoCheckmark } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import axios from "../utils/api-interceptor";
import history from "../utils/history";
import {
  decrementActiveStep,
  incrementActiveStep,
  saveStep,
  selectActiveStep,
  selectSteps,
  setActiveStep,
} from "./createStepSlice";

export const Stepper = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);

  const handleBadge = (stepName) => {
    //   Allows user to jump between steps on click; if saved or active.
    if (steps[stepName].saved || activeStep === stepName) {
      // console.log(stepName);
      dispatch(setActiveStep(stepName));
    }
  };

  return (
    <div className="multi-stepper">
      {Object.keys(steps).map((stepName, index) => {
        const step = steps[stepName];
        return (
          <>
            <div
              id="step"
              style={{
                display: "block",
                margin: "0.5rem",
                fontWeight: activeStep === stepName && "bold",
                cursor: (step.saved || activeStep === stepName) && "pointer",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center" }}
                onClick={() => handleBadge(stepName)}
              >
                <Badge
                  pill
                  style={{
                    fontSize: "0.85rem",
                    color: step.saved
                      ? "white"
                      : activeStep === stepName
                      ? "black"
                      : "#90a4ae",
                    backgroundColor: step.saved ? "#4caf50" : "#cfd8dc",
                  }}
                >
                  {step.saved ? <IoCheckmark /> : index + 1}
                </Badge>
                <span
                  style={{
                    marginLeft: "0.5rem",
                    color:
                      step.saved || activeStep === stepName
                        ? "black"
                        : "#cfd8dc",
                  }}
                >
                  <span>{stepName}</span>
                </span>
              </span>
            </div>
            {index !== Object.keys(steps).length - 1 && (
              <div>
                <span className="stepper-spacer" />
              </div>
            )}
          </>
        );
      })}
    </div>
  );
};

export const StepperControls = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);

  const handleContinue = () => {
    dispatch(saveStep());
    dispatch(incrementActiveStep());
  };

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    /*
        Note: concept and relation labels have their hierarchical tree structures flattened for storage in DB. 
        The flattening is done using a data structure utility probided by react-sortable-tree
      */
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
      entityOntology: getFlatDataFromTree({
        treeData: steps.schema.data.conceptLabels,
        getNodeKey: ({ treeIndex }) => treeIndex,
        ignoreCollapsed: false,
      }).map((n) => ({ ...n.node, parent: n.parentNode })),
      relationOntology: steps.details.data.performRelationAnnotation
        ? getFlatDataFromTree({
            treeData: steps.schema.data.relationLabels,
            getNodeKey: ({ treeIndex }) => treeIndex,
            ignoreCollapsed: false,
          }).map((n) => ({ ...n.node, parent: n.parentNode }))
        : [],
      lowerCase: steps.preprocessing.data.lowercase,
      removeDuplicates: steps.preprocessing.data.removeDuplicates,
      charsRemove: steps.preprocessing.data.removeChars,
      charsetRemove: steps.preprocessing.data.removeCharSet,
    };

    // console.log(steps.schema.data.conceptLabels);
    // console.log(
    //   "flat entity data",
    //   getFlatDataFromTree({
    //     treeData: steps.schema.data.conceptLabels,
    //     getNodeKey: ({ treeIndex }) => treeIndex,
    //     ignoreCollapsed: false,
    //   })
    // );

    // console.log("Form payload ->", payload);
    if (formSubmitted === false) {
      setIsSubmitting(true);
      await axios
        .post("/api/project/create", payload)
        .then((response) => {
          if (response.status === 200) {
            setFormSubmitted(true);
            history.push("/feed");
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
    <div style={{ display: "flex" }}>
      {activeStep !== Object.keys(steps)[0] && (
        <Button
          style={{ marginRight: "0.5rem" }}
          size="sm"
          variant="secondary"
          onClick={() => dispatch(decrementActiveStep())}
        >
          <IoArrowBack />
        </Button>
      )}

      {activeStep === Object.keys(steps).at(-1) ? (
        <Button
          size="sm"
          variant="success"
          onClick={() => handleCreate()}
          disabled={formSubmitted}
        >
          {isSubmitting ? "Creating" : "Create"}
          {isSubmitting && (
            <Spinner
              animation="border"
              size="sm"
              style={{ marginLeft: "0.5rem" }}
            />
          )}
        </Button>
      ) : (
        <Button
          size="sm"
          variant={steps[activeStep].valid ? "success" : "secondary"}
          onClick={() => handleContinue()}
          disabled={!steps[activeStep].valid}
        >
          Save and Continue
        </Button>
      )}
    </div>
  );
};
