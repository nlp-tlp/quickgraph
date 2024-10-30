import {
  Grid,
  Stack,
  Typography,
  Button,
  Paper,
  TextField,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import moment from "moment";
// import SchemaTreeViewWithButtons from "../../projectcreation/steps/SchemaTreeView";

const ResourceEditor = ({
  createResource,
  processingResource,
  updateResource,
  selectedResource,
  setSelectedResource,
}) => {
  const selectedExistingResource = selectedResource && selectedResource._id;

  const handleSubmit = (existingResource) => {
    if (existingResource) {
      updateResource(selectedResource);
    } else {
      const resource = createResource(selectedResource);
      setSelectedResource(resource);
    }
  };

  return (
    <>
      <div>Coming soon!</div>
      {/* {selectedResource ? (
        <>
          <Grid item xs={12} sx={{ textAlign: "center" }}>
            <Typography variant="h6">
              {selectedExistingResource
                ? "Updating existing resource"
                : "Creating new resource"}
            </Typography>
          </Grid>
          {selectedExistingResource && (
            <Grid
              item
              container
              xs={12}
              p={2}
              justifyContent="center"
              alignItems="center"
            >
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`Created: ${moment
                    .utc(selectedResource.created_at)
                    .fromNow()}`}
                  size="small"
                />
                <Chip
                  label={`Last Updated: ${moment
                    .utc(selectedResource.updated_at)
                    .fromNow()}`}
                  size="small"
                />
              </Stack>
            </Grid>
          )}
          <Grid
            p={2}
            item
            component={Paper}
            variant="outlined"
            xs={12}
            md={12}
            lg={10}
            xl={8}
          >
            <Stack direction="row" spacing={4} alignItems="center" mb={2}>
              <TextField
                required
                label="Ontology Name"
                value={selectedResource.name}
                onChange={(e) =>
                  setSelectedResource({
                    ...selectedResource,
                    name: e.target.value,
                  })
                }
              />
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedResource.classification === "entity"}
                      onChange={() =>
                        setSelectedResource({
                          ...selectedResource,
                          classification: "entity",
                        })
                      }
                      disabled={selectedExistingResource}
                    />
                  }
                  label={"Entity"}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedResource.classification === "relation"}
                      onChange={() =>
                        setSelectedResource({
                          ...selectedResource,
                          classification: "relation",
                        })
                      }
                      disabled={selectedExistingResource}
                    />
                  }
                  label={"Relation"}
                />
              </FormGroup>
              <LoadingButton
                loading={processingResource}
                loadingPosition="start"
                variant="contained"
                onClick={() => handleSubmit(selectedExistingResource)}
                // disabled={!isValid}  // TODO: integrate with ontology validation logic used in project creation.
              >
                {selectedExistingResource && processingResource
                  ? "Updating"
                  : selectedExistingResource
                  ? "Update"
                  : processingResource
                  ? "Creating"
                  : "Create"}
              </LoadingButton>
            </Stack>
            <Divider />
            <SchemaTreeViewWithButtons
              details={{
                name: "hello",
                classification: "ontology",
                sub_classification: "entity",
              }}
              treeData={selectedResource.ontology}
              setTreeData={(treeData) =>
                setSelectedResource({
                  ...selectedResource,
                  ontology: treeData,
                })
              }
              isEntity={selectedResource.classification === "entity"}
            />
          </Grid>
        </>
      ) : (
        <Grid item xs={12} sx={{ textAlign: "center" }} p={2}>
          <Typography>No resource selected - select or create one.</Typography>
        </Grid>
      )} */}
    </>
  );
};

export default ResourceEditor;
