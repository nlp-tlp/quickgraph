import { Grid, Stack, Typography, Skeleton, Paper, Box } from "@mui/material";
import useProjects from "../../shared/hooks/api/projects";
import ActivityFeed from "./ActivityFeed";
import MainContainer from "../../shared/components/Layout/MainContainer";
import { useEffect } from "react";

const SummaryCard = ({ name, value, loading }) => (
  <Grid item xs={6}>
    <Box sx={{ height: 240 }} as={Paper} variant="outlined">
      <Stack
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ height: "100%" }}
      >
        {loading ? (
          <Skeleton variant="rectangular" height="100%" width="100%" />
        ) : (
          <>
            <Typography variant="h1">{value}</Typography>
            <Typography variant="button">{name}</Typography>
            {/* <Typography variant="caption" color="neutral.main">
          Top 10% of Users
        </Typography> */}
          </>
        )}
      </Stack>
    </Box>
  </Grid>
);

const Home = () => {
  const { loading, data, getSummary } = useProjects();

  useEffect(() => {
    if (loading) {
      getSummary();
    }
  }, [loading]);

  return (
    <MainContainer>
      <div style={{ height: "100%" }}>
        <Grid container mt={2} alignItems="stretch" sx={{ height: "80vh" }}>
          <Grid item xs={8} container spacing={2} pr={1}>
            {data.summary?.map((item) => <SummaryCard {...item} />) ??
              Array(6)
                .fill()
                .map((_, index) => (
                  <SummaryCard key={index} loading={loading} />
                ))}
          </Grid>
          <Grid
            item
            xs={4}
            pl={1}
            sx={{ overflowY: "auto", maxHeight: "100%" }}
          >
            <ActivityFeed data={data.activity} loading={loading} />
          </Grid>
        </Grid>
      </div>
    </MainContainer>
  );
};

export default Home;
