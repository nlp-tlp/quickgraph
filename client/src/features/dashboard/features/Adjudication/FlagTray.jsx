import { Chip, Stack, Tooltip } from "@mui/material";
import React from "react";

const DEFAULT_FLAGS = ["issue", "quality", "uncertain"];

const FlagTray = ({ flags }) => {
  return (
    <Stack direction="row" spacing={2}>
      {DEFAULT_FLAGS.map((flagType) => (
        <Tooltip title={flags?.[flagType]?.usernames.join(",")}>
          <Chip
            label={`${flagType} (${flags?.[flagType]?.count ?? 0})`}
            disabled={flags?.[flagType] === undefined}
            variant="contained"
            sx={{ cursor: "help", textTransform: "capitalize" }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
};

export default FlagTray;
