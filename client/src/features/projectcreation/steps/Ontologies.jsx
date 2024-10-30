import "./grid-table.css";
import { Grid, Typography, Tooltip } from "@mui/material";
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

  const updateValue = (key, value) => {
    setValues((prevState) => ({ ...prevState, [key]: value }));
  };

  const handleSelection = (resource) => {
    if (
      values.resources[resource.classification][resource.sub_classification]
        .id === resource.id
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
            id: resource.id,
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
      // renderCell: (params) =>
      //   params.row.created_by !== "system" ? (
      //     <Link
      //       to={`/resource-management/${params.row.id}`}
      //       key={`resource-${params.row.id}`}
      //       target="_blank"
      //       rel="noopener noreferrer"
      //     >
      //       {params.row.name}
      //     </Link>
      //   ) : (
      //     params.row.name
      //   ),
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
      field: "created_by",
      headerName: "Created By",
      maxWidth: 120,
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    // {
    //   field: "created_at",
    //   headerName: "Created",
    //   valueGetter: (params) => moment.utc(params.row.created_at).fromNow(),
    //   maxWidth: 120,
    //   flex: 1,
    //   align: "center",
    //   headerAlign: "center",
    // },

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
      // valueGetter: (params) => moment.utc(params.row.updated_at).fromNow(),
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
            color: [
              values.resources.ontology.entity.id,
              values.resources.ontology.relation.id,
            ].includes(params.id)
              ? "white"
              : theme.palette.neutral.main,
          }}
          disabled={
            (params.row.sub_classification === "relation" &&
              !values.tasks.relation) ||
            (values.dataset.dataset_type === 2 &&
              ![
                values.dataset.entity_ontology_resource_id,
                values.dataset.relation_ontology_resource_id,
              ].includes(params.row.id)) ||
            (values.dataset.dataset_type === 1 &&
              params.row.sub_classification === "entity" &&
              values.dataset.entity_ontology_resource_id !== params.row.id)
          }
        />,
      ],
    },
  ];

  const rows = resources.filter((r) => r.classification === "ontology");

  const handleRowStyle = (row) => {
    if (row.sub_classification === "relation") {
      if (!values.tasks.relation) {
        return "row-unselected";
      } else if (
        values.dataset.relation_ontology_resource_id !== undefined &&
        values.dataset.relation_ontology_resource_id !== row.id
      ) {
        return "row-unselected";
      } else if (values.resources.ontology.relation.id === null) {
        return;
      } else {
        if (row.id === values.resources.ontology.relation.id) {
          return "row-selected";
        } else {
          return "row-unselected";
        }
      }
    }
    if (row.sub_classification === "entity") {
      if (
        values.dataset.entity_ontology_resource_id !== undefined &&
        values.dataset.entity_ontology_resource_id !== row.id
      ) {
        return "row-unselected";
      } else if (values.resources.ontology.entity.id === null) {
        return;
      } else {
        if (row.id === values.resources.ontology.entity.id) {
          return "row-selected";
        } else {
          return "row-unselected";
        }
      }
    }
  };

  return (
    <Grid item container justifyContent="center" direction="column">
      <ContextStack values={values} />
      {loading ? (
        <LoadingAlert message="Loading ontologies" />
      ) : error ? (
        <ErrorAlert />
      ) : rows.length === 0 ? (
        <Grid item xs={12} sx={{ textAlign: "center" }}>
          <Typography>No ontology resources found</Typography>
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
