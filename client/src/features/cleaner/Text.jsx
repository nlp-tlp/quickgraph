import { useEffect, useState, useContext } from "react";
import { Box } from "@mui/material";
import Token from "./Token";
import { ProjectContext } from "../../shared/context/ProjectContext";

export const Text = (props) => {
  const { text, textId } = props;

  const [state, dispatch] = useContext(ProjectContext);
  const [dragging, setDragging] = useState(false);

  const handleTextSelectionStart = () => {
    dispatch({ type: "SET_VALUE", payload: { currentTextSelected: textId } });
    dispatch({ type: "SET_VALUE", payload: { tokenIdsSelected: [] } });
    setDragging(true);
  };

  const handleTextSelectionEnd = () => {
    const ids = textSelection();
    dispatch({
      type: "SET_VALUE",
      payload: { selectedTokens: { tokenIds: ids, textId: textId } },
    });
    dispatch({ type: "SET_VALUE", payload: { tokenIdsSelected: ids } });
    setDragging(false);
    dispatch({ type: "SET_VALUE", payload: { currentTextSelected: null } });

    // NOTE: This selects the first entry in the selected tokenIds; review in the future.
    dispatch({
      type: "SET_VALUE",
      payload: {
        selectedTokenValue: Object.values(state.texts[textId].tokens).filter(
          (t) => ids.includes(t._id)
        )[0].value,
      },
    });
  };

  const handleTextSelection = () => {
    if (dragging) {
      const ids = textSelection();
      dispatch({ type: "SET_VALUE", payload: { tokenIdsSelected: ids } });
    }
  };

  const textSelection = () => {
    var selection = window.getSelection();
    if (
      state.currentTextSelected !== null &&
      selection.anchorNode !== null &&
      selection.focusNode !== null
    ) {
      const startIndex = parseInt(
        selection.anchorNode.parentElement.getAttribute("tokenindex")
      );
      const endIndex = parseInt(
        selection.focusNode.parentElement.getAttribute("tokenindex")
      );

      // Both token-container and token have tokenindex attributes so regardless of whether
      // the selection stops on a token with/without spans it should work
      const tokenValues = Object.values(text.tokens);
      const startSliceIndex = startIndex >= endIndex ? endIndex : startIndex;
      const endSliceIndex =
        startIndex > endIndex ? startIndex + 1 : endIndex + 1;
      const selectedTokenIds = tokenValues
        .sort((a, b) => a.index - b.index)
        .slice(startSliceIndex, endSliceIndex)
        .map((t) => t._id);

      return selectedTokenIds;
    }
  };

  useEffect(() => {
    // Ensures that tokens on a single text can be selected at once
    if (state.currentTextSelected === null) {
      dispatch({ type: "SET_VALUE", payload: { tokenIdsSelected: [] } });
    }
  }, [state.currentTextSelected]);

  return (
    <Box
      component="div"
      key={textId}
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
      onMouseDown={handleTextSelectionStart}
      onMouseUp={handleTextSelectionEnd}
      onMouseOver={handleTextSelection}
    >
      {text &&
        Object.keys(text.tokens).map((tokenIndex) => {
          const token = text.tokens[tokenIndex];
          const tokenId = token._id;

          return (
            <Token
              textId={textId}
              token={token}
              tokenIndex={tokenIndex}
              currentlySelected={state.tokenIdsSelected?.includes(tokenId)}
              selectedTokens={state.selectedTokens}
              key={tokenId}
            />
          );
        })}
    </Box>
  );
};
