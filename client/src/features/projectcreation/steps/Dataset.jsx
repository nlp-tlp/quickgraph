import { Grid, Typography, Tooltip } from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import moment from "moment";
import { useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import LoadingAlert from "../../../shared/components/LoadingAlert";
import ErrorAlert from "../../../shared/components/ErrorAlert";
import ContextStack from "./ContextStack";

export const Dataset = ({
  values,
  setValues,
  loading,
  error,
  datasets = [],
}) => {
  const theme = useTheme();
  const updateValue = (key, value) => {
    setValues((prevState) => ({ ...prevState, [key]: value }));
  };

  const handleSelection = (dataset) => {
    if (values.dataset.id === dataset.id) {
      updateValue("dataset", { name: null, id: null });
    } else {
      updateValue("dataset", {
        name: dataset.name,
        id: dataset._id,
        dataset_type: dataset.dataset_type,
        entity_ontology_resource_id: dataset.entity_ontology_resource_id,
        relation_ontology_resource_id: dataset.relation_ontology_resource_id,
        is_annotated: dataset.is_annotated,
        is_suggested: dataset.is_suggested,
      });
    }
  };

  const columns = [
    { field: "id", hide: true },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      align: "center",
      headerAlign: "center",
      // renderCell: (params) =>
      //   params.row.created_by !== "system" ? (
      //     <Link
      //       to={`/dataset-management/${params.row.id}`}
      //       key={`dataset-${params.row.id}`}
      //       target="_blank"
      //       rel="noopener noreferrer"
      //       style={{
      //         color: [values.dataset.id].includes(params.id) && "white",
      //       }}
      //     >
      //       {params.row.name}
      //     </Link>
      //   ) : (
      //     params.row.name
      //   ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1,
      maxWidth: 360,
      align: "center",
      headerAlign: "center",
      // renderCell: (params) => (
      //   <Tooltip title={params.row.description} arrow>
      //     <div
      //       style={{
      //         whiteSpace: "nowrap",
      //         overflow: "hidden",
      //         textOverflow: "ellipsis",
      //         cursor: "help",
      //       }}
      //     >
      //       {params.row.description}
      //     </div>
      //   </Tooltip>
      // ),
    },
    {
      field: "size",
      headerName: "Size",
      maxWidth: 100,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "is_annotated",
      headerName: "Annotated",
      maxWidth: 100,
      align: "center",
      headerAlign: "center",
      // renderCell: (params) => (
      //   <Tooltip
      //     title="Selecting this dataset will automatically load its associated annotations"
      //     arrow
      //   >
      //     <div
      //       style={{
      //         whiteSpace: "nowrap",
      //         overflow: "hidden",
      //         textOverflow: "ellipsis",
      //         cursor: "help",
      //       }}
      //     >
      //       {params.row.is_annotated ? "True" : "False"}
      //     </div>
      //   </Tooltip>
      // ),
    },
    {
      field: "created_by",
      headerName: "Created By",
      flex: 1,
      maxWidth: 120,
      align: "center",
      headerAlign: "center",
    },
    // {
    //   field: "preprocessing",
    //   headerName: "Preprocessing",
    //   // description: (params) =>
    //   //   `${Object.keys(params.row.preprocessing).join(", ")}`,
    //   sortable: false,
    //   flex: 1,
    //   minWidth: 200,
    //   valueGetter: (params) =>
    //     `${Object.keys(params.row.preprocessing).join(", ")}`,
    //   headerAlign: "center",
    // },
    {
      field: "projects",
      headerName: "Projects",
      align: "center",
      headerAlign: "center",
      maxWidth: 100,
      // valueGetter: (params) => `${params.row.projects.length}`,
    },
    {
      field: "updated_at",
      headerName: "Last Updated",
      flex: 1,
      maxWidth: 160,
      // valueGetter: (params) => moment.utc(params.row.updated_at).fromNow(),
      align: "center",
      headerAlign: "center",
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Selection",
      flex: 1,
      maxWidth: 80,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<CheckCircleIcon />}
          label="Toggle dataset"
          title="Assign this dataset to the project"
          onClick={() => handleSelection(params.row)}
          // color={
          //   [values.dataset.id].includes(params.id) ? "primary" : "default"
          // }
          sx={{
            color: [values.dataset.id].includes(params.id)
              ? "white"
              : theme.palette.neutral.main,
          }}
        />,
      ],
    },
  ];

  const rows = datasets?.map((d) => ({ ...d, id: d._id }));

  const handleRowStyle = (row) => {
    if (values.dataset.id === null) {
      return;
    } else {
      if (row.id === values.dataset.id) {
        return "row-selected";
      } else {
        return "row-unselected";
      }
    }
  };

  return (
    <Grid item container justifyContent="center" direction="column">
      <ContextStack values={values} />
      {loading ? (
        <LoadingAlert message="Loading datasets" />
      ) : error ? (
        <ErrorAlert />
      ) : rows.length === 0 ? (
        <Grid item xs={12} sx={{ textAlign: "center" }}>
          <Typography>No datasets found</Typography>
        </Grid>
      ) : (
        <div style={{ height: 600, width: "100%" }}>
          <DataGrid
            density={"comfortable"}
            rows={rows}
            columns={columns}
            pageSize={20}
            rowsPerPageOptions={[20]}
            disableColumnSelector
            disableMultipleSelection={true}
            disableSelectionOnClick
            getRowClassName={(params) => handleRowStyle(params.row)}
          />
        </div>
      )}
    </Grid>
  );
};
