import { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Stack,
  Typography,
  Divider,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Skeleton,
  alpha,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import { useParams } from "react-router-dom";
import ErrorAlert from "../../shared/components/ErrorAlert";
import useResource from "../../shared/hooks/api/resource";
import EditResource from "./components/EditResource";
import MainContainer from "../../shared/components/Layout/MainContainer";

const Resource = () => {
  const { resourceId } = useParams();
  const [name, setName] = useState();
  const [editableResource, setEditableResource] = useState();

  const {
    loading,
    error,
    resource,
    fetchResource,
    submitting,
    deleteResource,
  } = useResource();

  useEffect(() => {
    if (loading) {
      fetchResource(resourceId);
    } else {
      setEditableResource({ ...resource });
    }
  }, [loading, resource]);

  return (
    <MainContainer>
      <Grid
        container
        mt={2}
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      >
        {error ? (
          <ErrorAlert />
        ) : (
          <>
            <Grid item xs={12} container>
              <Grid
                item
                xs={3}
                as={Paper}
                variant="outlined"
                sx={{ height: "100%" }}
              >
                {loading || !editableResource ? (
                  <Skeleton variant="rectangular" height={600} width="100%" />
                ) : (
                  <>
                    <Box p={2}>
                      <Typography fontWeight={500}>
                        Resource Information
                      </Typography>
                    </Box>
                    <Divider />
                    {!loading && (
                      <List dense>
                        {[
                          { key: "name", value: resource.name },
                          {
                            key: "type",
                            value: resource.classification,
                          },
                          {
                            key: "sub-type",
                            value: resource.sub_classification,
                          },
                          {
                            key: "last updated",
                            value: moment.utc(resource.updated_at).fromNow(),
                          },
                          {
                            key: "created",
                            value: moment.utc(resource.created_at).fromNow(),
                          },
                          // `Projects: ${dataset.projects.length}`,
                        ].map((item) => (
                          <ListItem>
                            <ListItemText
                              primary={
                                <>
                                  <Typography
                                    fontWeight={500}
                                    fontSize={14}
                                    // color="neutral.main"
                                    sx={{ textTransform: "capitalize" }}
                                  >
                                    {item.key}
                                  </Typography>
                                  <Typography
                                    fontSize={14}
                                    pt={0.5}
                                    sx={{
                                      textTransform:
                                        item.key !== "name" && "capitalize",
                                      wordWrap: "break-word",
                                    }}
                                  >
                                    {item.value}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                    {resource.read_only ? null : (
                      <>
                        <Divider />
                        <Box p={2} sx={{ textAlign: "left" }}>
                          <Typography
                            gutterBottom
                            fontWeight={500}
                            color="error"
                          >
                            Danger Zone
                          </Typography>
                          <Typography variant="caption">
                            Deletion is permanent and irrevesible, but will not
                            affect associated projects.
                          </Typography>
                        </Box>
                        <Box p="0rem 1rem 1rem 1rem">
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <TextField
                              label={`Enter ${resource.name} to delete`}
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              color="error"
                              fullWidth
                              size="small"
                            />
                            {submitting ? (
                              <CircularProgress size={26} />
                            ) : (
                              <Tooltip title="Click to delete dataset">
                                <IconButton
                                  disabled={name !== resource.name}
                                  onClick={() => deleteResource(resourceId)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>
                      </>
                    )}
                    <Divider />
                    <Box
                      p="0rem 1rem"
                      sx={{
                        height: 60,
                        bgcolor: alpha("#f3e5f5", 0.25),
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        justifyContent="flex-start"
                      >
                        {resource.read_only && (
                          <Chip
                            label="Read Only"
                            size="small"
                            color="warning"
                            title="This resource is read only - no modifications are permitted."
                          />
                        )}
                        {resource.is_blueprint && (
                          <Chip
                            label="Blueprint"
                            size="small"
                            color="primary"
                            title="This resource is a blueprint which can be copied by projects."
                          />
                        )}
                      </Stack>
                    </Box>
                  </>
                )}
              </Grid>
              <Grid item xs={9} pl={2}>
                <Grid
                  item
                  container
                  xs={12}
                  sx={{
                    overflowY: "auto",
                    height: loading ? "100%" : "calc(100vh - 309px)",
                  }}
                >
                  {loading || !editableResource ? (
                    <Box as={Paper} variant="outlined" width="100%">
                      <Skeleton
                        variant="rectangular"
                        height="100%"
                        width="100%"
                      />
                    </Box>
                  ) : (
                    <EditResource
                      values={editableResource}
                      setValues={setEditableResource}
                      editable={!resource.read_only}
                    />
                  )}
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </MainContainer>
  );
};

export default Resource;
