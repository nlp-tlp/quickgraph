import { Grid, Typography, Tooltip, Chip } from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import moment from "moment";
import { useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import LoadingAlert from "../../../shared/components/LoadingAlert";
import ErrorAlert from "../../../shared/components/ErrorAlert";
import ContextStack from "./ContextStack";
import "./grid-table.css";

export const Dataset = ({
  values,
  setValues,
  loading,
  error,
  datasets = [],
}) => {
  const theme = useTheme();

  const handleSelection = (dataset) => {
    const isSelected = values.dataset.id === dataset.id;

    const newDataset = isSelected
      ? { name: null, id: null }
      : {
          name: dataset.name,
          id: dataset._id,
          dataset_type: dataset.dataset_type,
          entity_ontology_resource_id: dataset.entity_ontology_resource_id,
          relation_ontology_resource_id: dataset.relation_ontology_resource_id,
          is_annotated: dataset.is_annotated,
          is_suggested: dataset.is_suggested,
        };

    setValues({ ...values, dataset: newDataset });
  };

  const getRowClassName = (row) => {
    const isSelected = row.id === values.dataset.id;
    return values.dataset.id
      ? isSelected
        ? "row-selected"
        : "row-unselected"
      : "";
  };

  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      maxWidth: 240,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Link
          to={`/dataset-management/${params.row.id}`}
          key={`dataset-${params.row.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {params.row.name}
        </Link>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1,
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Tooltip title={params.row.description} arrow>
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              cursor: "help",
            }}
          >
            {params.row.description}
          </div>
        </Tooltip>
      ),
    },
    {
      field: "size",
      headerName: "Size",
      maxWidth: 100,
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
      field: "is_annotated",
      headerName: "Annotated",
      maxWidth: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip
          title="Selecting this dataset will automatically load its associated annotations"
          arrow
        >
          <Chip
            label={params.row.is_annotated ? "True" : "False"}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Tooltip>
      ),
    },
    {
      field: "created_by",
      headerName: "Created By",
      flex: 1,
      maxWidth: 120,
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
      field: "projects",
      headerName: "Projects",
      align: "center",
      headerAlign: "center",
      maxWidth: 100,
      valueGetter: (value) => value.length || 0,
    },
    {
      field: "updated_at",
      headerName: "Last Updated",
      flex: 1,
      maxWidth: 160,
      valueGetter: (value) => moment.utc(value).fromNow(),
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
          sx={{
            color:
              values.dataset.id === params.id
                ? theme.palette.primary.main
                : theme.palette.neutral.main,
          }}
        />,
      ],
    },
  ];

  const rows = datasets?.map((d) => ({ ...d, id: d._id })) || [];

  if (loading) return <LoadingAlert message="Loading datasets" />;
  if (error) return <ErrorAlert />;
  if (rows.length === 0) {
    return (
      <Grid item xs={12} sx={{ textAlign: "center" }}>
        <Typography>No datasets found</Typography>
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
