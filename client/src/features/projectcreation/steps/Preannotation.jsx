import {
  Grid,
  Typography,
  Box,
  List,
  ListSubheader,
  ListItemText,
  ListItemButton,
  Paper,
  Chip,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  ListItem,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import moment from "moment";

export const Preannotation = ({ values, setValues, loading, resources }) => {
  const updateValue = (key, value) => {
    setValues((prevState) => ({ ...prevState, [key]: value }));
  };

  const handleSelection = (resource) => {
    if (
      values.resources[resource.classification][resource.sub_classification]
        .id === resource._id
    ) {
      // Remove resource from selection
      updateValue("resources", {
        ...values.resources,
        [resource.classification]: {
          ...values.resources[resource.classification],
          [resource.sub_classification]: {
            name: null,
            id: null,
          },
        },
      });
    } else {
      updateValue("resources", {
        ...values.resources,
        [resource.classification]: {
          ...values.resources[resource.classification],
          [resource.sub_classification]: {
            name: resource.name,
            id: resource._id,
          },
        },
      });
    }
  };

  const columns = [
    { field: "id", hide: true },
    {
      field: "sub_classification",
      headerName: "Type",
      flex: 1,
      maxWidth: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      maxWidth: 140,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "size",
      headerName: "Size",
      flex: 1,
      maxWidth: 140,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "ontology",
      headerName: "Ontology",
      flex: 1,
      maxWidth: 140,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "created_by",
      headerName: "Created By",
      maxWidth: 120,
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "created_at",
      headerName: "Created",
      valueGetter: (params) => moment.utc(params.row.created_at).fromNow(),
      maxWidth: 120,
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "updated_at",
      headerName: "Last Updated",
      maxWidth: 120,
      valueGetter: (params) => moment.utc(params.row.updated_at).fromNow(),
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "actions",
      type: "actions",
      width: 40,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<CheckCircleIcon />}
          label="Toggle preannotation resource"
          title="Assign this preannotation resource to the project"
          onClick={() => handleSelection(params.row)}
          color={
            [
              values.resources.preannotation.entity.id,
              values.resources.preannotation.relation.id,
            ].includes(params.id)
              ? "primary"
              : "default"
          }
          disabled={
            params.row.sub_classification === "relation" &&
            !values.tasks.relation
          }
        />,
      ],
    },
  ];

  const rows = resources.filter((i) => i.classification === "preannotation");

  if (values.dataset.is_annotated) {
    return (
      <Grid container>
        <Grid item xs={12} pb="1rem">
          <Alert variant="outlined" severity="warning">
            You've selected an <strong>annotated dataset</strong> which will be
            automatically preannotated upon project creation. This dataset
            suggests to use{" "}
            <strong>
              {values.dataset.is_suggested ? "suggested" : "accepted"}
            </strong>{" "}
            annotations.
          </Alert>
        </Grid>
        <Grid item container xs={12} alignItems="center" spacing={6}>
          <Grid item xs={4}>
            <Stack>
              <Typography variant="h6">Settings - Preannotations</Typography>
              <Typography variant="caption">
                Specify whether preannotations should be set as suggested.
                Suggested annotations require review and acceptance.
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6} xl={6}>
            <FormGroup>
              {[
                {
                  value: values.settings.suggestedPreannotations,
                  updateFunction: () =>
                    updateValue("settings", {
                      ...values.settings,
                      suggestedPreannotations:
                        !values.settings.suggestedPreannotations,
                    }),
                  label: "Set preannotations as suggested",
                },
              ].map((item) => {
                const { value, updateFunction, label } = item;
                const CheckboxForm = (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) => {
                          updateFunction(e.target.value);
                        }}
                        name="ea-ra-closed"
                      />
                    }
                    label={label}
                  />
                );
                return CheckboxForm;
              })}
            </FormGroup>
          </Grid>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container>
      <Grid item xs={12} pb="1rem">
        <Alert variant="outlined" severity="warning">
          Preannotation of non-annotated datasets is coming soon. We appreciate
          your understanding and patience for this feature.
        </Alert>
      </Grid>
    </Grid>
  );

  // return (
  //   <Grid container justifyContent="center" direction="column" spacing={4}>
  //     <Grid item>
  //       <FormControl component="fieldset" variant="standard">
  //         <FormLabel component="legend">Preannotation Settings</FormLabel>
  //         <FormGroup>
  //           <FormControlLabel
  //             control={
  //               <Checkbox
  //                 checked={values.settings.suggestedPreannotations}
  //                 onChange={(e) => {
  //                   updateValue("settings", {
  //                     ...values.settings,
  //                     suggestedPreannotations:
  //                       !values.settings.suggestedPreannotations,
  //                   });
  //                 }}
  //                 name="suggested-preannotation-checkbox"
  //               />
  //             }
  //             label="Set preannotations as suggested labels"
  //           />
  //         </FormGroup>
  //         <FormHelperText>
  //           Set preannotations as suggested labels which require review and
  //           acceptance
  //         </FormHelperText>
  //       </FormControl>
  //       <Typography>
  //         TODO: Add option for 'preference longer spans'. This will mean no
  //         nesting. If false, it will allow nesting of labels, etc.
  //       </Typography>
  //       <Typography>
  //         NOTE: This data grid will be filtered based on the select ontology
  //         resources. If no ontology selected, it will return "select ontology
  //         before preannotation can be selected...".
  //       </Typography>
  //     </Grid>
  //     <Grid item container justifyContent="center">
  //       {loading ? (
  //         <p>Loading...</p>
  //       ) : rows.length === 0 ? (
  //         <Grid item xs={12} sx={{ textAlign: "center" }}>
  //           <Typography>No preannotation resources found</Typography>
  //         </Grid>
  //       ) : (
  //         <>
  //           <div style={{ height: 500, width: "100%" }}>
  //             <DataGrid
  //               autoHeight
  //               density={"comfortable"}
  //               rows={rows}
  //               columns={columns}
  //               pageSize={5}
  //               rowsPerPageOptions={[5]}
  //               disableColumnSelector
  //               disableMultipleSelection={true}
  //               disableSelectionOnClick
  //               // getRowClassName={(params) => handleRowStyle(params.row)}
  //             />
  //           </div>
  //           {/* <Grid item xs={6} sx={{ textAlign: "center" }}>
  //             <Typography>Preannotated Entities</Typography>
  //             <Box
  //               as={Paper}
  //               variant="outlined"
  //               sx={{ maxHeight: 400, overflowY: "auto" }}
  //               m={2}
  //             >
  //               <List sx={{ width: "100%" }}>
  //                 {Object.keys(resources.preannotation.entity).map(
  //                   (createdBy, index) => (
  //                     <ul key={`list-preannotation-entity-${index}`}>
  //                       <ListSubheader sx={{ textTransform: "capitalize" }}>
  //                         {createdBy}
  //                       </ListSubheader>
  //                       {resources.preannotation.entity[createdBy].map(
  //                         (resource) => (
  //                           <ListItem
  //                             key={`list-item-preannotation-entity-${index}`}
  //                           >
  //                             <ListItemButton
  //                               key={`resource-${resource._id}`}
  //                               selected={
  //                                 values.resources.preannotation.entity.id ===
  //                                 resource._id
  //                               }
  //                               onClick={() => handleSelection(resource)}
  //                             >
  //                               <ListItemText
  //                                 primary={resource.name}
  //                                 secondary={`${
  //                                   resource.size
  //                                 } items | Created: ${moment
  //                                   .utc(resource.created_at)
  //                                   .fromNow()}`}
  //                               />
  //                             </ListItemButton>
  //                             <Button>View</Button>
  //                           </ListItem>
  //                         )
  //                       )}
  //                     </ul>
  //                   )
  //                 )}
  //               </List>
  //             </Box>
  //             <Chip
  //               label={`Preannotated Entities: ${
  //                 values.resources.preannotation.entity.name ?? "None selected"
  //               }`}
  //               size="large"
  //               color={
  //                 values.resources.preannotation.entity.id
  //                   ? "primary"
  //                   : "default"
  //               }
  //             />
  //           </Grid>
  //           {values.tasks.relation && resources.preannotation.relation && (
  //             <Grid item xs={6} sx={{ textAlign: "center" }}>
  //               <Typography>Preannotated Relation</Typography>
  //               <Box
  //                 as={Paper}
  //                 variant="outlined"
  //                 sx={{ maxHeight: 400, overflowY: "auto" }}
  //                 m={2}
  //               >
  //                 <List>
  //                   {Object.keys(resources.preannotation.relation).map(
  //                     (createdBy, index) => (
  //                       <ul key={`list-preannotation-relation-${index}`}>
  //                         <ListSubheader sx={{ textTransform: "capitalize" }}>
  //                           {createdBy}
  //                         </ListSubheader>
  //                         {resources.preannotation.relation[createdBy].map(
  //                           (resource) => (
  //                             <ListItem
  //                               key={`list-item-preannotation-relation-${index}`}
  //                             >
  //                               <ListItemButton
  //                                 selected={
  //                                   values.resources.preannotation.relation
  //                                     .id === resource._id
  //                                 }
  //                                 onClick={() => handleSelection(resource)}
  //                               >
  //                                 <ListItemText
  //                                   primary={resource.name}
  //                                   secondary={`${
  //                                     resource.size
  //                                   } items | Created: ${moment
  //                                     .utc(resource.created_at)
  //                                     .fromNow()}`}
  //                                 />
  //                               </ListItemButton>
  //                             </ListItem>
  //                           )
  //                         )}
  //                       </ul>
  //                     )
  //                   )}
  //                 </List>
  //               </Box>
  //               <Chip
  //                 label={`Preannotated Relations: ${
  //                   values.resources.preannotation.relation.name ??
  //                   "None selected"
  //                 }`}
  //                 size="large"
  //                 color={
  //                   values.resources.preannotation.relation.id
  //                     ? "primary"
  //                     : "default"
  //                 }
  //               />
  //             </Grid>
  //           )} */}
  //         </>
  //       )}
  //     </Grid>
  //   </Grid>
  // );

  // // return (
  // //   <Grid item xs={12}>
  // //     <Grid item xs={12}>
  // // <Alert severity="info">
  // //   Click{" "}
  // //   <a
  // //     href={docsPreannotation}
  // //     target="_blank"
  // //     rel="noreferrer"
  // //     alt="QuickGraph Documentation - Preannotation"
  // //   >
  // //     here
  // //   </a>{" "}
  // //   to find out more about QuickGraph's preannotation requirements.
  // // </Alert>
  // //     </Grid>
  // //     <Grid item xs={12} p={2}>
  // //       <Typography>
  // //         Work in progress - upload pre-annotated corpora in the meantime.
  // //       </Typography>
  // //       <ul>
  // //         {Object.keys(resources.preannotation).map((subClf) => (
  // //           <li>
  // //             {subClf}
  // //             {Object.keys(resources.preannotation[subClf]).map((username) => (
  // //               <ul>
  // //                 {username}
  // //                 {resources.preannotation[subClf][username].map((r) => (
  // //                   <li>{r.name}</li>
  // //                 ))}
  // //               </ul>
  // //             ))}
  // //           </li>
  // //         ))}
  // //       </ul>
  // //     </Grid>
  // //   </Grid>
  // // );
};
