import React, { useContext, useEffect } from "react";
import { Typography, Stack, Grid, Paper, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";
import SpanStack from "./spans/SpanStack";
import { ProjectContext } from "../../shared/context/ProjectContext";
import { useTheme } from "@mui/material/styles";
import ActionTray from "./InteractiveTray/ActionTray";

export const TokenComponent = styled(Typography)((props) => ({
  color: grey[900],
  backgroundColor: props.currentlyselected ? grey[200] : "white",
  cursor: !props.disabled && "pointer",
  textAlign: "center",
  opacity: props.loweropacity ? 0.25 : 1,
  padding: "0px 4px",
  "&:hover": {
    backgroundColor: !props.disabled && grey[200],
  },
  "::selection": {
    background: "transparent",
  },
}));

const TextContainer = ({
  tokens,
  selectedWords,
  setSelectedWords,
  onMouseDown,
  onMouseOver,
  onMouseUp,
  textId,
  textIndex,
}) => {
  const { state, dispatch } = useContext(ProjectContext);
  const theme = useTheme();

  const textEntities =
    state.entities && Object.keys(state.entities).includes(textId)
      ? state.entities[textId]
      : null;
  const textHasEntitySpans = textEntities && textEntities.length > 0;

  const highlightIndex =
    !state.entityAnnotationMode && state.currentTextSelected === textId;
  const disabled = state.texts[textId].saved;

  const handleTextSelect = () => {
    const currentTextSelected = Object.keys(state.texts)[textIndex];

    // Dispatch the currently selected text
    dispatch({
      type: "SET_VALUE",
      payload: { currentTextSelected },
    });

    const isDifferentTextSelected =
      state.currentTextSelected !== currentTextSelected;

    // If not in entity annotation mode and a different text is selected,
    // then dispatch an action to remove source and target relationships
    if (!state.entityAnnotationMode && isDifferentTextSelected) {
      dispatch({ type: "REMOVE_SOURCE_TARGET_RELS" });
    }
  };

  useEffect(() => {
    if (disabled) {
      setSelectedWords([]);
    }
  }, [disabled]);

  const noop = () => {};

  return (
    <Grid
      container
      item
      as={Paper}
      variant="outlined"
      m="1rem 0rem"
      xs={12}
      id={`text-container-${textId}`}
      onMouseUp={() => (disabled ? noop() : onMouseUp())}
      onMouseDown={handleTextSelect}
      style={{
        display: "flex",
        flexDirection: "row",
        userSelect: "none",
        borderColor: highlightIndex ? theme.palette.primary.main : undefined,
        minHeight: 140,
      }}
    >
      <Grid item xs={12} p={2}>
        <ActionTray
          state={state}
          dispatch={dispatch}
          textId={textId}
          textIndex={textIndex}
        />
      </Grid>
      <Grid item xs={12} p={2}>
        <Box
          component="div"
          key={textIndex}
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            userSelect: disabled && "none",
          }}
        >
          {tokens.map((token, index) => (
            <Stack key={index} direction="column" id="token-container">
              <TokenComponent
                key={index}
                onMouseDown={() => (disabled ? noop() : onMouseDown(index))}
                onMouseOver={() => (disabled ? noop() : onMouseOver(index))}
                currentlyselected={selectedWords.includes(index) ? 1 : 0}
                disabled={disabled ? 1 : 0}
              >
                {token.value}
              </TokenComponent>
              {textHasEntitySpans && (
                <SpanStack
                  state={state}
                  dispatch={dispatch}
                  textId={textId}
                  token={token}
                  entitySpans={textEntities}
                  disabled={disabled}
                />
              )}
            </Stack>
          ))}
        </Box>
      </Grid>
    </Grid>
  );
};

export default TextContainer;
