import { Chip, Divider, Stack } from "@mui/material";

function ContextStack(props) {
  const { values } = props;

  return (
    <Stack direction="row" justifyContent="right" spacing={2} pb={2}>
      <Chip
        label={`Dataset: ${values.dataset.name ?? "Not selected"}`}
        variant="outlined"
        color={values.dataset.id ? "primary" : "default"}
      />
      <Divider flexItem orientation="vertical" />
      <Chip
        label={`Entity Ontology: ${
          values.resources.ontology.entity.name ?? "Not selected"
        }`}
        variant="outlined"
        color={values.resources.ontology.entity.name ? "primary" : "default"}
      />
      {values.tasks.relation && (
        <Chip
          label={`Relation Ontology: ${
            values.resources.ontology.relation.name ?? "Not selected"
          }`}
          variant="outlined"
          color={
            values.resources.ontology.relation.name ? "primary" : "default"
          }
        />
      )}
    </Stack>
  );
}

export default ContextStack;
