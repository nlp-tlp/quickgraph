import { useState, useContext, useEffect, useMemo } from "react";
import {
  Button,
  Typography,
  Box,
  Stack,
  Modal,
  Tooltip,
  Paper,
  Chip,
  Divider,
  Alert,
} from "@mui/material";
import { DashboardContext } from "../../../../shared/context/dashboard-context";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import LoadingButton from "@mui/lab/LoadingButton";
import GroupIcon from "@mui/icons-material/Group";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 1200,
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
  maxHeight: "90vh",
  overflow: "auto",
};

function areArraysEqual(arr1, arr2) {
  if (!arr1 || !arr2) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return (
    arr1.length === arr2.length &&
    sorted1.every((elem, index) => elem === sorted2[index])
  );
}

const AssignmentModal = ({ open, handleClose, username }) => {
  const { state, handleUpdateAssignment } = useContext(DashboardContext);
  const [rowSelectionModel, setRowSelectionModel] = useState(
    state.annotators.filter((a) => a.username === username)[0]?.scope || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentAnnotator = useMemo(
    () => state.annotators.find((a) => a.username === username),
    [state.annotators, username]
  );

  const otherAnnotatorsAssignments = useMemo(() => {
    const assignments = {};
    state.annotators.forEach((annotator) => {
      if (annotator.username !== username && annotator.scope) {
        annotator.scope.forEach((itemId) => {
          if (!assignments[itemId]) {
            assignments[itemId] = [];
          }
          assignments[itemId].push(annotator.username);
        });
      }
    });
    return assignments;
  }, [state.annotators, username]);

  useEffect(() => {
    if (currentAnnotator?.scope) {
      setRowSelectionModel(currentAnnotator.scope);
    }
  }, [currentAnnotator, open]);

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await handleUpdateAssignment({
        projectId: state.projectId,
        datasetItemIds: rowSelectionModel,
        username: username,
      });
      handleClose();
    } catch (err) {
      setError(err.message || "Failed to update assignments");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      field: "id",
      hide: true,
    },
    {
      field: "text",
      flex: 1,
      headerName: "Text",
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Tooltip title={params.row.text} arrow>
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              cursor: "help",
            }}
          >
            {params.row.text}
          </div>
        </Tooltip>
      ),
    },
    {
      field: "cluster_id",
      headerName: "Cluster",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={`#${params.row.cluster_id}`}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "keywords",
      headerName: "Keywords",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {params.row.cluster_keywords.map((keyword, idx) => (
            <Chip
              key={idx}
              label={keyword}
              size="small"
              variant="outlined"
              color="primary"
            />
          ))}
        </Box>
      ),
    },
    {
      field: "other_annotators",
      headerName: "Other Assignees",
      width: 150,
      renderCell: (params) => {
        const others = otherAnnotatorsAssignments[params.row.id] || [];
        if (others.length === 0) return null;
        return (
          <Tooltip title={others.join(", ")} arrow>
            <Chip
              icon={<GroupIcon />}
              label={others.length}
              size="small"
              color="info"
            />
          </Tooltip>
        );
      },
    },
    {
      field: "created_at",
      headerName: "Added",
      width: 120,
      valueGetter: (params) => {
        if (!params.row?.created_at) return "";
        return moment.utc(params.row.created_at).fromNow();
      },
      align: "center",
      headerAlign: "center",
    },
  ];

  const rows = useMemo(
    () =>
      state.dataset_items?.map((di) => ({
        ...di,
        id: di._id,
      })) || [],
    [state.dataset_items]
  );

  if (!state.dataset_items) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        as={Paper}
        variant="outlined"
        sx={{ ...style, width: 1200, maxHeight: 1000 }}
      >
        <>
          <Box p="1rem 2rem">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="column">
                <Typography id="modal-modal-title" variant="h6" component="h2">
                  Dataset Item Assignment
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Assigning to:
                  </Typography>
                  <Chip label={username} color="primary" size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({rowSelectionModel.length} items selected)
                  </Typography>
                </Stack>
              </Stack>
              <Chip
                label="esc"
                sx={{ fontWeight: 700, fontSize: 12 }}
                onClick={handleClose}
                variant="outlined"
                clickable
                color="primary"
              />
            </Stack>
          </Box>

          <Divider />

          {error && (
            <Box p={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          <Box sx={{ maxHeight: 600 }} p="1rem 2rem">
            <DataGrid
              columns={columns}
              rows={rows}
              density="compact"
              pagination
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={setRowSelectionModel}
              // selectionModel={rowSelectionModel}
              slots={{
                noRowsOverlay: () => (
                  <Stack
                    height="100%"
                    alignItems="center"
                    justifyContent="center"
                  >
                    No items available
                  </Stack>
                ),
              }}
            />
          </Box>

          <Divider />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            p="1rem 2rem"
          >
            <Typography variant="body2" color="text.secondary">
              {currentAnnotator?.scope_size || 0} items currently assigned
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={handleClose}>
                Close
              </Button>
              <LoadingButton
                loading={submitting}
                variant="contained"
                disabled={areArraysEqual(
                  rowSelectionModel,
                  currentAnnotator?.scope
                )}
                onClick={handleUpdate}
              >
                {rowSelectionModel.length === 0
                  ? "Unassign All Items"
                  : `Assign ${rowSelectionModel.length} Items`}
              </LoadingButton>
            </Stack>
          </Box>
        </>
      </Box>
    </Modal>
  );
};

export default AssignmentModal;
