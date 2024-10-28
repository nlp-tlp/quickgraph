import React, { useContext } from "react";
import { Box, Chip, Divider, Skeleton, Stack, Tooltip } from "@mui/material";
import { DashboardContext } from "../../../../shared/context/dashboard-context";

const AnnotatorSelector = ({
  data,
  loading,
  selectedAnnotators,
  setSelectedAnnotators,
  handleAnnotatorToggle,
}) => {
  const { state } = useContext(DashboardContext);

  return (
    <Box>
      {loading ? (
        <Skeleton variant="rectangular" height={40} />
      ) : (
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Note: Clicking two annotators will reduce their labels to those that have majority agreement. The overview will have the majority agreement (aggregate) of all annotations. */}
          <Tooltip title="Toggle agreed upon entities across all annotators">
            <Chip
              key={"annotator-chip-overview"}
              clickable
              label="Overview"
              variant={
                selectedAnnotators.length === 0 ? "contained" : "outlined"
              }
              color={selectedAnnotators.length === 0 ? "primary" : "default"}
              onClick={() => setSelectedAnnotators([])}
            />
          </Tooltip>
          <Divider flexItem orientation="vertical" />
          {data.annotators.map((username, index) => (
            <Tooltip
              key={`annotator-tooltip-${index}`}
              title={`Toggle ${data.entities?.[username]?.length ?? ""} entity${
                state.tasks.relation
                  ? ` and ${data.relations?.[username]?.length ?? 0} relation`
                  : ""
              } annotations created by ${username}`}
            >
              <Chip
                key={`annotator-chip-${index}`}
                clickable
                label={`${username} (E${
                  data.entities?.[username]?.length ?? 0
                }${
                  state.tasks.relation
                    ? `, R${data.relations?.[username]?.length ?? 0}`
                    : ""
                })`}
                variant={
                  selectedAnnotators.includes(username)
                    ? "contained"
                    : "outlined"
                }
                color={
                  selectedAnnotators.includes(username) ? "primary" : "default"
                }
                onClick={() => handleAnnotatorToggle(username)}
                disabled={!data.entities.hasOwnProperty(username)}
              />
            </Tooltip>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default AnnotatorSelector;
