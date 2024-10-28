import {
  Stack,
  Tooltip,
  Badge,
  Chip,
  Typography,
  Divider,
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
import { useContext } from "react";
import { ProjectContext } from "../../../shared/context/ProjectContext";

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
  const tokenCount = state.texts[textId].tokens.length ?? 0;
  const entities = state.entities[textId] ?? [];
  const entityCount = entities.filter((e) => !e.suggested).length;
  const suggestedEntityCount = entities.length - entityCount;
  const relations = state.relations[textId] ?? [];
  const relationCount = relations.filter((r) => !r.suggested).length;
  const suggestedRelationCount = relations.length - relationCount;

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
              // disabled={state.settings.disable_discussion}
            />
          </Badge>
        </Tooltip>
        <TrayFlag state={state} dispatch={dispatch} textId={textId} />
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
    </Stack>
  );
};

export default ActionTray;
