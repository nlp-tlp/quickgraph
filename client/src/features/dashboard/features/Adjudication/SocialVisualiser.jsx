import React from "react";
import {
  Box,
  Divider,
  List,
  ListItem,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Skeleton,
} from "@mui/material";
import moment from "moment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const SocialVisualiser = ({ data, loading }) => {
  const [expanded, setExpanded] = React.useState(true);

  const handleChange = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <Accordion
        aria-controls="discussion-content"
        id="discussion-header"
        variant="outlined"
        expanded={expanded}
        onChange={handleChange}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>
            Discussion ({data?.social?.length ?? 0})
          </Typography>
        </AccordionSummary>
        <Divider />
        <AccordionDetails>
          <>
            {loading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : data?.social.length === 0 ? (
              <Box p={2} textAlign="center">
                <Typography variant="body2">
                  Found something interesting or have an issue? Post a comment
                  and let others know!
                </Typography>
              </Box>
            ) : (
              <List dense>
                {data?.social.map((comment) => (
                  <ListItem>
                    <Stack direction="column" spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography fontWeight={500}>
                          {comment.created_by}
                        </Typography>
                        <Typography variant="caption" color="grey">
                          {moment(comment.created_at).utc().fromNow()}
                        </Typography>
                      </Stack>
                      <Typography variant="body1">{comment.text}</Typography>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default SocialVisualiser;
