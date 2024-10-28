import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import useProject from "../../../../shared/hooks/api/project";
import Filter from "./Filter";
import List from "./List";
import ErrorAlert from "../../../../shared/components/ErrorAlert";

const Insights = ({ state, dispatch }) => {
  const { loading, error, data, fetchInsights } = useProject({
    state,
    dispatch,
  });

  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (loading) {
      fetchInsights(state.projectId);
    }
  }, [loading]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 70px)",
          margin: "auto",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack direction="column" alignItems="center" spacing={2}>
          <Typography>Preparing insights</Typography>
          <CircularProgress size={24} />
        </Stack>
      </Box>
    );
  } else if (error) {
    return <ErrorAlert />;
  } else {
    return (
      <>
        <Filter data={data} setFilteredData={setFilteredData} />
        <Divider flexItem />
        <List data={filteredData} />
      </>
    );
  }
};

export default Insights;
