import {
  Stack,
  Typography,
  CircularProgress,
  Box,
  OutlinedInput,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { marked } from "marked";
import { useContext } from "react";
import { ProjectContext } from "../../../../shared/context/ProjectContext";

const MarkdownPreview = ({ markdown }) => {
  return (
    <Box p={2} sx={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>
      <Typography dangerouslySetInnerHTML={{ __html: marked(markdown) }} />
    </Box>
  );
};

const Guidelines = () => {
  const { state } = useContext(ProjectContext);

  if (state.loading) {
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
          <Typography>Fetching guidlines</Typography>
          <CircularProgress size={24} />
        </Stack>
      </Box>
    );
  }

  if (state.guidelines.content === "") {
    return (
      <Box p={2} display="flex" alignItems="center" justifyContent="center">
        <Typography>No guidelines authored yet.</Typography>
      </Box>
    );
  }

  return (
    <>
      <MarkdownPreview markdown={state.guidelines.content} />
      {/* <Divider /> */}
      {/* <Box p={2} display="flex" alignItems="center" justifyContent="center">
        <FormControl variant="outlined" sx={{ width: "100%" }}>
          <InputLabel htmlFor="outlined-comment">Comment</InputLabel>
          <OutlinedInput
            id="outlined-comment"
            type="text"
            multiline
            // value={submitting ? "Posting..." : text}
            // onChange={(e) => setText(e.target.value)}
            endAdornment={
              <InputAdornment position="end">
                {submitting ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconButton
                    aria-label="post discussion comment"
                    title="Click to post comment"
                    // disabled={text === ""}
                    edge="end"
                    color="primary"
                    // onClick={handlePost}
                  >
                    <SendIcon />
                  </IconButton>
                )}
              </InputAdornment>
            }
            label="Comment"
          />
        </FormControl>
      </Box> */}
    </>
  );
};

export default Guidelines;
