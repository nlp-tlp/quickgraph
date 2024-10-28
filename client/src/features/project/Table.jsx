import React, { useContext, useState } from "react";
import TextContainer from "./TextContainer";
import {
  Grid,
  Skeleton,
  Box,
  Alert,
  AlertTitle,
  Stack,
  Paper,
} from "@mui/material";
import { ProjectContext } from "../../shared/context/ProjectContext";

/**
 * Table component for displaying texts and handling text markup.
 * @param {Object} props - The component's properties.
 * @param {Object} props.state - The current state of the application.
 * @param {Function} props.dispatch - The dispatch function for the reducer.
 * @param {boolean} [props.demo = false] - A flag indicating whether this is a demo instance.
 * @returns {JSX.Element} The rendered table component.
 */
export const Table = ({ state, dispatch, demo = false }) => {
  const { handleApply } = useContext(ProjectContext);
  const loading = state.textsLoading ?? true;
  const hasTexts = !loading && Object.keys(state.texts).length !== 0;

  const handleMarkupKeyDownEvent = (e) => {
    const {
      entityAnnotationMode,
      keyBinding,
      selectedTokenIndexes,
      selectedTextId,
      settings: { disable_propagation },
      texts,
      projectId,
    } = state;

    if (entityAnnotationMode) {
      const keyDigit = e.code.split("Digit")[1];
      const extraDatasetItemIds = Object.keys(texts);

      // Check if the key pressed corresponds to a valid key binding and
      // there are selected tokens to annotate
      if (
        keyBinding.hasOwnProperty(keyDigit) &&
        selectedTokenIndexes.length > 0
      ) {
        const applyAll = !disable_propagation && e.shiftKey;
        const ontologyItemId = keyBinding[keyDigit].id;

        const payload = {
          project_id: projectId,
          dataset_item_id: selectedTextId,
          extra_dataset_item_ids: extraDatasetItemIds,
          annotation_type: "entity",
          suggested: false,
          content: {
            ontology_item_id: ontologyItemId,
            start: selectedTokenIndexes.slice(0)[0],
            end: selectedTokenIndexes.slice(-1)[0],
            surface_form: texts[selectedTextId].tokens
              .filter((t) => selectedTokenIndexes.includes(t.index))
              .map((t) => t.value)
              .join(" "),
          },
        };

        handleApply({
          body: payload,
          params: { apply_all: applyAll },
        });
      }
    }
  };

  const [selectedWords, setSelectedWords] = useState([]);
  const [activeTextIndex, setActiveTextIndex] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const onMouseDown = (index, textIndex) => {
    dispatch({
      type: "SET_VALUE",
      payload: { currentTextSelected: Object.keys(state.texts)[textIndex] },
    });

    if (textIndex !== activeTextIndex) {
      setActiveTextIndex(textIndex);
      setSelectedWords([index]);
    } else {
      if (selectedWords.length === 1 && selectedWords[0] === index) {
        setSelectedWords([]);
      } else {
        setSelectedWords([index]);
      }
    }
    setIsSelecting(true);
  };

  const onMouseOver = (index) => {
    if (isSelecting && selectedWords.length > 0) {
      const isInSelection = selectedWords.includes(index);
      const isAdjacentToSelection =
        selectedWords.includes(index - 1) || selectedWords.includes(index + 1);
      if (!isInSelection && isAdjacentToSelection) {
        setSelectedWords((prevWords) =>
          [...prevWords, index].sort((a, b) => a - b)
        );
      } else if (isInSelection && isAdjacentToSelection) {
        setSelectedWords((prevWords) =>
          prevWords.filter((wordIndex) => wordIndex !== index)
        );
      }
    }
  };

  const onMouseUp = () => {
    setIsSelecting(false);

    const textId = Object.keys(state.texts)[activeTextIndex];
    dispatch({
      type: "SET_VALUE",
      payload: { selectedTokenIndexes: selectedWords, selectedTextId: textId },
    });
  };

  const noop = () => {};

  return (
    <Grid
      item
      xs={12}
      onKeyDown={(e) => !demo && handleMarkupKeyDownEvent(e)}
      tabIndex="-1"
      sx={{ outline: "none" }}
      p={2}
    >
      {loading ? (
        <Stack direction="column" spacing={2}>
          {Array(6)
            .fill()
            .map((_, index) => (
              <Box as={Paper} variant="outlined">
                <Skeleton
                  key={`table-skeleton-mask-text-${index}`}
                  variant="rectangular"
                  width="100%"
                  height={140}
                />
              </Box>
            ))}
        </Stack>
      ) : hasTexts ? (
        Object.keys(state.texts).map((textId, textIndex) => (
          <TextContainer
            key={textIndex}
            tokens={state.texts[textId].tokens}
            selectedWords={textIndex === activeTextIndex ? selectedWords : []}
            setSelectedWords={setSelectedWords}
            onMouseDown={(index) => onMouseDown(index, textIndex)}
            onMouseOver={textIndex === activeTextIndex ? onMouseOver : noop}
            onMouseUp={textIndex === activeTextIndex ? onMouseUp : noop}
            textId={textId}
            textIndex={textIndex}
          />
        ))
      ) : (
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Alert severity="info">
              <AlertTitle>No dataset items found</AlertTitle>
              You may have no items assigned or your filters may have returned
              no matches. If this is unexpected - try refreshing the page.
            </Alert>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};
