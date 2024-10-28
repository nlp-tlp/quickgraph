import { useContext, useEffect, useState } from "react";
import { Typography, Grid, Stack, Chip } from "@mui/material";
import axios from "axios";
import { ProjectContext } from "../../../shared/context/ProjectContext";

const Contextualiser = () => {
  const [state, dispatch] = useContext(ProjectContext);
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.post("/api/token/search", {
        projectId: state.projectId,
        value: state.selectedTokenValue,
      });

      setData(response.data);
    };

    if (state.selectedTokenValue) {
      fetchData();
    }
  }, [state.selectedTokenValue]);

  if (data) {
    return (
      <Grid p={2}>
        <Typography variant="caption">
          Replacements made on {state.selectedTokenValue}
        </Typography>
        <Stack direction="row" spacing={2} mb={2} pt={1}>
          {Object.keys(data.replacements).length === 0 ? (
            <Chip label={"No replacements found"} size="small" />
          ) : (
            Object.keys(data.replacements).map((value) => (
              <Chip
                key={`replacement-${value}-${data.replacements[value]}`}
                label={`${value}: ${data.replacements[value]}`}
                size="small"
              />
            ))
          )}
        </Stack>
        {/* <Typography variant="caption">Similar Terms</Typography>
        <Stack direction="row" spacing={2} p={1}>
          {data.similar.map((item) => (
            <Chip key={`similar-${item}`} label={item} size="small" />
          ))}
        </Stack> */}
      </Grid>
    );
  }
};

export default Contextualiser;
