import { useState, useContext, useEffect } from "react";
import axios from "axios";
// import { useAuth0 } from "@auth0/auth0-react";
import {
  Grid,
  Stack,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { grey, green, orange, teal, yellow } from "@mui/material/colors";
import SaveIcon from "@mui/icons-material/Save";
import FlagIcon from "@mui/icons-material/Flag";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import JoinFullIcon from "@mui/icons-material/JoinFull";
import { Text } from "./Text";
import { CleanerContext } from "../../shared/context/cleaner-context";
import { getTokenWidth } from "../../shared/utils/cleaner";

export const TextContainer = (props) => {
  const { text, textId, textIndex } = props;

  const [state, dispatch] = useContext(CleanerContext);

  const handleSave = async (textId, saveState) => {
    axios
      .patch("/api/text/save", {
        textIds: [textId],
        saved: saveState,
      })
      .then((response) => {
        if (response.status === 200) {
          dispatch({
            type: "SAVE_TEXTS",
            payload: { textIds: [textId], saveState: saveState },
          });
        }
      });

    axios
      .get(`/api/project/progress/${state.projectId}`)
      .then((response) => {
        if (response.status === 200) {
          dispatch({ type: "SET_VALUE", payload: response.data });
        }
      })
      .catch((error) => console.log(`Error: ${error}`));
  };

  const handleTokenizeText = () => {
    dispatch({
      type: "SET_VALUE",
      payload: {
        tokenizeTextId: state.tokenizeTextId == textId ? null : textId,
      },
    });
  };

  return (
    <Grid
      item
      container
      justifyContent="space-between"
      id={`text-container-${textIndex}`}
      p={4}
    >
      {/* Document index */}
      <Grid
        item
        xs={1}
        container
        justifyContent="top"
        direction="column"
        alignItems="center"
      >
        <Box
          sx={{
            borderRight: "1px solid",
            borderColor: grey[300],
            cursor: "help",
          }}
          p={1}
        >
          <Tooltip
            title={`${
              text.identifiers === undefined
                ? "No external id"
                : text.identifiers.join(", ")
            }`}
            placement="left-start"
          >
            <Typography variant="button">
              {textIndex + 1 + (state.pageNumber - 1) * state.pageLimit}
            </Typography>
          </Tooltip>
        </Box>
      </Grid>
      {/* Document rendered as tokens*/}
      <Grid item xs={10}>
        {state.showReferences && (
          <Typography variant="caption" sx={{ color: grey[400] }} p={0.5}>
            {text.reference}
          </Typography>
        )}
        {state.tokenizeTextId == textId ? (
          <TokenizedText textId={textId} tokens={text.tokens} />
        ) : (
          <Text text={text} textId={textId} />
        )}
      </Grid>
      {/* Interactive Tray (save, relation indicator, etc.s) */}
      <Grid
        item
        xs={1}
        container
        justifyContent="top"
        alignItems="center"
        direction="column"
      >
        <Stack
          direction="column"
          spacing={1}
          m={0}
          p={1}
          sx={{ borderLeft: "1px solid", borderColor: grey[300] }}
        >
          <Stack direction="row">
            <IconButton
              size="small"
              title="Click to tokenize"
              onClick={handleTokenizeText}
            >
              <JoinFullIcon
                fontSize="inherit"
                sx={{
                  color:
                    state.tokenizeTextId != null &&
                    state.tokenizeTextId !== textId &&
                    grey[300],
                }}
              />
            </IconButton>
            <IconButton
              size="small"
              title={text.saved ? "Click to unsave" : "Click to save"}
              onClick={() => handleSave(textId, !text.saved)}
            >
              <SaveIcon
                fontSize="inherit"
                sx={{ color: text.saved ? teal[300] : orange[300] }}
              />
            </IconButton>
            {/* <FlagComponent /> */}
            <IconButton
              size="small"
              title={`Original document: ${text.original}`}
            >
              <TextSnippetIcon fontSize="inherit" />
            </IconButton>
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
};

const FlagComponent = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        size="small"
        title="Click to flag this document"
        onClick={handleClick}
      >
        <FlagIcon fontSize="inherit" sx={{ color: grey[400] }} />
      </IconButton>
      <Menu
        id="flag-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleClose}>TBC</MenuItem>
      </Menu>
    </>
  );
};

const TokenizedText = ({ textId, tokens }) => {
  const [state, dispatch] = useContext(CleanerContext);

  const [valid, setValid] = useState(false);
  const [tokenIndexes, setTokenIndexes] = useState(new Set());
  const [tokenIndexGroups, setTokenIndexGroups] = useState([]);

  const handleIndex = (index) => {
    if (tokenIndexes.has(index)) {
      setTokenIndexes((prev) => new Set([...prev].filter((x) => x !== index)));
    } else {
      setTokenIndexes((prev) => new Set(prev.add(index)));
    }
  };

  useEffect(() => {
    const indexes = Array.from(tokenIndexes).sort((a, b) => {
      return a - b;
    });

    // console.log("indexes", indexes);

    const groups = indexes.reduce((r, n) => {
      // https://stackoverflow.com/questions/47906850/javascript-group-the-numbers-from-an-array-with-series-of-consecutive-numbers
      const lastSubArray = r[r.length - 1];
      if (!lastSubArray || lastSubArray[lastSubArray.length - 1] !== n - 1) {
        r.push([]);
      }
      r[r.length - 1].push(n);
      return r;
    }, []);
    setTokenIndexGroups(groups);
    // console.log("groups", groups);
    // Check all sub arrays are greater than 1 in length
    const validSelection = groups.filter((l) => l.length === 1).length === 0;
    // console.log("validSelection", validSelection);
    setValid(validSelection);
  }, [tokenIndexes]);

  const handleReset = () => {
    setTokenIndexes(new Set());
  };

  const handleTokenize = async () => {
    axios
      .patch("/api/text/tokenize", {
        textId: textId,
        indexGroupsTC: tokenIndexGroups,
      })
      .then((response) => {
        if (response.status === 200) {
          dispatch({ type: "TOKENIZE", payload: response.data });
        }
      })
      .catch((error) => console.log(`Error: ${error}`));

    handleReset();
  };

  return (
    <div>
      <Box
        key={`tokenize-text-${textId}`}
        sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}
      >
        {tokens &&
          Object.keys(tokens).map((tokenIndex) => {
            const token = tokens[tokenIndex];
            const color = tokenIndexes.has(parseInt(tokenIndex))
              ? green[500]
              : yellow[500];
            const width = getTokenWidth(token.currentValue);

            return (
              <Typography
                sx={{
                  textAlign: "center",
                  backgroundColor: alpha(color, 0.75),
                  width: width,
                }}
                onClick={() => handleIndex(parseInt(tokenIndex))}
              >
                {token.currentValue}
              </Typography>
            );
          })}
      </Box>
      <Stack direction="row">
        <Button
          size="small"
          disabled={tokenIndexes.size <= 1 || !valid}
          onClick={handleTokenize}
        >
          Apply
        </Button>
        <Button
          size="small"
          disabled={tokenIndexes.size === 0}
          onClick={handleReset}
        >
          Clear
        </Button>
      </Stack>
    </div>
  );
};
