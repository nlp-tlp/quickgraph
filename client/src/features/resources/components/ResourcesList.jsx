/**
 * Enumerates resources created by the current user.
 */

import {
  Box,
  List,
  ListItem,
  ListSubheader,
  ListItemButton,
  IconButton,
  Typography,
  Paper,
  ListItemText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const ResourcesList = ({
  resources,
  loadingResources,
  selectedResource,
  setSelectedResource,
  deleteResource,
}) => {
  if (loadingResources) {
    return <p>Loading resources...</p>;
  }

  console.log("resources", resources);

  return (
    <Box
      as={Paper}
      variant="outlined"
      sx={{
        maxHeight: "calc(100vh - 500px)",
        overflowY: "auto",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {resources.length === 0 ? (
        <p>No resources found</p>
      ) : (
        <List
          sx={{
            position: "relative",
            overflow: "auto",
            width: "100%",
            // height: "calc(100vh - 225px)",
          }}
        >
          {Object.keys(resources).map((clf) => (
            <>
              {Array.isArray(resources[clf]) ? (
                <>
                  <ListSubheader sx={{ textTransform: "capitalize" }}>
                    {clf} ({resources[clf].length})
                  </ListSubheader>
                  {resources[clf].length > 0 ? (
                    <>
                      <p>hello</p>
                    </>
                  ) : (
                    <ListItem disablePadding>
                      <ListItemButton>Create {clf}</ListItemButton>
                    </ListItem>
                  )}
                </>
              ) : (
                Object.keys(resources[clf]).map((sub_clf) => (
                  <li key={`section-${sub_clf}`}>
                    <ListSubheader sx={{ textTransform: "capitalize" }}>
                      {sub_clf} {clf} ({resources[clf][sub_clf].length})
                    </ListSubheader>
                    <ul>
                      {resources[clf][sub_clf].length > 0 ? (
                        resources[clf][sub_clf].map((resource) => (
                          <ListItem
                            key={resource._id}
                            secondaryAction={
                              <IconButton
                                size="small"
                                color="error"
                                title="Click to delete this resource"
                                onClick={() => deleteResource(resource._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                            disablePadding
                          >
                            <ListItemButton
                              selected={
                                selectedResource &&
                                selectedResource._id === resource._id
                              }
                              onClick={() => setSelectedResource(resource)}
                            >
                              <ListItemText>{resource.name}</ListItemText>
                            </ListItemButton>
                          </ListItem>
                        ))
                      ) : (
                        <ListItem disablePadding>
                          No {sub_clf}
                          {/* <ListItemButton>Create {sub_clf}</ListItemButton> */}
                        </ListItem>
                      )}
                    </ul>
                  </li>
                ))
              )}
            </>
          ))}
        </List>
      )}

      {/* {Object.keys(resources).filter((clf) => resources[clf].length > 0)
        .length > 0 ? (
        <List
          sx={{
            position: "relative",
            overflow: "auto",
            height: "calc(100vh - 225px)",
            "& ul": { padding: 2 },
          }}
          subheader={<li />}
        >
          <li>
            {Object.keys(resources["ontology"]).map((sub_clf) => (
              <ul>{sub_clf}</ul>
            ))}
            {Object.keys(resources)
              .filter((clf) => resources[clf].length > 0)
              .map((clf, index) => (
                <ul>
                  <ListSubheader
                    sx={{
                      textTransform: "capitalize",
                    }}
                  >
                    {clf} ({resources[clf].length})
                  </ListSubheader>
                  {resources[clf].map((resource) => (
                    <ListItem
                      key={resource._id}
                      secondaryAction={
                        <IconButton
                          size="small"
                          color="error"
                          title="Click to delete this resource"
                          onClick={() => deleteResource(resource._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                      disablePadding
                    >
                      <ListItemButton
                        selected={
                          selectedResource &&
                          selectedResource._id === resource._id
                        }
                        onClick={() => setSelectedResource(resource)}
                      >
                        {resource.name}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </ul>
              ))}
          </li>
        </List>
      ) : (
        <Box p={2} sx={{ textAlign: "center" }}>
          <Typography>No resources created</Typography>
        </Box>
      )} */}
    </Box>
  );
};

export default ResourcesList;
