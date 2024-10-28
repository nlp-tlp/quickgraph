import { useState, useContext, useEffect } from "react";
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
} from "@mui/material";
import { DashboardContext } from "../../../../shared/context/dashboard-context";
import { style as modalStyle } from "../../../../shared/styles/modal";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import LoadingButton from "@mui/lab/LoadingButton";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
};

function areArraysEqual(arr1, arr2) {
  return (
    arr1.length === arr2.length &&
    arr1.sort().every((elem, index) => elem === arr2.sort()[index])
  );
}

const AssignmentModal = ({ open, handleClose, username }) => {
  const { state, handleUpdateAssignment } = useContext(DashboardContext);
  const [rowSelectionModel, setRowSelectionModel] = useState(
    state.annotators.filter((a) => a.username === username)[0]?.scope || []
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const annotator = state.annotators.find((a) => a.username === username);
    const rowSelectionModel = annotator?.scope || [];
    setRowSelectionModel(rowSelectionModel);
  }, [username, state.annotators, state.dataset_items, handleClose]);

  const handleUpdate = async () => {
    setSubmitting(true);
    await handleUpdateAssignment({
      projectId: state.projectId,
      datasetItemIds: rowSelectionModel,
      username: username,
    });
    handleClose();
    setSubmitting(false);
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
      field: "created_at",
      headerName: "Added",
      flex: 1,
      maxWidth: 120,
      valueGetter: (params) => moment.utc(params.row.updated_at).fromNow(),
      align: "center",
      headerAlign: "center",
    },
    // NOTE: This field will be the count and names of assignees e.g. "(2): tyler-research, dummy-user-1". This will help the PM assign documents efficiently.
    // {
    //   field: "assignees",
    //   headerName: "Others Assigned",
    //   flex: 1,
    //   maxWidth: 140,
    //   align: "center",
    //   headerAlign: "center",
    // },
  ];

  const rows = state.dataset_items?.map((di) => ({
    ...di,
    id: di._id,
  }));

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
                <Typography
                  id="modal-modal-description"
                  sx={{ mt: 2 }}
                  gutterBottom
                >
                  Click on item checkboxes to assign them to{" "}
                  <strong>{username}</strong>
                </Typography>
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
          <Box>
            <Divider flexItem />
          </Box>
          <Box sx={{ maxHeight: 600 }} p="1rem 2rem">
            <DataGrid
              autoHeight
              columns={columns}
              rows={rows}
              density="compact"
              pageSize={10}
              rowsPerPageOptions={[10]}
              checkboxSelection
              onSelectionModelChange={(newRowSelectionModel) => {
                setRowSelectionModel(newRowSelectionModel);
              }}
              selectionModel={rowSelectionModel}
            />
          </Box>
          <Box>
            <Divider flexItem />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "right" }} p="1rem 2rem">
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={handleClose}>
                Close
              </Button>
              <LoadingButton
                loading={submitting}
                variant="contained"
                disabled={areArraysEqual(
                  rowSelectionModel,
                  state.annotators.filter((a) => a.username === username)[0]
                    ?.scope || []
                )}
                onClick={handleUpdate}
              >
                {rowSelectionModel.length === 0
                  ? "Unassign All Items"
                  : "Update Assignment"}
              </LoadingButton>
            </Stack>
          </Box>
        </>
      </Box>
    </Modal>
  );
};

export default AssignmentModal;
