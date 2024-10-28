import { useContext } from "react";
// import history from "../../shared/utils/history";

import {
  Alert,
  Snackbar,
  Button,
  AlertTitle,
  Stack,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CreateIcon from "@mui/icons-material/Create";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import LabelIcon from "@mui/icons-material/Label";
import ArticleIcon from "@mui/icons-material/Article";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DoneIcon from "@mui/icons-material/Done";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import AddTaskIcon from "@mui/icons-material/AddTask";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RestoreIcon from "@mui/icons-material/Restore";
import UndoIcon from "@mui/icons-material/Undo";

import { ProjectContext } from "../../shared/context/ProjectContext";
import { StrikeColor } from "../../shared/constants/project";

const AnnotationToast = () => {
  const [state, dispatch] = useContext(ProjectContext);
  const toastAvailable = Object.keys(state.toastInfo).length > 0;

  const actionStatusMap = {
    apply: "success",
    accept: "info",
    delete: "warning",
    remove: "error",
  };

  const toastContent = (info) => {
    let title;
    let content;
    let icon;

    console.log("info", info);

    switch (info.action) {
      case "accept":
        title = "Accepted";
        content = `Accepted ${info.content.count} normalisation${
          info.applyAll ? "s" : ""
        }`;
        icon = info.applyAll ? <AddTaskIcon /> : <CheckCircleOutlineIcon />;
        break;
      case "delete":
        title = "Deleted";
        content = `Deleted ${info.content.count} normalisation${
          info.applyAll ? "s" : ""
        }`;
        icon = info.applyAll ? <RestoreIcon /> : <UndoIcon />;
        break;
      case "apply":
        title = "Applied";
        content = `Applied ${info.content.count} normalisation${
          info.applyAll ? "s" : ""
        }`;
        icon = info.applyAll ? (
          <ContentPasteIcon />
        ) : (
          <CheckCircleOutlineIcon />
        );
        break;
      case "remove":
        title = "Removed";
        content = `Removed ${info.content.count} token${
          info.applyAll ? "s" : ""
        }`;
        icon = info.applyAll ? <DeleteSweepIcon /> : <DeleteIcon />;
        break;
      default:
        title = "Error 😞";
        content = "Something went wrong..";
        break;
    }

    return (
      <Alert
        onClose={() => dispatch({ type: "SET_SHOW_TOAST", payload: false })}
        severity={actionStatusMap[state.toastInfo.action]}
        sx={{ width: "100%" }}
        icon={icon}
      >
        <AlertTitle>{title}</AlertTitle>
        <Stack
          direction="row"
          justifyContent="space-apart"
          alignItems="center"
          spacing={2}
        >
          <Stack direction="column" spacing={2}>
            {content}
            <Stack direction="row" spacing={2}>
              {info.content.label && (
                <Typography variant="paragraph">
                  <LabelIcon sx={{ fontSize: "14px", marginRight: "4px" }} />
                  {info.content.label}
                </Typography>
              )}
              <Stack
                direction="row"
                justifyContent="space-evenly"
                alignItems="center"
              >
                {["remove"].includes(state.toastInfo.action) ? (
                  <Typography variant="body2">
                    {info.content.newValue}
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: "line-through",
                        textDecorationColor: StrikeColor,
                      }}
                    >
                      {info.content.oldValue}
                    </Typography>
                    <ArrowRightAltIcon />
                    <Typography variant="body2">
                      {info.content.newValue}
                    </Typography>
                  </>
                )}
              </Stack>
            </Stack>
          </Stack>
          {/* {["apply", "accept"].includes(info.action) && info.content.count > 1 && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => handleFilter(info)}
              startIcon={<FilterListIcon />}
              size="small"
            >
              Filter
            </Button>
          )} */}
        </Stack>
      </Alert>
    );
  };

  if (!toastAvailable) {
    return null;
  } else {
    return (
      <Snackbar
        open={state.showToast}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => dispatch({ type: "SET_SHOW_TOAST", payload: false })}
      >
        {toastContent(state.toastInfo)}
      </Snackbar>
    );
  }
};

export default AnnotationToast;
