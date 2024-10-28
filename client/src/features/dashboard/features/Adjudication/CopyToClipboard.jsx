import React, { useEffect, useState } from "react";
import {
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Popover,
  Alert,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";

const CopyToClipboard = ({
  displayText = "",
  textToCopy = "",
  truncate = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  const handleCopyClick = (event) => {
    const textarea = document.createElement("textarea");
    textarea.textContent = textToCopy;
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      setIsCopied(true);
      setAnchorEl(event.currentTarget);
    } catch (err) {
      console.warn("Failed to copy text.", err);
    }

    document.body.removeChild(textarea);
  };

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => {
        setIsCopied(false);
        handleClose();
      }, 3000);
    }
  }, [isCopied]);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      justifyContent="space-between"
    >
      <Typography fontSize={14} title={textToCopy}>
        {truncate ? displayText.slice(0, 20) + "..." : displayText}
      </Typography>
      <Tooltip
        title={`Click to copy ${textToCopy} to clipboard`}
        placement="right"
      >
        <IconButton onClick={handleCopyClick}>
          {isCopied ? (
            <ThumbUpIcon sx={{ fontSize: 18 }} color="success" />
          ) : (
            <ContentCopyIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Alert severity="success">Content added to clipboard!</Alert>
      </Popover>
    </Stack>
  );
};

export default CopyToClipboard;
