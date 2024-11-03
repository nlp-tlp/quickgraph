import "./grid-table.css";
import { Grid, Typography, Chip } from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import moment from "moment";
import { useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import LoadingAlert from "../../../shared/components/LoadingAlert";
import ErrorAlert from "../../../shared/components/ErrorAlert";
import ContextStack from "./ContextStack";

export const Ontologies = ({
  values,
  setValues,
  loading,
  error,
  resources,
}) => {
  const theme = useTheme();

  const handleSelection = (resource) => {
    const { classification, sub_classification, id, name } = resource;
    const currentSelection =
      values.resources[classification][sub_classification];
    const newValue =
      currentSelection.id === id ? { name: null, id: null } : { name, id };
    setValues({
      ...values,
      resources: {
        ...values.resources,
        [classification]: {
          ...values.resources[classification],
          [sub_classification]: newValue,
        },
      },
    });
  };

  const isRowSelectable = (row) => {
    const { sub_classification, id } = row;
    const { dataset, tasks } = values;
    if (sub_classification === "relation" && !tasks.relation) {
      return false;
    }
    if (dataset.dataset_type === 2) {
      return [
        dataset.entity_ontology_resource_id,
        dataset.relation_ontology_resource_id,
      ].includes(id);
    }
    if (dataset.dataset_type === 1 && sub_classification === "entity") {
      return dataset.entity_ontology_resource_id === id;
    }
    return true;
  };

  const getRowClassName = (row) => {
    const { sub_classification, id } = row;
    const selectedId = values.resources.ontology[sub_classification].id;

    if (!isRowSelectable(row)) {
      return "row-unselected";
    }

    return selectedId === id ? "row-selected" : "row-unselected";
  };

  const columns = [
    {
      field: "sub_classification",
      headerName: "Type",
      flex: 1,
      maxWidth: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.row.sub_classification}
          color="primary"
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      maxWidth: 140,
      align: "left",
      headerAlign: "center",
      renderCell: (params) => (
        <Link
          to={`/resource-management/${params.row.id}`}
          key={`resource-${params.row.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {params.row.name}
        </Link>
      ),
    },
    {
      field: "size",
      headerName: "Size",
      flex: 1,
      maxWidth: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.row.size}
          variant="outlined"
          size="small"
          color="primary"
        />
      ),
    },
    {
      field: "created_by",
      headerName: "Created By",
      maxWidth: 120,
      flex: 1,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.row.created_by}
          variant="outlined"
          size="small"
          color="primary"
        />
      ),
    },
    {
      field: "instances",
      headerName: "Examples",
      sortable: false,
      flex: 1,
      minWidth: 200,
      headerAlign: "center",
      // renderCell: (params) => (
      //   <Tooltip
      //     title={
      //       <div style={{ maxHeight: 160, overflowY: "auto" }}>
      //         {params.row.instances.join(", ")}
      //       </div>
      //     }
      //     arrow
      //     interactive={true}
      //   >
      //     <div
      //       style={{
      //         whiteSpace: "nowrap",
      //         overflow: "hidden",
      //         textOverflow: "ellipsis",
      //         cursor: "help",
      //       }}
      //     >
      //       {params.row.instances.length > 10
      //         ? params.row.instances.slice(0, 10).join(",")
      //         : params.row.instances.join(", ")}
      //     </div>
      //   </Tooltip>
      // ),
    },
    {
      field: "updated_at",
      headerName: "Last Updated",
      maxWidth: 120,
      valueGetter: (value) => moment.utc(value).fromNow(),
      flex: 1,
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
          label="Toggle ontology"
          title="Assign this ontology to the project"
          onClick={() => handleSelection(params.row)}
          sx={{
            color:
              values.resources.ontology[params.row.sub_classification].id ===
              params.id
                ? theme.palette.primary.main
                : theme.palette.neutral.main,
          }}
          disabled={!isRowSelectable(params.row)}
        />,
      ],
    },
  ];

  const rows =
    resources
      .filter((r) => r.classification === "ontology")
      .map((r) => ({ ...r, id: r._id })) || [];

  if (loading) return <LoadingAlert message="Loading ontologies" />;
  if (error) return <ErrorAlert />;
  if (rows.length === 0) {
    return (
      <Grid item xs={12} sx={{ textAlign: "center" }}>
        <Typography>No ontology resources found</Typography>
      </Grid>
    );
  }

  return (
    <Grid item container justifyContent="center" direction="column">
      <ContextStack values={values} />
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
          getRowClassName={(params) => getRowClassName(params.row)}
        />
      </div>
    </Grid>
  );
};
