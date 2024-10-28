import { useState, useContext } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Stack,
  TextField,
  Typography,
  Grid,
  Paper,
} from "@mui/material";
import { marked } from "marked";
import { DashboardContext } from "../../../../shared/context/dashboard-context";
import moment from "moment";

const MarkdownPreview = ({ markdown }) => {
  return (
    <Box
      as={Paper}
      variant="outlined"
      p={2}
      maxHeight={723}
      minHeight={263}
      sx={{ overflowY: "auto", width: "100%" }}
    >
      <Typography dangerouslySetInnerHTML={{ __html: marked(markdown) }} />
    </Box>
  );
};

const Guidelines = () => {
  const { state, handleUpdateGuidelines } = useContext(DashboardContext);
  const [markdown, setMarkdown] = useState(state.guidelines.content ?? "");

  function handleMarkdownChange(event) {
    setMarkdown(event.target.value);
  }

  const handleUpdate = () => {
    handleUpdateGuidelines({ content: markdown });
  };

  return (
    <Container maxWidth="xl">
      <Grid item xs={12}>
        <Stack
          direction="row"
          justifyContent="right"
          spacing={2}
          alignItems="center"
        >
          <Chip
            label={`Updated: ${moment
              .utc(state.guidelines.updated_at)
              .fromNow()}`}
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={state.guidelines.content === markdown}
          >
            Update
          </Button>
        </Stack>
      </Grid>
      <Grid container spacing={4} direction="row">
        <Grid item xs={6}>
          <Stack
            direction="column"
            spacing={2}
            sx={{ textAlign: "left", display: "flex", flexDirection: "column" }}
          >
            <Typography fontSize={24} fontWeight={600}>
              Editor
            </Typography>
            <Typography fontSize={14}>
              Update the guidelines to enhance annotator consistency and
              productivity.
            </Typography>
            <TextField
              value={markdown}
              onChange={handleMarkdownChange}
              placeholder="Enter guidelines in markdown format here..."
              sx={{
                width: "100%",
                flexGrow: 1,
              }}
              multiline
              minRows={10}
              maxRows={30}
            />
          </Stack>
        </Grid>
        <Grid item xs={6}>
          <Stack
            direction="column"
            spacing={2}
            sx={{ textAlign: "left", display: "flex", flexDirection: "column" }}
          >
            <Typography fontSize={24} fontWeight={600}>
              Preview
            </Typography>
            <Typography fontSize={14}>
              This is what project annotators will see.
            </Typography>
            <Box sx={{ display: "flex", flexGrow: 1 }}>
              <MarkdownPreview markdown={markdown} />
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Guidelines;
