// TODO: add debouncing to input field
import {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Modal,
  Paper,
  Typography,
  Box,
  List,
  TextField,
  ListItem,
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Chip,
  Alert,
  Tooltip,
} from "@mui/material";
import { ProjectContext } from "../../../shared/context/ProjectContext";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import moment from "moment";
import {
  filterTreeBySubstring,
  flattenTree,
} from "../../../shared/utils/treeView";
import LabelIcon from "@mui/icons-material/Label";
import { useTheme } from "@mui/material/styles";
// import { debounce } from "lodash";
import LabelOffIcon from "@mui/icons-material/LabelOff";
import { alpha } from "@mui/material/styles";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
};

/**
 * Escapes special characters in a string to be used in a regular expression.
 * @param {string} str - The string to escape.
 * @returns {string} - The escaped string.
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SearchModal = () => {
  const { state, dispatch, handleApply, fetchSuggestedEntities } =
    useContext(ProjectContext);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [suggestions, setSuggestions] = useState();
  // const [filteredData, setFilteredData] = useState([]);
  const theme = useTheme();
  const inputRef = useRef(null);

  useEffect(() => {
    if (state.ontology) {
      setData(flattenTree(state.ontology.entity));
    }
  }, [state.ontology]);

  const filteredData = useMemo(() => {
    if (filter === "*") {
      return data;
    }
    return data.filter((item) =>
      item.fullname.toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter]);

  const handleChange = (event) => {
    setFilter(event.target.value);
  };

  const handleApplyLabel = (ontologyItemId) => {
    if (state.entityAnnotationMode && 0 < state.selectedTokenIndexes.length) {
      try {
        const textId = state.selectedTextId;
        const tokenIndexes = state.selectedTokenIndexes;

        const start = tokenIndexes[0];
        const end = tokenIndexes.at(-1);

        const payload = {
          project_id: state.projectId,
          dataset_item_id: textId,
          extra_dataset_item_ids: Object.keys(state.texts),
          annotation_type: "entity",
          suggested: false,
          content: {
            ontology_item_id: ontologyItemId,
            start: start,
            end: end,
            surface_form: state.texts[textId].tokens
              .filter((t) => tokenIndexes.includes(t.index))
              .map((t) => t.value)
              .join(" "),
          },
        };
        handleApply({ body: payload, params: { apply_all: false } });
      } catch (error) {
      } finally {
        handleClose();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault(); // prevent default browser behavior
        dispatch({ type: "SET_VALUE", payload: { showSearchModal: true } });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    dispatch({ type: "SET_VALUE", payload: { showSearchModal: false } });
    setFilter("");
  };

  //   TODO: refactor the "tokens" into a single function as its used in multiple places.
  let currentSurfaceForm = "";
  if (state.selectedTextId !== null && state.selectedTextId !== undefined) {
    const textId = state.selectedTextId;
    const tokenIndexes = state.selectedTokenIndexes;
    currentSurfaceForm =
      state.texts?.[textId]?.tokens
        .filter((t) => tokenIndexes.includes(t.index))
        .map((t) => t.value)
        .join(" ") ?? "";
  }

  return (
    <Modal open={state.showSearchModal} onClose={handleClose}>
      <Box sx={style} as={Paper} variant="outlined">
        <Box p="1rem 2rem">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <SearchIcon color="primary" sx={{ mr: 2, my: 0.75 }} />
              <TextField
                // inputRef={inputRef}
                placeholder={
                  currentSurfaceForm === ""
                    ? "Enter text to search for an entity label"
                    : `Enter text to find an entity label for "${currentSurfaceForm}"`
                }
                variant="standard"
                fullWidth
                inputProps={{ style: { fontSize: 20 } }} // font size of input text
                InputProps={{ disableUnderline: true }}
                autoComplete="off"
                type="text"
                value={filter}
                onChange={handleChange}
                helperText='To show all entity labels - enter the character "*"'
              />
            </Box>
            <Chip
              label="esc"
              sx={{ fontWeight: 700, fontSize: 12 }}
              onClick={handleClose}
              variant="outlined"
              clickable
              color="primary"
            />
          </Stack>
        </Box>
        <Box>
          <Divider flexItem />
        </Box>
        {currentSurfaceForm !== "" ? (
          <Box p="1rem 2rem">
            <Typography variant="caption" fontWeight={500}>
              Sugggested labels for{" "}
              <span
                style={{
                  color: theme.palette.primary.main,
                }}
              >
                {currentSurfaceForm}
              </span>
            </Typography>
            <Box mt={2}>
              <Alert severity="info">Suggestions coming soon!</Alert>
              {/* <Stack
                direction="row"
                spacing={2}
                variant="outlined"
                size="small"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Chip label={`Label ${i}`} />
                ))}
              </Stack> */}
            </Box>
          </Box>
        ) : null}
        {filter !== "" && filteredData.length > 0 ? (
          <>
            <Box p="1rem 2rem">
              <Typography variant="caption" fontWeight={500} color="neutral">
                Results: {filteredData.length}
              </Typography>
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                <List>
                  {filteredData.map((i) => {
                    const nameParts = i.name.split(
                      new RegExp(`(${escapeRegExp(filter)})`, "gi")
                    );
                    return (
                      <ListItem>
                        <ListItemButton
                          disabled={!i.active}
                          title="Click to toggle this label"
                          onClick={() => handleApplyLabel(i.id)}
                        >
                          <ListItemIcon>
                            {i.active ? <LabelIcon /> : <LabelOffIcon />}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography title={i.fullname}>
                                {nameParts.map((part, i) => (
                                  <span
                                    key={i}
                                    style={
                                      part.toLowerCase() ===
                                      filter.toLowerCase()
                                        ? {
                                            color: theme.palette.primary.main,
                                            fontWeight: 500,
                                            textDecoration: "underline",
                                          }
                                        : null
                                    }
                                  >
                                    {part}
                                  </span>
                                ))}
                              </Typography>
                            }
                            secondary={
                              <Stack direction="column">
                                <Typography fontSize={10} mb={0.5}>
                                  {i.fullname}
                                </Typography>
                                <Typography fontSize={12}>
                                  {i.description}
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  pr={1}
                                  pt={1}
                                >
                                  {i.example_terms?.map((i) => (
                                    <Chip label={i} size="small" />
                                  ))}
                                </Stack>
                              </Stack>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            </Box>
          </>
        ) : filter !== "" ? (
          <Box p={2} display="flex" justifyContent="center" alignItems="center">
            <Typography>No labels found - try something else.</Typography>
          </Box>
        ) : null}
        <Box p="1rem 2rem">
          <Typography variant="caption" fontWeight={500}>
            Recently applied entity labels
          </Typography>
          <Box mt={2}>
            {state.history.size > 0 ? (
              <Stack
                direction="row"
                spacing={2}
                variant="outlined"
                size="small"
                sx={{ flexWrap: "wrap", listStyle: "none" }}
              >
                {state.history.buffer
                  .filter(
                    (i, index, self) =>
                      i.annotation_type === "entity" &&
                      i.action === "apply" &&
                      index ===
                        self.findIndex(
                          (t) =>
                            t.ontology_item_id === i.ontology_item_id &&
                            t.label_name === i.label_name
                        )
                  )
                  .map((i) => ({
                    label_name: i.label_name,
                    ontology_item_id: i.ontology_item_id,
                  }))
                  .map((i) => (
                    <Tooltip
                      title={
                        currentSurfaceForm
                          ? `Click to apply the label ${i.label_name} to the span "${currentSurfaceForm}"`
                          : "Select a span of text to apply this label"
                      }
                    >
                      <span>
                        <Chip
                          sx={{ mt: 1 }}
                          label={i.label_name}
                          onClick={() => handleApplyLabel(i.ontology_item_id)}
                          clickable
                          disabled={!currentSurfaceForm}
                        />
                      </span>
                    </Tooltip>
                  ))}
              </Stack>
            ) : (
              <Alert severity="info">
                No entities have been applied in this annotation session.
              </Alert>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            height: 40,
            bgcolor: alpha("#f3e5f5", 0.25),
            borderRadius: "0px 0px 16px 16px",
          }}
        ></Box>
      </Box>
    </Modal>
  );
};

export default SearchModal;
