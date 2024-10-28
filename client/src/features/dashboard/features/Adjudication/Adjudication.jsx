import { useEffect, useState } from "react";
import {
  Grid,
  Stack,
  Box,
  Paper,
  Pagination,
  Divider,
  Alert,
  AlertTitle,
  Button,
  Tooltip,
} from "@mui/material";
import { useContext } from "react";
import { DashboardContext } from "../../../../shared/context/dashboard-context";
import { useTheme } from "@mui/material/styles";
import ErrorAlert from "../../../../shared/components/ErrorAlert";
import useDashboard from "../../../../shared/hooks/api/dashboard";
import { filterEntityData, filterRelationData } from "../utils";
import { useSearchParams } from "react-router-dom";
import EntityVisualiser from "./EntityVisualiser";
import RelationVisualiser from "./RelationVisualiser";
import AnnotatorSelector from "./AnnotatorSelector";
import Filters from "./Filters";
import SocialVisualiser from "./SocialVisualiser";
import Summary from "./Summary";

/**
 * Aggregates a list of flags into a new object with the following format:
 * {'state': {'count': int, 'usernames': [string, ...]}, ...}
 *
 * @param {Array<Object>} list - The list of objects to aggregate.
 * @returns {Object} An object with aggregated data for each state in the input list.
 */
const aggregateFlags = (list) => {
  const result = {};
  for (const { state, created_by } of list) {
    result[state] = result[state] || { count: 0, usernames: [] };
    result[state].count++;
    result[state].usernames.push(created_by);
  }
  return result;
};

const Adjudication = () => {
  const theme = useTheme();
  const { state } = useContext(DashboardContext);
  const [sortDirection, setSortDirection] = useState(-1);
  const { loading, error, data, filterAdjudication } = useDashboard();
  const [selectedAnnotators, setSelectedAnnotators] = useState([]);
  const [entities, setEntities] = useState([]);
  const [relations, setRelations] = useState([]);
  const [flags, setFlags] = useState([]);
  const relationProject = state.tasks.relation;
  let [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search_term") || ""
  );
  const [datasetItemId, setDatasetItemId] = useState("");

  // TODO: Set up this component to be executed via search parameters.
  const page = parseInt(searchParams.get("page")) || 1;
  // const searchterm = searchParams.get("searchterm") || null;
  const sort = searchParams.get("sort") || -1;

  const searchTerm = searchParams.get("search_term") || "";
  // const selectedFlags = searchParams.get("flags") || "";

  const [selectedFlags, setSelectedFlags] = useState(
    searchParams.get("flags")?.split(",") || ["everything"]
  );

  const [minAgreement, setMinAgreement] = useState(
    Number(searchParams.get("min_agreement")) || 0
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("page")) {
      params.set("page", "1");
      setSearchParams(params);
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else if (!params.get("sort")) {
      params.set("sort", "-1");
      setSearchParams(params);
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else if (!params.get("search_term")) {
      params.set("search_term", "");
      setSearchParams(params);
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else if (!params.get("flags")) {
      params.set("flags", "");
      setSearchParams(params);
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else if (!params.get("min_agreement")) {
      params.set("min_agreement", "0");
      setSearchParams(params);
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else {
      setSearchParams(params);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      filterAdjudication({
        page: page,
        sortDirection: sortDirection,
        searchTerm: searchTerm,
        flags: selectedFlags.join(","),
        minAgreement: Number(minAgreement),
        datasetItemId: datasetItemId,
      });
    }
  }, [loading]);

  const handlePagination = (event, newPage) => {
    setSearchParams({ page: newPage, search_term: searchTerm });
    setSelectedAnnotators([]);
    filterAdjudication({
      page: newPage,
      sortDirection: sortDirection,
      searchTerm: searchTerm,
      flags: selectedFlags.join(","),
    });
  };

  const handleResetSearch = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("search_term", "");
    params.set("flags", "");
    params.set("sort", -1);
    params.set("page", 1);
    setSearchParams(params);
    window.history.replaceState(null, "", `?${params.toString()}`);
    filterAdjudication({
      page: page,
      sortDirection: sortDirection,
      searchTerm: "",
      flags: "",
      datasetItemId: "",
    });
    setSearchValue("");
    setSelectedFlags(["everything"]);
    setDatasetItemId("");
  };

  const handleSearch = (value) => {
    const params = new URLSearchParams(window.location.search);
    params.set("search_term", value);
    params.set("flags", selectedFlags.join(","));
    params.set("page", 1);
    setSearchParams(params);
    window.history.replaceState(null, "", `?${params.toString()}`);

    filterAdjudication({
      page: 1,
      sortDirection: sortDirection,
      searchTerm: value,
      flags: selectedFlags.join(","),
      datasetItemId: datasetItemId,
    });
  };

  const handleSort = (event) => {
    const params = new URLSearchParams(window.location.search);
    params.set("sort", event.target.value);
    params.set("page", 1);
    setSearchParams(params);
    window.history.replaceState(null, "", `?${params.toString()}`);
    filterAdjudication({
      page: 1,
      sortDirection: event.target.value,
    });
    setSortDirection(event.target.value);
    // filterAdjudication({ page: page, sortDirection: event.target.value });
  };

  const handleAnnotatorToggle = (item) => {
    const index = selectedAnnotators.indexOf(item);
    if (index === -1) {
      // If the item is not already in the array, push it
      setSelectedAnnotators([...selectedAnnotators, item]);
    } else {
      // If the item is already in the array, remove it
      setSelectedAnnotators([
        ...selectedAnnotators.slice(0, index),
        ...selectedAnnotators.slice(index + 1),
      ]);
    }
  };

  useEffect(() => {
    if (data) {
      const filteredEntities = filterEntityData(
        data.entities,
        selectedAnnotators
      );
      setEntities(filteredEntities);
      // console.log("set entities");

      if (relationProject) {
        const filteredRelations = filterRelationData(
          data.relations,
          selectedAnnotators
        );
        // console.log("filteredRelations", filteredRelations);
        setRelations(filteredRelations);
      }
    }
  }, [data, selectedAnnotators]);

  useEffect(() => {
    const updateFlags = async () => {
      if (data && data.flags) {
        const aggregatedFlags = aggregateFlags(data.flags);
        setFlags(aggregatedFlags);
      } else {
        setFlags(null);
      }
    };
    updateFlags();
  }, [data]);

  return (
    <>
      {error ? (
        <Grid
          item
          xs={12}
          p={2}
          container
          justifyContent="center"
          display="flex"
        >
          <ErrorAlert />
        </Grid>
      ) : (
        <Grid item xs={12} container>
          <Grid item xs={12} pb={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Filters
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                handleSearch={handleSearch}
                handleResetSearch={handleResetSearch}
                sortDirection={sortDirection}
                handleSort={handleSort}
                selectedFlags={selectedFlags}
                setSelectedFlags={setSelectedFlags}
                minAgreement={minAgreement}
                setMinAgreement={setMinAgreement}
                datasetItemId={datasetItemId}
                setDatasetItemId={setDatasetItemId}
              />
              <Pagination
                page={page}
                count={data?.total_items ?? 0}
                onChange={handlePagination}
              />
            </Stack>
          </Grid>
          <Box sx={{ width: "100%" }} p="0rem 0rem 1rem 0rem">
            <Divider />
          </Box>
          {!loading && data?.total_items === 0 ? (
            <Box
              display="flex"
              width="100%"
              justifyContent="center"
              alignItems="center"
            >
              <Alert severity="info" variant="outlined">
                <AlertTitle>Nothing found</AlertTitle>
                Nothing found - Either no dataset item found for the applied
                filter or no dataset items have enough annotators yet.
              </Alert>
            </Box>
          ) : (
            <>
              <Grid container>
                <Grid item xs={2} pr="0.5rem">
                  <Stack direction="column" spacing={2}>
                    <Box as={Paper} variant="outlined">
                      <Summary
                        data={data}
                        loading={loading}
                        hasRelation={state.tasks.relation}
                        flags={flags}
                        entities={entities}
                        relations={relations}
                      />
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Tooltip title="Click to edit your annotations on this dataset item">
                        <Button
                          disableElevation
                          disabled={!data?._id}
                          variant="contained"
                          href={`/annotation/${state.projectId}?page=1&dataset_item_ids=${data?._id}`}
                          size="small"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Click to Edit
                        </Button>
                      </Tooltip>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={10} pl="0.5rem">
                  <Stack direction="column" spacing={2}>
                    <AnnotatorSelector
                      data={data}
                      loading={loading}
                      selectedAnnotators={selectedAnnotators}
                      setSelectedAnnotators={setSelectedAnnotators}
                      handleAnnotatorToggle={handleAnnotatorToggle}
                    />
                    <EntityVisualiser
                      data={data}
                      loading={loading}
                      selectedAnnotators={selectedAnnotators}
                      entities={entities}
                      filterEntityData={filterEntityData}
                    />
                    {relationProject && (
                      <RelationVisualiser
                        data={data}
                        loading={loading}
                        entities={entities}
                        relations={relations}
                      />
                    )}
                    <SocialVisualiser data={data} loading={loading} />
                  </Stack>
                </Grid>
              </Grid>
            </>
          )}
        </Grid>
      )}
    </>
  );
};

export default Adjudication;
