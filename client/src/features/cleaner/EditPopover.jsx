import { useContext, useState } from "react";
import { Stack, IconButton, Typography, Divider, Tooltip } from "@mui/material";
import { teal, red, orange, grey } from "@mui/material/colors";
// import { useAuth0 } from "@auth0/auth0-react";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweep from "@mui/icons-material/DeleteSweep";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AddTaskIcon from "@mui/icons-material/AddTask";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import TextRotateVerticalIcon from "@mui/icons-material/TextRotateVertical";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import UndoIcon from "@mui/icons-material/Undo";
import RestoreIcon from "@mui/icons-material/Restore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
// import { EditColor, StrikeColor } from "../../shared/constants/project";
import { CleanerContext } from "../../shared/context/cleaner-context";
import { useParams } from "react-router-dom";
import axios from "axios";

const EditPopover = (props) => {
  const {
    textId,
    tokenId,
    tokenIndex,
    handlePopoverClose,
    setAnchorEl,
    originalValue,
    currentValue,
    hasSuggestion,
    hasReplacement,
    editing,
  } = props;
  const [state, dispatch] = useContext(CleanerContext);
  const [showExtraOptions, setShowExtraOptions] = useState(false);

  const handleApplyAction = async (applyAll) => {
    const payload = {
      tokenId: tokenId,
      textId: textId,
      replacement: currentValue,
      applyAll: applyAll,
      suggestion: false,
      textIds: Object.keys(state.texts),
    };

    axios
      .patch("/api/token/add", payload)
      .then((response) => {
        if (response.status === 200) {
          dispatch({
            type: "TOKEN_APPLY",
            payload: {
              ...payload,
              ...response.data,
              tokenIndex: tokenIndex,
              originalValue: originalValue,
            },
          });
          setAnchorEl(null);
        }
      })
      .catch((error) =>
        console.log(`Error occurred applying token replacement ${error}`)
      );
  };

  const handleDeleteAction = async (applyAll) => {
    const payload = {
      tokenId: tokenId,
      applyAll: applyAll,
      textId: textId,
      textIds: Object.keys(state.texts),
    };
    axios
      .patch("/api/token/delete", payload)
      .then((response) => {
        if (response.status === 200) {
          dispatch({
            type: "TOKEN_DELETE",
            payload: {
              ...payload,
              ...response.data,
              tokenIndex: tokenIndex,
              originalValue: originalValue,
              currentValue: currentValue,
            },
          });
          setAnchorEl(null);
        }
      })
      .catch((error) => console.log(`Error occurred deleting token ${error}`));
  };

  const handleAcceptAction = async (applyAll) => {
    const payload = {
      tokenId: tokenId,
      textId: textId,
      applyAll: applyAll,
      textIds: Object.keys(state.texts),
    };
    axios
      .patch("/api/token/accept", payload)
      .then((response) => {
        if (response.status === 200) {
          dispatch({
            type: "TOKEN_ACCEPT",
            payload: {
              ...payload,
              ...response.data,
              tokenIndex: tokenIndex,
              originalValue: originalValue,
              currentValue: currentValue,
            },
          });
          setAnchorEl(null);
        }
      })
      .catch((error) => console.log(`Error occurred accepting token ${error}`));
  };

  const handleSplitAction = async () => {
    const payload = {
      textId: textId,
      tokenId: tokenId,
      tokenIndex: tokenIndex,
      currentValue: currentValue,
      // applyAll: applyAll  // TODO
    };
    axios
      .patch("/api/token/split", payload)
      .then((response) => {
        if (response.status === 200) {
          console.log(response);

          dispatch({ type: "TOKEN_SPLIT", payload: response.data });
        }
      })
      .catch((error) => console.log(`Error: ${error}`));
  };

  const handleRemoveTokenAction = async (applyAll) => {
    const payload = {
      textId: textId,
      tokenId: tokenId,
      applyAll: applyAll,
      textIds: Object.keys(state.texts),
    };

    axios
      .patch("/api/token/remove", payload)
      .then((response) => {
        if (response.status === 200) {
          dispatch({
            type: "TOKEN_REMOVE",
            payload: {
              ...payload,
              ...response.data,
              originalValue: originalValue,
            },
          });
        }
      })
      .catch((error) => console.log(`Error: ${error}`));
  };

  const handleRemoveTokenCase = () => {
    dispatch({
      type: "UPDATE_TOKEN_VALUE",
      payload: {
        textId: textId,
        tokenIndex: tokenIndex,
        newValue: currentValue.toLowerCase(),
      },
    });
  };

  const showOperations = editing || hasReplacement || hasSuggestion;
  const showSplitTokenOperation = /\s/.test(currentValue);
  const showReplacementOperations = editing || hasReplacement;
  const showSuggestionOperations = hasSuggestion && !showReplacementOperations;
  const showDeleteOperations =
    originalValue !== currentValue ||
    (originalValue === currentValue && hasReplacement);
  const showCaseOperation = currentValue !== currentValue.toLowerCase();

  const popoverMenuInfo = [
    {
      name: "accept-all",
      icon: <AddTaskIcon fontSize="inherit" />,
      color: teal[300],
      title: `Accept all suggested corrections`,
      action: () => handleAcceptAction(true),
      show: showSuggestionOperations,
    },
    {
      name: "accept-one",
      icon: <CheckCircleOutlineIcon fontSize="inherit" />,
      color: teal[500],
      title: `Accept this suggested correction`,
      action: () => handleAcceptAction(false),
      show: showSuggestionOperations,
    },
    {
      name: "apply-all",
      icon: <ContentPasteIcon fontSize="inherit" />,
      color: teal[500],
      title: `Apply correction across entire project`,
      action: () => handleApplyAction(true),
      show: showReplacementOperations,
    },
    {
      name: "apply-one",
      icon: <CheckCircleOutlineIcon fontSize="inherit" />,
      color: teal[500],
      title: `Apply this correction to the current token only`,
      action: () => handleApplyAction(false),
      show: showReplacementOperations,
    },
    {
      name: "delete-one",
      icon: <UndoIcon fontSize="inherit" />,
      color: orange[500],
      title: `Undo this correction`,
      action: () => handleDeleteAction(false),
      show: showDeleteOperations,
    },
    {
      name: "delete-all",
      icon: <RestoreIcon fontSize="inherit" />,
      color: red[500],
      title: `Undo all corrections of this type`,
      action: () => handleDeleteAction(true),
      show: showDeleteOperations,
    },
  ];

  return (
    <Stack direction="column" sx={{ maxWidth: "100%" }}>
      {showOperations && (
        <>
          <Stack
            direction="row"
            justifyContent="space-evenly"
            alignItems="center"
            p={1}
          >
            <Typography
              variant="body2"
              sx={{
                textDecoration: "line-through",
                textDecorationColor: "purple",
              }}
            >
              {originalValue}
            </Typography>
            <ArrowRightAltIcon sx={{ color: grey[500] }} />
            <Typography variant="body2" sx={{ color: "red" }}>
              {currentValue}
            </Typography>
          </Stack>
          <Divider />
        </>
      )}
      <Stack
        direction="row"
        spacing={1}
        sx={{ p: "0.25rem 0.5rem 0.25rem 0.5rem" }}
      >
        {popoverMenuInfo
          .filter((i) => i.show)
          .map((item) => (
            <Tooltip title={item.title} disableFocusListener>
              <IconButton
                key={`entity-tooltip-btn-${item.name}`}
                size="small"
                onClick={item.action}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ))}
        {showExtraOptions || !showOperations ? (
          <>
            {showOperations && <Divider orientation="vertical" />}
            {showSplitTokenOperation && (
              <Tooltip title="Click to split token">
                <IconButton size="small" onClick={handleSplitAction}>
                  <ContentCutIcon size="small" sx={{ fontSize: "1rem" }} />
                </IconButton>
              </Tooltip>
            )}
            {showCaseOperation && (
              <Tooltip title="Click to remove token casing">
                <IconButton size="small" onClick={handleRemoveTokenCase}>
                  <TextRotateVerticalIcon
                    size="small"
                    sx={{ fontSize: "1rem" }}
                  />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Click to remove this token">
              <IconButton
                size="small"
                onClick={() => handleRemoveTokenAction(false)}
              >
                <DeleteIcon size="small" sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Click to remove this token from the corpus">
              <IconButton
                size="small"
                onClick={() => handleRemoveTokenAction(true)}
              >
                <DeleteSweep size="small" sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Click to show more options">
            <IconButton
              size="small"
              onClick={() => setShowExtraOptions(!showExtraOptions)}
            >
              <MoreHorizIcon size="small" sx={{ fontSize: "1rem" }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  );
};

export default EditPopover;
