import { useEffect, useState, useContext } from "react";
import { LinearProgress, Box, Tooltip } from "@mui/material";
import { ProjectContext } from "../../shared/context/ProjectContext";

const LinearProgressWithLabel = () => {
  const {
    state: { progress },
  } = useContext(ProjectContext);

  const [progressState, setProgressState] = useState({
    value: 0,
    text: "0 / 0",
  });

  useEffect(() => {
    // Only update if progress exists and has changed
    if (
      progress &&
      (progress.value !== progressState.value ||
        progress.dataset_items_saved !==
          parseInt(progressState.text.split(" / ")[0]))
    ) {
      const { value = 0, dataset_items_saved = 0, dataset_size = 0 } = progress;

      setProgressState({
        value: Number(value) || 0, // Ensure value is a number
        text: `${dataset_items_saved || 0} / ${dataset_size || 0}`,
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
          value={Math.min(100, Math.max(0, progressState.value))} // Ensure value is between 0 and 100
          sx={{ height: "6px" }}
        />
      </Box>
    </Tooltip>
  );
};

export default LinearProgressWithLabel;
