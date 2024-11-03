import {
  Stack,
  Tooltip,
  Badge,
  Chip,
  Typography,
  Divider,
  IconButton,
  Box,
  Popover,
} from "@mui/material";
import {
  Save as SaveIcon,
  Share as ShareIcon,
  AccessTime as AccessTimeIcon,
  Label as LabelIcon,
  Chat as ChatIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import TrayFlag from "./TrayFlag";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import { useContext, useState } from "react";
import { ProjectContext } from "../../../shared/context/ProjectContext";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const ExtraFields = ({ fields }) => {
  const theme = useTheme();

  if (Object.keys(fields).length === 0) {
    return (
      <Box sx={{ p: 2, width: 300 }}>
        <Typography color="text.secondary" variant="body2">
          No extra fields available for this item
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 300, maxHeight: 400, overflow: "auto" }}>
      <Stack spacing={1.5} sx={{ p: 2 }}>
        {Object.entries(fields).map(([key, value]) => (
          <Box key={key}>
            <Typography
              component="span"
              color={theme.palette.primary.main}
              sx={{ wordBreak: "break-word" }}
              variant="caption"
            >
              {key}:
            </Typography>{" "}
            <Typography
              component="span"
              variant="caption"
              sx={{
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const getMostRecentDate = (dates) => {
  /**
   * Takes an array of UTC date strings in the format "yyyy-mm-ddThh:mm:ss.ssssss" and returns the most recent date as a UTC Date object.
   * @param {Array} dates - An array of UTC date strings.
   * @returns {Date} The most recent date in UTC format.
   */
  // Convert each date string to a Date object and store in an array
  const dateObjects = dates.map((dateString) => new Date(dateString));

  // Use the reduce() method to find the maximum Date object in the array
  const maxDate = dateObjects.reduce(
    (max, date) => (date > max ? date : max),
    new Date(0)
  );

  // Return the maximum date as a UTC Date object
  return new Date(
    Date.UTC(
      maxDate.getFullYear(),
      maxDate.getMonth(),
      maxDate.getDate(),
      maxDate.getHours(),
      maxDate.getMinutes(),
      maxDate.getSeconds(),
      maxDate.getMilliseconds()
    )
  );
};

const ActionTray = ({ textId, textIndex }) => {
  const theme = useTheme();
  const { state, dispatch, handleSave } = useContext(ProjectContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const tokenCount = state.texts[textId].tokens.length ?? 0;
  const entities = state.entities[textId] ?? [];
  const entityCount = entities.filter((e) => !e.suggested).length;
  const suggestedEntityCount = entities.length - entityCount;
  const relations = state.relations[textId] ?? [];
  const relationCount = relations.filter((r) => !r.suggested).length;
  const suggestedRelationCount = relations.length - relationCount;
  const extraFields = state.texts[textId].extra_fields ?? {};

  const lastUpdatedMarkupDate = moment
    .utc(
      getMostRecentDate([...entities, ...relations].map((i) => i.updated_at))
    )
    .fromNow();

  let [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;

  const toggleDiscussion = () => {
    dispatch({
      type: "TOGGLE_SOCIAL_MENU",
      payload: { datasetItemId: textId },
    });
  };

  const handleExtraFieldsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExtraFieldsClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={2}>
        <Tooltip
          title={
            state.texts[textId].saved ? "Click to unsave" : "Click to save"
          }
          placement="top"
        >
          <Chip
            label={state.texts[textId].saved ? "Unsave" : "Save"}
            size="small"
            icon={<SaveIcon />}
            color={state.texts[textId].saved ? "success" : "warning"}
            variant={state.texts[textId].saved ? "contained" : "outlined"}
            clickable
            onClick={() => handleSave([textId])}
          />
        </Tooltip>
        <Tooltip
          title={
            state.settings.disable_discussion
              ? "Discussions are disabled on this project"
              : "Click to show this items discussion"
          }
          placement="top"
        >
          <Badge
            badgeContent={state.social[textId].length}
            max={9}
            color="primary"
          >
            <Chip
              clickable
              label="Discussion"
              size="small"
              icon={<ChatIcon />}
              color={state.settings.disable_discussion ? "default" : "primary"}
              variant={
                state.discussionDatasetItemId === textId
                  ? "contained"
                  : "outlined"
              }
              onClick={toggleDiscussion}
            />
          </Badge>
        </Tooltip>
        <TrayFlag state={state} dispatch={dispatch} textId={textId} />
        <Chip
          clickable
          label="Extra fields"
          size="small"
          icon={open ? <VisibilityOffIcon /> : <VisibilityIcon />}
          variant={open ? "contained" : "outlined"}
          color="primary"
          onClick={handleExtraFieldsClick}
        />
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleExtraFieldsClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          PaperProps={{
            elevation: 0,
            variant: "outlined",
            sx: {
              mt: 1,
              "&:before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                left: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          }}
        >
          <ExtraFields fields={extraFields} />
        </Popover>

        <Divider orientation="vertical" flexItem />
        <Tooltip
          title={`This item has ${entityCount} accepted and ${suggestedEntityCount} suggested entity annotations`}
          placement="top"
        >
          <Badge badgeContent={suggestedEntityCount} max={9} color="primary">
            <Chip
              label={entityCount}
              size="small"
              icon={<LabelIcon />}
              color="primary"
              variant="outlined"
              sx={{ cursor: "help" }}
            />
          </Badge>
        </Tooltip>
        {state.tasks.relation && (
          <Tooltip
            title={`This item has ${relationCount} accepted and ${suggestedRelationCount} suggested relation annotations`}
            placement="top"
          >
            <Badge
              badgeContent={suggestedRelationCount}
              max={9}
              color="primary"
            >
              <Chip
                label={relationCount}
                size="small"
                icon={<ShareIcon />}
                color="primary"
                variant="outlined"
                sx={{ cursor: "help" }}
              />
            </Badge>
          </Tooltip>
        )}
        {/* <Divider orientation="vertical" flexItem />
        <Tooltip title="Click to annotate entities (experimental)" arrow>
          <Chip
            clickable
            label="Annotate"
            variant="contained"
            size="small"
            icon={<AutoAwesomeIcon />}
            color="primary"
          />
        </Tooltip> */}
      </Stack>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{
          fontWeight: 500,
          color: theme.palette.neutral.main,
          fontSize: "0.75rem",
        }}
      >
        <Tooltip title="Number of tokens in this item" arrow placement="top">
          <Typography fontSize="inherit" sx={{ cursor: "help" }}>
            {tokenCount} tokens
          </Typography>
        </Tooltip>
        {entities.length > 0 && (
          <Tooltip
            title="Time since last annotation was applied"
            arrow
            placement="top"
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ cursor: "help" }}
            >
              <AccessTimeIcon fontSize="inherit" />
              <Typography fontSize="inherit">
                {lastUpdatedMarkupDate}
              </Typography>
            </Stack>
          </Tooltip>
        )}
        <Divider flexItem orientation="vertical" />
        <Tooltip
          title={`Cluster id (keywords: ${state.texts[textId].cluster_keywords})`}
          arrow
          placement="top"
        >
          <Typography fontSize="inherit" sx={{ cursor: "help" }}>
            {state.texts[textId].cluster_id}
          </Typography>
        </Tooltip>
        <Divider flexItem orientation="vertical" />
        <Tooltip
          title={
            `External ID: ${state.texts[textId].external_id}` ??
            "No external id assigned"
          }
          arrow
          placement="top"
        >
          <Typography
            fontSize="inherit"
            sx={{
              fontWeight: 900,
              color: theme.palette.primary.main,
              cursor: "help",
            }}
          >
            {textIndex + 1 + (page - 1) * limit}
          </Typography>
        </Tooltip>
      </Stack>
      {showExtraFields && <ExtraFields fields={extraFields} />}
    </Stack>
  );
};

export default ActionTray;
