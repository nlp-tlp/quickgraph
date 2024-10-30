import { useState } from "react";
import {
  Divider,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Avatar,
  ListItemAvatar,
  OutlinedInput,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import useSocial from "../../../../shared/hooks/api/social";
import moment from "moment";
import { Chat as ChatIcon } from "@mui/icons-material";
import ErrorAlert from "../../../../shared/components/ErrorAlert";

const Social = ({ state, dispatch }) => {
  const [text, setText] = useState("");
  const datasetItemText = state.discussionDatasetItemText ?? "Loading...";
  const datasetItemId = state.discussionDatasetItemId;
  const { submitting, postComment, error } = useSocial({
    state,
    dispatch,
  });

  const handlePost = () => {
    postComment({
      text: text,
      context: "annotation",
      datasetItemId: datasetItemId,
    });
    setText("");
  };

  const comments = state.social[state.discussionDatasetItemId] ?? [];

  if (error) {
    return <ErrorAlert />;
  }

  console.log(state);

  if (!state.discussionDatasetItemId) {
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
          <Typography>Click on the discussion icon of an item</Typography>
          <Chip
            label="Discussion"
            size="small"
            icon={<ChatIcon />}
            color="primary"
            variant="outlined"
          />
          <Typography>
            to start a discussion or view an existing one.
          </Typography>
        </Stack>
      </Box>
    );
  }

  // if (!state.discussionDatasetItemId) {
  //   return (
  //     <Stack direction="column" alignItems="center" spacing={2}>
  //       <Typography>Fetching socials</Typography>
  //       <CircularProgress size={24} />
  //     </Stack>
  //   );
  // }
  return (
    <>
      <Box p={2}>
        <Typography
          variant="body2"
          title={datasetItemText}
          sx={{ cursor: "help" }}
        >
          {datasetItemText.slice(0, 150)}
          {datasetItemText.length >= 150 ? "..." : ""}
        </Typography>
      </Box>
      <Divider />
      <Box p={2} sx={{ height: "calc(100vh - 244px)", overflowY: "auto" }}>
        {comments.length === 0 ? (
          <Box p={2} textAlign="center">
            <Typography variant="body2">
              Found something interesting or have an issue? Post a comment and
              let others know!
            </Typography>
          </Box>
        ) : (
          <List dense>
            {comments.map((comment) => (
              <CommentListItem
                key={`comment-list-item-${comment._id}`}
                state={state}
                dispatch={dispatch}
                comment={comment}
              />
            ))}
          </List>
        )}
      </Box>
      <Divider />
      <Box p={2} display="flex" alignItems="center" justifyContent="center">
        <FormControl variant="outlined" sx={{ width: "100%" }}>
          <InputLabel htmlFor="outlined-comment">
            {state.settings.disable_discussion ? "Disabled" : "Comment"}
          </InputLabel>
          <OutlinedInput
            id="outlined-comment"
            type="text"
            multiline
            value={submitting ? "Posting..." : text}
            onChange={(e) => setText(e.target.value)}
            maxRows={2}
            disabled={state.settings.disable_discussion}
            endAdornment={
              <InputAdornment position="end">
                {submitting ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconButton
                    aria-label="post discussion comment"
                    title="Click to post comment"
                    disabled={text === ""}
                    edge="end"
                    color="primary"
                    onClick={handlePost}
                  >
                    <SendIcon />
                  </IconButton>
                )}
              </InputAdornment>
            }
            label={state.settings.disable_discussion ? "Disabled" : "Comment"}
          />
        </FormControl>
      </Box>
    </>
  );
};

const CommentListItem = ({ state, dispatch, comment }) => {
  const { deleteComment, deleting } = useSocial({ state, dispatch });

  return (
    <ListItem
      alignItems="flex-start"
      key={`comment-list-item-${comment._id}`}
      secondaryAction={
        comment.read_only ? null : (
          <IconButton
            edge="end"
            aria-label="delete"
            size="small"
            title="Click to delete this comment"
            onClick={() =>
              deleteComment({
                datasetItemId: comment.dataset_item_id,
                commentId: comment._id,
              })
            }
          >
            {deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          </IconButton>
        )
      }
    >
      <ListItemAvatar>
        <Avatar alt={comment.created_by}>{comment.created_by[0]}</Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={comment.created_by}
        secondary={
          <>
            <Typography
              sx={{ display: "inline" }}
              component="span"
              variant="body2"
              color="text.primary"
            >
              {moment.utc(comment.updated_at).fromNow()}
            </Typography>
            {" — "}
            {comment.text}
          </>
        }
      />
    </ListItem>
  );
};

export default Social;
