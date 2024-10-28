import { useState, useEffect, useContext } from "react";
import { Typography, Stack, TextField, Popover } from "@mui/material";
import { styled } from "@mui/material/styles";
import { grey, blue, orange, green } from "@mui/material/colors";
import EditPopover from "./EditPopover";
import { alpha } from "@mui/material/styles";
// import { EditColor } from "../../shared/constants/project";
import { CleanerContext } from "../../shared/context/cleaner-context";
import { getTokenWidth } from "../../shared/utils/cleaner";

export const TokenInputComponent = styled(TextField)((props) => ({
  textAlign: "center",
  "::selection": {
    background: "transparent",
  },
}));

export const SpanComponent = styled(Typography)((props) => ({
  userSelect: "none",
  zIndex: 1000,
  cursor: "pointer",
  height: "3px",
  margin: "0 4px",
  backgroundColor: alpha(props.color, 0.75),
  "&:hover": {
    backgroundColor: props.color,
  },
}));

const Token = ({
  textId,
  token,
  tokenIndex,
  currentlySelected,
  selectedTokens,
}) => {
  const hasReplacement = token.replacement;
  const hasSuggestion = token.suggestion;
  const isOutOfVocab = !token.tags.en;
  const [editing, setEditing] = useState(false);

  const [state, dispatch] = useContext(CleanerContext);

  // NOTE: Token is selected is for entity annotation mode and contextualisation
  const tokenIsSelected =
    currentlySelected || selectedTokens.tokenIds?.includes(token._id);

  const [anchorEl, setAnchorEl] = useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    dispatch({
      type: "UPDATE_TOKEN_VALUE",
      payload: {
        textId: textId,
        tokenIndex: tokenIndex,
        newValue: hasReplacement
          ? token.replacement
          : hasSuggestion
          ? token.suggestion
          : token.value,
      },
    });
  };

  const open = Boolean(anchorEl);

  const handleTokenEdit = (e, newToken) => {
    dispatch({
      type: "UPDATE_TOKEN_VALUE",
      payload: { textId: textId, tokenIndex: tokenIndex, newValue: newToken },
    });

    // console.log(token.currentValue, newToken);

    if (token.currentValue !== newToken) {
      handlePopoverOpen(e);
    }
  };

  useEffect(() => {
    if (
      (token.value !== token.currentValue ||
        (token.replacement && token.value === token.currentValue)) &&
      token.currentValue !== token.suggestion &&
      token.currentValue !== token.replacement
    ) {
      setEditing(true);
    } else {
      setEditing(false);
      setAnchorEl(null);
    }
  }, [token.currentValue]);

  // const tokenHasSpan = editing || hasReplacement || hasSuggestion;
  const tokenColor = alpha(
    editing || hasReplacement
      ? green[500]
      : hasSuggestion
      ? blue[500]
      : isOutOfVocab
      ? orange[500]
      : grey[700],
    state.tokenizeTextId === null
      ? 1
      : state.tokenizeTextId === textId
      ? 1
      : 0.25
  );

  return (
    <Stack
      key={tokenIndex}
      direction="column"
      id="token-container"
      tokenindex={tokenIndex}
    >
      <TokenInputComponent
        variant="standard"
        tokenindex={tokenIndex}
        key={token._id}
        onChange={(e) => handleTokenEdit(e, e.target.value)}
        autoComplete="off"
        value={token.currentValue}
        inputProps={{
          style: {
            textAlign: "center",
            width: getTokenWidth(token.currentValue),
            color: tokenColor,
          },
        }}
        InputProps={{
          disableUnderline: true,
        }}
        title={`value: ${token.value} | replacement: ${token.replacement} | suggestion: ${token.suggestion}`}
      />
      {tokenIsSelected && (
        <SpanComponent
          color={tokenColor}
          onClick={(e) => handlePopoverOpen(e)}
          title="Click to modify"
        />
      )}
      <Popover
        id="edit-span-popover"
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        disableAutoFocus={true}
        disableEnforceFocus={true}
        elevation={0}
        PaperProps={{
          sx: {
            display: "flex",
            border: "1px solid",
            borderColor: alpha(tokenColor, 0.5),
          },
        }}
      >
        <EditPopover
          textId={textId}
          tokenId={token._id}
          tokenIndex={tokenIndex}
          handlePopoverClose={handlePopoverClose}
          setAnchorEl={setAnchorEl}
          originalValue={token.value}
          currentValue={token.currentValue}
          hasSuggestion={hasSuggestion}
          hasReplacement={hasReplacement}
          editing={editing}
        />
      </Popover>
    </Stack>
  );
};

export default Token;
