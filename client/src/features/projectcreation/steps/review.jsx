import { useSelector } from "react-redux";
import { selectSteps } from "../createStepSlice";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from "@mui/material";

import { getFlatOntology } from "../../project/utils";

export const Review = () => {
  const steps = useSelector(selectSteps);

  const keyToNaturalMap = {
    lowercase: "Lower Case",
    removeDuplicates: "Removed Duplicates",
    removeChars: "Removed Special Characters",
  };

  const data = {
    Details: [
      `Name: ${steps.details.data.name}`,
      `Description: ${steps.details.data.description}`,
      `Task: ${
        !steps.details.data.performRelationAnnotation
          ? "Entity Typing"
          : steps.details.data.relationAnnotationType === "closed"
          ? "Entity Typing and Closed Relation Extraction"
          : steps.details.data.relationAnnotationType === "open"
          ? "Entity Typing and Open Relation Extraction"
          : null
      }`,
      `${
        steps.details.data.performClustering
          ? "Perfoming Clustering"
          : "No Clustering"
      }`,
    ],
    Upload: [`${steps.upload.data.corpus.length} Documents`],
    Preprocessing:
      Object.keys(steps.preprocessing.data).filter(
        (action) =>
          steps.preprocessing.data[action] && action !== "removeCharSet"
      ).length === 0
        ? ["No Actions Applied"]
        : Object.keys(steps.preprocessing.data)
            .filter((action) => steps.preprocessing.data[action] === true)
            .map((action) => keyToNaturalMap[action]),
    Schema: [
      Object.values(getFlatOntology(steps.schema.data.entityLabels)).length <= 6
        ? Object.values(getFlatOntology(steps.schema.data.entityLabels))
            .map((label) => `${label.name}`)
            .join(", ")
        : `${
            Object.values(getFlatOntology(steps.schema.data.entityLabels))
              .length
          } entity
          types created`,

      steps.details.data.relationAnnotationType === "closed" &&
      Object.values(getFlatOntology(steps.schema.data.relationLabels)).length <=
        6
        ? Object.values(getFlatOntology(steps.schema.data.relationLabels))
            .map((label) => `${label.name}`)
            .join(", ")
        : steps.details.data.relationAnnotationType === "closed"
        ? `${
            Object.values(getFlatOntology(steps.schema.data.relationLabels))
              .length
          } relation types created`
        : null,
    ],
    Preannotation: [
      Object.keys(steps.preannotation.data.entityDictionary).length === 0
        ? "No entity preannotation performed"
        : `Entity Pairs Uploaded: ${
            Object.keys(steps.preannotation.data.entityDictionary).length
          }`,
      steps.preannotation.data.typedTripleDictionary.length === 0
        ? "No typed triple preannotation performed"
        : `Typed Triple Sets Uploaded: ${steps.preannotation.data.typedTripleDictionary.length}`,
    ],
  };

  return (
    <Grid item xs={12} sx={{ p: 4 }}>
      <TableContainer>
        <Table aria-label="caption table">
          <caption>
            Project creation may take a few minutes if your corpus is very large
            or semantic clustering is being performed
          </caption>
          <TableHead>
            <TableRow>
              <TableCell align="right">Step</TableCell>
              <TableCell align="center">Summary</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(data).map((row) => (
              <TableRow key={row.name}>
                <TableCell component="th" scope="row" align="right">
                  {row}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={2}>
                    {data[row]
                      .filter((i) => i) // Remove nulls
                      .map((item) => (
                        <Chip label={item} />
                      ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
};
