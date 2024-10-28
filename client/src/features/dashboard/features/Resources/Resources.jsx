import { useState, useEffect, useContext } from "react";
import {
  Grid,
  Button,
  Typography,
  Stack,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  alpha,
} from "@mui/material";
import SchemaTreeViewWithButtons from "../../../../shared/components/SchemaTreeView";
import { DashboardContext } from "../../../../shared/context/dashboard-context";
import useResource from "../../../../shared/hooks/api/resource";
import { useParams } from "react-router-dom";

const Resources = () => {
  const { state } = useContext(DashboardContext);

  const [view, setView] = useState({
    classification: "ontology",
    sub_classification: "entity",
  });

  return (
    <Grid item xs={12} container>
      <Grid item xs={3} as={Paper} variant="outlined" sx={{ height: "100%" }}>
        <Box p={2}>
          <Typography fontWeight={500}>Resource Information</Typography>
        </Box>
        <Divider />
        <List dense>
          {Object.entries(state.ontology)
            .filter(([key, value]) => value !== null)
            .map(([key, value], index) => (
              <ListItem key={`onto-${index}`}>
                <ListItemText
                  primary={
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography
                        fontWeight={500}
                        fontSize={14}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {key} Ontology
                      </Typography>
                      <Button
                        onClick={() =>
                          setView({
                            classification: "ontology",
                            sub_classification: key,
                          })
                        }
                        variant={
                          view.sub_classification === key
                            ? "contained"
                            : "outlined"
                        }
                        size="small"
                        title="Click to view or edit this resource"
                      >
                        View/Edit
                      </Button>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          {/* <ListItem>
            <ListItemText primary={"Constraints - Entity (editable)"} />
          </ListItem>
          <ListItem>
            <ListItemText primary={"Constraints - Relation (editable)"} />
          </ListItem>
          <ListItem>
            <ListItemText primary={"Preannotations (not editable)"} />
          </ListItem> */}
        </List>
        {/* <Button>Add relation annotation to project</Button> */}
        <Divider />
        <Box>
          <ul>
            <li>
              <Typography pr={2} fontSize={14}>
                Currently, resource items cannot be deleted, only disabled to
                preserve existing markup
              </Typography>
            </li>
            <li>
              <Typography pr={2} fontSize={14}>
                Any changes made will impact all annotators
              </Typography>
            </li>
          </ul>
        </Box>
        <Box
          sx={{
            height: 60,
            bgcolor: alpha("#f3e5f5", 0.25),
          }}
        ></Box>
      </Grid>
      <Grid item xs={9} pl={2}>
        <OntologyComponent
          classification={view.classification}
          subClassification={view.sub_classification}
        />
      </Grid>
    </Grid>
  );
};

const OntologyComponent = ({ classification, subClassification }) => {
  const { projectId } = useParams();
  const { state } = useContext(DashboardContext);
  const [editableResource, setEditableResource] = useState();
  const [loading, setLoading] = useState(true);
  const { updateResource } = useResource();

  useEffect(() => {
    setLoading(true);
    setEditableResource(null);
  }, [subClassification]);

  useEffect(() => {
    if (loading && !editableResource && state.ontology[subClassification]) {
      setEditableResource([...state.ontology[subClassification]]);
      setLoading(false);
    }
  }, [loading, subClassification]);

  const handleUpdate = () => {
    // console.log("editable resource update", editableResource);
    return updateResource({
      project_id: projectId,
      classification: classification,
      sub_classification: subClassification,
      content: editableResource,
    });
  };

  return (
    <Grid item container xs={12} spacing={2}>
      <Grid
        item
        xs={12}
        sx={{ height: "calc(100vh - 294px)", overflowY: "auto" }}
      >
        {!loading && (
          <SchemaTreeViewWithButtons
            details={{
              id: `ontology-editor-${subClassification}`,
              name: `project-${state.name}`,
              classification: classification,
              sub_classification: subClassification,
            }}
            treeData={editableResource}
            setTreeData={(treeData) => setEditableResource([...treeData])}
            editable={true}
            canDeleteItems={false}
            onUpdate={handleUpdate}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default Resources;
