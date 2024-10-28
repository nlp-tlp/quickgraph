import { useEffect, useState, useContext } from "react";
import { LinearProgress, Box, Tooltip } from "@mui/material";
import { ProjectContext } from "../../shared/context/ProjectContext";

const LinearProgressWithLabel = () => {
  const {
    state: { progress = {} },
  } = useContext(ProjectContext);
  const [progressState, setProgressState] = useState({ value: 0, text: "" });

  useEffect(() => {
    if (progress) {
      const { value, dataset_items_saved, dataset_size } = progress;
      setProgressState({
        value: value,
        text: `${dataset_items_saved} / ${dataset_size}`,
      });
    }
  }, [progress]);

  return (
    <Tooltip
      title={`Current annotation progress: ${progressState.text}`}
      placement="top"
    >
      <Box sx={{ width: "100%", cursor: "help" }}>
        <LinearProgress
          variant="determinate"
          value={progressState.value}
          sx={{ height: "6px" }}
        />
      </Box>
    </Tooltip>
  );
};

export default LinearProgressWithLabel;
