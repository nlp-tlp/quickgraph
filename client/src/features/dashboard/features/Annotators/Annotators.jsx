import { useState, useContext, useEffect } from "react";
import { Typography, Stack, Tooltip } from "@mui/material";
import { DashboardContext } from "../../../../shared/context/dashboard-context";
import useDashboard from "../../../../shared/hooks/api/dashboard";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArticleIcon from "@mui/icons-material/Article";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { UserInvitationField } from "../../../../shared/components/UserInvitationField";
import DeleteModal from "./DeleteModal";
import AssignmentModal from "./AssignmentModal";
import { useAuth } from "../../../../shared/context/AuthContext";

const Annotators = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { state, handleInviteAnnotators, fetchAnnotators } =
    useContext(DashboardContext);
  const { submitting } = useDashboard();
  const [username, setUsername] = useState();
  const [usernames, setUsernames] = useState();
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openAssignmentModal, setOpenAssignmentModal] = useState(false);

  useEffect(() => {
    const getAnnotators = async () => {
      if (loading) {
        await fetchAnnotators({
          projectId: state.projectId,
        });
        setLoading(false);
      }
    };
    getAnnotators();
  }, [loading]);

  // Define the function to handle the button click
  const handleModalOpen = (modalIndex) => {
    if (modalIndex === 1) {
      setOpenDeleteModal(true);
    } else if (modalIndex === 2) {
      setOpenAssignmentModal(true);
    }
  };

  // Define the function to close the modals
  const handleModalClose = (modalIndex) => {
    if (modalIndex === 1) {
      setOpenDeleteModal(false);
    } else if (modalIndex === 2) {
      setOpenAssignmentModal(false);
    }
  };

  const handleInvite = async () => {
    // Sanitize usernames before sending to backend (user cannot invite themself)
    const usernamesToInvite = usernames
      .split(",")
      .map((name) => name.trim())
      .filter((u) => u !== user["https://example.com/username"]);

    handleInviteAnnotators({
      usernames: usernamesToInvite,
      docDistributionMethod: "all",
    });

    setUsernames("");
  };

  const columns = [
    { field: "id", hide: true },
    {
      field: "number",
      headerName: "Number",
      align: "center",
      headerAlign: "center",
      width: 80,
    },
    {
      field: "username",
      headerName: "Username",
      align: "center",
      headerAlign: "center",
      flex: 1,
    },
    {
      field: "role",
      headerName: "Role",
      align: "center",
      headerAlign: "center",
      flex: 1,
    },
    {
      field: "state",
      headerName: "State",
      align: "center",
      headerAlign: "center",
      flex: 1,
    },
    {
      field: "scope_size",
      headerName: "Scope Size",
      align: "center",
      headerAlign: "center",
      flex: 1,
    },
    // { field: "created_at", headerName: "Added" },  // TODO: add `created_at` and `updated_at` fields to annotator elements in projects
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 120,
      align: "left",
      getActions: (params) => [
        <Tooltip title="Click to view annotator assigned scope" arrow>
          <GridActionsCellItem
            icon={<ArticleIcon />}
            label="View annotators assigned scope"
            onClick={() => {
              setUsername(params.row.username);
              handleModalOpen(2);
            }}
          />
        </Tooltip>,
        // ...(params.row.role === "annotator"
        //   ? [
        //       <Tooltip title="Click to disable this annotator" arrow>
        //         <GridActionsCellItem
        //           icon={<VisibilityOffIcon />}
        //           label="Enable/disable annotator"
        //         />
        //       </Tooltip>,
        //     ]
        //   : []),
        ...(params.row.role === "annotator"
          ? [
              <Tooltip
                title="Click to irreversibly remove annotator from project"
                arrow
              >
                <GridActionsCellItem
                  icon={<DeleteIcon />}
                  label="Remove annotator"
                  color="error"
                  onClick={() => {
                    setUsername(params.row.username);
                    handleModalOpen(1);
                  }}
                />
              </Tooltip>,
            ]
          : []),
      ],
    },
  ];

  const rows = loading
    ? []
    : state.annotators?.map((a, index) => ({
        ...a,
        id: a.username,
        number: index + 1,
      }));

  return (
    <>
      <UserInvitationField
        usernames={usernames}
        setUsernames={setUsernames}
        inviteFunction={handleInvite}
        submitting={submitting}
      />
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        p="1rem 0rem"
      >
        <Stack direction="column">
          <Typography variant="button">Project Annotators</Typography>
          <Typography variant="caption" gutterBottom>
            An overview of annotators invited to the current project
          </Typography>
        </Stack>
      </Stack>
      <DataGrid
        autoHeight
        density={"comfortable"}
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        disableColumnSelector
        disableMultipleSelection={true}
        disableSelectionOnClick
      />
      <DeleteModal
        open={openDeleteModal}
        handleClose={() => handleModalClose(1)}
        username={username}
      />
      <AssignmentModal
        open={openAssignmentModal}
        handleClose={() => handleModalClose(2)}
        username={username}
      />
    </>
  );
};

export default Annotators;
