import { useState } from "react";
import {
  Card,
  Col,
  Form,
  Row,
  OverlayTrigger,
  Tooltip,
  Popover,
  Spinner,
} from "react-bootstrap";
import { IoInformationCircle } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  selectPreannotationActions,
  selectActiveStep,
  selectSteps,
  setStepData,
  selectPerformRelationAnnotation,
} from "../createStepSlice";
import { setAlertContent, setAlertActive } from "../../alerts/alertSlice";
import { BiGitCommit } from "react-icons/bi";
import { IoWarning } from "react-icons/io5";
import { flattenOntology } from "../../utils/tools";

import { Grid, Button, Input } from "@mui/material";
import { grey } from "@mui/material/colors";

export const Preannotation = () => {
  const dispatch = useDispatch();
  const actions = useSelector(selectPreannotationActions);
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);
  const performRelationAnnotation = useSelector(
    selectPerformRelationAnnotation
  );
  const [oEntityDictSize, setOEntityDictSize] = useState(); // original size of uploaded entity entityDictionary
  const [oTripleDictSize, setOTripleDictSize] = useState();
  const [eLoading, setELoading] = useState(false);
  const [tLoading, setTLoading] = useState(false);

  // Flatten ontologies
  const flatEntityOntology = flattenOntology(steps.schema.data.entityLabels);
  const flatRelationOntology = flattenOntology(
    steps.schema.data.relationLabels
  );
  const entityOntologyLabels = flatEntityOntology.map((l) =>
    l.fullName.toLowerCase()
  );
  const relationOntologyLabels = flatRelationOntology.map((label) =>
    label.fullName.toLowerCase()
  );
  const txtEntityExample =
    "Jim, Person\ndog, Animal/Mammal\nwhale, Animal/Mammal";
  const txtTypedTripleExample =
    "repair,Activity,hasParticipant,line,Physicalobject,1\nrepair,MaintenanceActivity,hasParticipant,pipe,PhysicalObject,1";

  // console.log("entityOntologyLabels", entityOntologyLabels);
  // console.log("relationOntologyLabels", relationOntologyLabels);

  const readFile = (fileMeta, type) => {
    let reader = new FileReader();
    reader.readAsText(fileMeta);
    reader.onload = () => {
      const fileExt = fileMeta.name.split(".").slice(-1)[0];

      if (fileExt === "txt") {
        // TODO: Handle errors; if user uploads triple dict to entities it will still load...
        let dict = reader.result.split("\n").filter((line) => line !== "");
        // console.log(dict);

        let successMsg;
        switch (type) {
          case "entity":
            setELoading(true);
            setOEntityDictSize(dict.length);
            // Filter based on entity ontology
            // TODO: FIX ISSUE
            dict = Object.fromEntries(
              dict
                .filter((line) =>
                  entityOntologyLabels.includes(
                    line.split(",")[1].toLowerCase().trim()
                  )
                )
                .map((line) => [
                  line.split(",")[0],
                  line.split(",")[1].toLowerCase().trim(),
                ])
            );
            // console.log("entityDictionary", dict);

            dispatch(
              setStepData({
                entityDictionary: dict,
                entityDictionaryFileName: fileMeta.name,
              })
            );
            setELoading(false);

            successMsg =
              Object.keys(dict).length > 0
                ? `Uploaded ${
                    Object.entries(dict).filter((item) =>
                      entityOntologyLabels.includes(item[1])
                    ).length
                  } pairs from a set of ${
                    new Set(Object.values(dict)).size
                  } entity classes`
                : // - ${
                  //   Object.keys(steps[activeStep].data.entityDictionary).length -
                  //   Object.entries(steps[activeStep].data.entityDictionary).filter(
                  //     (item) => entityOntologyLabels.includes(item[1])
                  //   ).length
                  // } invalid entries detected
                  "No entity pre-annotation resource uploaded";

            if (Object.keys(dict).length === 0) {
              dispatch(
                setAlertContent({
                  title: "No Pre-annotations made 😞",
                  body: "Please check your files are in .txt format and its entities are consistent with your ontology.",
                  level: "warning",
                })
              );
            } else {
              dispatch(
                setAlertContent({
                  title: "Succesfully Pre-annotated Entities!",
                  body: successMsg,
                  level: "success",
                })
              );
            }
            dispatch(setAlertActive(true));

            break;
          case "triple":
            setTLoading(true);
            setOTripleDictSize(dict.length);

            // Filter based on relation ontology
            dict = dict
              .filter(
                (line) =>
                  entityOntologyLabels.includes(
                    line.split(",")[1].toLowerCase().trim() &&
                      line.split(",")[4].toLowerCase().trim()
                  ) &&
                  relationOntologyLabels.includes(
                    line.split(",")[2].toLowerCase().trim()
                  )
              )
              .map((line) => ({
                sourceSpan: line.split(",")[0].toLowerCase().trim(),
                sourceLabel: line.split(",")[1].toLowerCase().trim(),
                relationLabel: line.split(",")[2].toLowerCase().trim(),
                targetSpan: line.split(",")[3].toLowerCase().trim(),
                targetLabel: line.split(",")[4].toLowerCase().trim(),
                offset: parseInt(line.split(",")[5].toLowerCase().trim()),
              }));
            // console.log("typedTripleDictionary", dict);

            dispatch(
              setStepData({
                typedTripleDictionary: dict,
                typedTripleDictionaryFileName: fileMeta.name,
              })
            );
            setTLoading(false);

            successMsg =
              dict.length > 0
                ? `Uploaded ${dict.length} sets of typed triples`
                : // - ${
                  //   Object.keys(steps[activeStep].data.entityDictionary).length -
                  //   Object.entries(steps[activeStep].data.entityDictionary).filter(
                  //     (item) => entityOntologyLabels.includes(item[1])
                  //   ).length
                  // } invalid entries detected
                  "No typed triple pre-annotation resource uploaded";

            if (dict.length === 0) {
              dispatch(
                setAlertContent({
                  title: "No Pre-annotations made 😞",
                  body: "Please check your files are in .txt format and its typed triples are consistent with your ontology and the expected format.",
                  level: "warning",
                })
              );
            } else {
              dispatch(
                setAlertContent({
                  title: "Succesfully Pre-annotated Typed Triples!",
                  body: successMsg,
                  level: "success",
                })
              );
            }
            dispatch(setAlertActive(true));

            break;
          default:
            break;
        }
      } else {
        switch (type) {
          case "entity":
            setELoading(false);
            setOEntityDictSize(0);
            dispatch(
              setStepData({
                entityDictionary: [],
                entityDictionaryFileName: null,
              })
            );
            break;
          case "triple":
            setTLoading(false);
            setOTripleDictSize(0);
            dispatch(
              setStepData({
                typedTripleDictionary: [],
                typedTripleDictionaryFileName: null,
              })
            );
            break;
          default:
            break;
        }
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

  return (
    <Grid item xs={12}>
      <Grid item xs={12} style={{ fontSize: "0.8125rem" }} sx={{mb: 2}}>
        Before commencing annotation with QuickGraph, you can upload a
        dictionary for pre-annotation of entities and triples. The types
        specified in each dictionary must be consistent with the ontologies
        specified in this project. The dictionary items must be consistent with
        relation constraints (if applicable).
      </Grid>
      <Grid
        item
        container
        xs={12}
        justifyContent="center"
        alignItems="center"
        sx={{mt: 4, p: 2}}
      >
        <Grid item xs={12} style={{ borderBottom: `1px solid ${grey[300]}` }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h5 id="section-subtitle">Entity Preannotation</h5>
              <span style={{ fontSize: "0.75rem" }}>
                Upload a set of known entity annotations to pre-annotate your
                uploaded corpus.
              </span>
            </div>
            <label htmlFor="contained-button-file">
              <Input
                accept="txt"
                id="contained-button-file"
                type="file"
                onChange={(e) => {
                  readFile(e.target.files[0], "entity");
                }}
              />
              <Button variant="contained" component="span">
                {steps[activeStep].data.entityDictionaryFileName === null
                  ? "Upload Entites"
                  : steps[activeStep].data.entityDictionaryFileName}
              </Button>
            </label>
          </div>
        </Grid>
        <Grid item xs={12}>
          <span
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "1rem",
              padding: "1rem",
            }}
          >
            {steps[activeStep].data.entityDictionaryFileName === null ? (
              "Upload dictionary to pre-annotate entities"
            ) : (
              <>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "#607d8b",
                  }}
                >
                  <BiGitCommit style={{ marginRight: "0.25rem" }} />{" "}
                  <span style={{ fontWeight: "bold" }}>Pairs Uploaded</span>
                  <span style={{ margin: "0rem 0.5rem", fontWeight: "bold" }}>
                    {
                      Object.keys(steps[activeStep].data.entityDictionary)
                        .length
                    }
                  </span>
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "#e65100",
                  }}
                >
                  <IoWarning style={{ marginRight: "0.25rem" }} /> Errors{" "}
                  <span style={{ margin: "0rem 0.5rem" }}>
                    {oEntityDictSize -
                      Object.keys(steps[activeStep].data.entityDictionary)
                        .length}
                  </span>
                </span>
              </>
            )}
          </span>
        </Grid>
        {performRelationAnnotation &&
          steps.details.data.relationAnnotationType === "closed" && (
            <Grid
              item
              container
              xs={12}
              justifyContent="center"
              alignItems="center"
              style={{ margin: "1rem 0rem 0rem 0rem" }}
            >
              <Grid
                item
                xs={12}
                style={{ borderBottom: `1px solid ${grey[300]}` }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h5 id="section-subtitle">Typed Triple Preannotation</h5>
                    <span style={{ fontSize: "0.75rem" }}>
                      Upload a set of known typed triple annotations to
                      pre-annotate your uploaded corpus. Format: (source span,
                      source type, relation type, target span, target type,
                      offset).
                    </span>
                  </div>
                  <label htmlFor="contained-button-file">
                    <Input
                      accept="txt"
                      id="contained-button-file"
                      type="file"
                      onChange={(e) => {
                        readFile(e.target.files[0], "entity");
                      }}
                    />
                    <Button variant="contained" component="span">
                      {steps[activeStep].data.typedTripleDictionaryFileName ===
                      null
                        ? "Upload Triples"
                        : steps[activeStep].data.typedTripleDictionaryFileName}
                    </Button>
                  </label>
                </div>
              </Grid>
              <Grid item xs={12}>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "1rem",
                    padding: "1rem",
                  }}
                >
                  {steps[activeStep].data.typedTripleDictionaryFileName ===
                  null ? (
                    "Upload dictionary to pre-annotate entities with relations"
                  ) : (
                    <>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          color: "#607d8b",
                        }}
                      >
                        <BiGitCommit style={{ marginRight: "0.25rem" }} />{" "}
                        <span style={{ fontWeight: "bold" }}>
                          Sets Uploaded
                        </span>
                        <span
                          style={{
                            margin: "0rem 0.5rem",
                            fontWeight: "bold",
                          }}
                        >
                          {steps[activeStep].data.typedTripleDictionary.length}
                        </span>
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          color: "#e65100",
                        }}
                      >
                        <IoWarning style={{ marginRight: "0.25rem" }} /> Errors{" "}
                        <span style={{ margin: "0rem 0.5rem" }}>
                          {oTripleDictSize -
                            steps[activeStep].data.typedTripleDictionary.length}
                        </span>
                      </span>
                    </>
                  )}
                </span>
              </Grid>
            </Grid>
          )}
      </Grid>
    </Grid>
  );
};
