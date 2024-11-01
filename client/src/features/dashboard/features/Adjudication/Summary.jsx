import {
  Box,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Skeleton,
  Typography,
} from "@mui/material";
import React from "react";
import moment from "moment";
import HelpCenterIcon from "@mui/icons-material/HelpCenter";
import BugReportIcon from "@mui/icons-material/BugReport";
import WarningIcon from "@mui/icons-material/Warning";
import SaveIcon from "@mui/icons-material/Save";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GavelIcon from "@mui/icons-material/Gavel";
import CategoryIcon from "@mui/icons-material/Category";
import ShareIcon from "@mui/icons-material/Share";

import CopyToClipboard from "./CopyToClipboard";

moment.locale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "seconds",
    ss: "%ss",
    m: "a minute",
    mm: "%dm",
    h: "an hour",
    hh: "%dh",
    d: "a day",
    dd: "%dd",
    M: "a month",
    MM: "%dM",
    y: "a year",
    yy: "%dY",
  },
});

const DEFAULT_FLAGS = ["issue", "quality", "uncertain"];
const FLAG_ICONS = {
  issue: <BugReportIcon />,
  quality: <WarningIcon />,
  uncertain: <HelpCenterIcon />,
};

const Summary = ({
  data,
  loading,
  hasRelation,
  flags,
  entities,
  relations,
}) => {
  let annotationTextToCopy = "";

  try {
    annotationTextToCopy = `Text:\n${data.tokens.join(
      " "
    )}\n\nEntities:\n${entities
      .map(
        (e) =>
          `(${e.start},${e.end}) (${data.tokens
            .slice(e.start, e.end + 1)
            .join(" ")})[${e.ontology_item_name}]`
      )
      .join("\n")}\n\nRelations:\n${relations
      .map(
        (r) =>
          `(${r.source.surface_form})[${
            entities.filter(
              (e) =>
                e.start === r.source.start &&
                e.end === r.source.end &&
                e.ontology_item_id === r.source.ontology_item_id
            )[0].ontology_item_name
          }]-[${r.ontology_item_name}]->(${r.target.surface_form})[${
            entities.filter(
              (e) =>
                e.start === r.target.start &&
                e.end === r.target.end &&
                e.ontology_item_id === r.target.ontology_item_id
            )[0].ontology_item_name
          }]`
      )
      .join("\n")}`;
  } catch (error) {
    annotationTextToCopy = "error creating stringified annotation(s)";
  }

  return (
    <>
      <Box p={2}>
        <Typography fontWeight={700}>Overview</Typography>
      </Box>
      <Divider flexItem />
      <Box>
        {loading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : (
          <>
            <Box p={2}>
              <Stack direction="column" spacing={4}>
                <Stack
                  direction="row"
                  key="overall-agreement"
                  justifyContent={"space-between"}
                  alignItems={"center"}
                >
                  <Tooltip
                    title="This is the overall agreement"
                    placement="left"
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{ cursor: "help" }}
                    >
                      <Box
                        mr={1}
                        display="flex"
                        alignItems="center"
                        sx={{ color: "neutral.dark" }}
                      >
                        <GavelIcon />
                      </Box>
                      <Typography>Overall</Typography>
                    </Box>
                  </Tooltip>
                  <Typography>
                    {Math.round(data.agreement.overall * 100)}%
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  key="entity-agreement"
                  justifyContent={"space-between"}
                  alignItems={"center"}
                >
                  <Tooltip
                    title="This is the entity agreement"
                    placement="left"
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{ cursor: "help" }}
                    >
                      <Box
                        mr={1}
                        display="flex"
                        alignItems="center"
                        sx={{ color: "neutral.dark" }}
                      >
                        <CategoryIcon />
                      </Box>
                      <Typography>Entity</Typography>
                    </Box>
                  </Tooltip>
                  <Typography>
                    {Math.round(data.agreement.entity * 100)}%
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  key="relation-agreement"
                  justifyContent={"space-between"}
                  alignItems={"center"}
                >
                  <Tooltip
                    title="This is the relation agreement"
                    placement="left"
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{ cursor: "help" }}
                    >
                      <Box
                        mr={1}
                        display="flex"
                        alignItems="center"
                        sx={{ color: "neutral.dark" }}
                      >
                        <ShareIcon />
                      </Box>
                      <Typography>Relation</Typography>
                    </Box>
                  </Tooltip>
                  <Typography>
                    {Math.round(data.agreement.relation * 100)}%
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            <Divider />
            <Box p={2}>
              <Stack
                direction="column"
                spacing={2}
                id="flag-list"
                key="flag-list"
              >
                {DEFAULT_FLAGS.map((flagType) => (
                  <Stack
                    direction="row"
                    justifyContent={"space-between"}
                    alignItems="center"
                  >
                    <Tooltip
                      title={`Number of ${flagType} flags applied to this dataset item`}
                      placement="left"
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        sx={{ cursor: "help" }}
                      >
                        <Box
                          mr={1}
                          display="flex"
                          alignItems="center"
                          sx={{ color: "neutral.dark" }}
                        >
                          {FLAG_ICONS[flagType]}
                        </Box>
                        <Typography
                          key={`flag-${flagType}`}
                          sx={{ textTransform: "capitalize" }}
                        >
                          {flagType}
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Tooltip
                      title={`Applied by ${
                        flags?.[flagType]?.usernames?.join(", ") ?? "no one"
                      }`}
                    >
                      <Box sx={{ cursor: "help" }}>
                        <Typography>{flags?.[flagType]?.count ?? 0}</Typography>
                      </Box>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Divider />
            <Box p={2}>
              <Stack direction="column" spacing={2} key={"other-list"}>
                <Stack
                  direction="row"
                  key="saved-by"
                  justifyContent={"space-between"}
                  alignItems="center"
                >
                  <Tooltip
                    title="Number of annotators who have saved this dataset item"
                    placement="left"
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{ cursor: "help" }}
                    >
                      <Box
                        mr={1}
                        display="flex"
                        alignItems={"center"}
                        sx={{ color: "neutral.main" }}
                      >
                        <SaveIcon />
                      </Box>
                      <Typography fontSize={14}>Saved By</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip
                    title={`Saved by ${
                      data.save_states.length === 0
                        ? "no one"
                        : data.save_states.map((ss) => ss.created_by).join(", ")
                    }`}
                  >
                    <Box sx={{ cursor: "help" }}>
                      <Typography fontSize={14}>
                        {data.save_states.length}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Stack>
                <Stack
                  direction="row"
                  key="saved-by"
                  justifyContent={"space-between"}
                  alignItems="center"
                >
                  <Tooltip
                    title="Time since this dataset was last updated by a project annotator"
                    placement="left"
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{ cursor: "help" }}
                    >
                      <Box
                        mr={1}
                        display="flex"
                        alignItems={"center"}
                        sx={{ color: "neutral.main" }}
                      >
                        <AccessTimeIcon />
                      </Box>
                      <Typography fontSize={14}>Last Updated</Typography>
                    </Box>
                  </Tooltip>
                  <Typography fontSize={14}>
                    {data.updated_at
                      ? moment.utc(data.updated_at).fromNow()
                      : "No markup applied"}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            <Divider />
            <Box p={2}>
              <CopyToClipboard
                displayText="Copy id"
                textToCopy={data._id}
                truncate={false}
              />
              <CopyToClipboard
                displayText="Copy annotations"
                textToCopy={annotationTextToCopy}
                truncate={false}
              />
            </Box>
          </>
        )}
      </Box>
    </>
  );
};

export default Summary;
