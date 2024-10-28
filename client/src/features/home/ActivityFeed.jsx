/**
 * The activity feed will contain timestamped activities including - documents being flagged and comments being made.
 *
 * TODO: have 'show more' at the bottom of the scroll to load more items...
 */

import {
  Box,
  List,
  ListItem,
  Avatar,
  Typography,
  Stack,
  Divider,
  ListItemAvatar,
  ListItemText,
  Link as MuiLink,
  Skeleton,
  Paper,
} from "@mui/material";
import { Link } from "react-router-dom";
import moment from "moment";
import { useAuth0 } from "@auth0/auth0-react";

const ActivityFeed = ({ data, loading }) => {
  return (
    <Box as={Paper} variant="outlined" height="100%">
      {loading ? (
        <Skeleton variant="rectangular" height="100%" width="100%" />
      ) : (
        <>
          <Box sx={{ textAlign: "center" }} p={2}>
            <Typography variant="button">
              Activity Feed ({data?.length ?? 0})
            </Typography>
          </Box>
          <Divider />
          {data.length === 0 ? (
            <Box p={2} sx={{ textAlign: "center" }}>
              <Typography>No activity detected</Typography>
            </Box>
          ) : (
            <List
              sx={{
                width: "100%",
                height: "calc(100vh - 300px)",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {data
                ?.sort(
                  (a, b) => new Date(b.created_at) - new Date(a.created_at)
                )
                .map((item, index) => (
                  <ListItem alignItems="flex-start">
                    <ActivityListItem item={item} index={index} />
                  </ListItem>
                ))}
            </List>
          )}
        </>
      )}
    </Box>
  );
};

const ActivityListItem = ({ item, index }) => {
  const { user } = useAuth0();
  const username = user["https://example.com/username"];

  const getMessage = (item, username) => {
    const createdBy =
      username && item.created_by === username ? "You" : item.created_by;

    switch (item.activity_type) {
      case "flag":
        return (
          <>
            <strong>{createdBy}</strong>
            {" added "}
            <strong>{item.state}</strong>
            {" flag to dataset item"}
          </>
        );

      case "comment":
        return (
          <>
            <strong>{createdBy}</strong>
            {" posted the comment "}
            <strong>{item.text}</strong>
          </>
        );

      default:
        return null;
    }
  };

  const message = getMessage(item, username);

  return (
    <ListItem alignItems="flex-start" key={`activity-list-item-${index}`}>
      <ListItemAvatar>
        <Avatar alt={item.created_by}>{item.created_by[0]}</Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <>
            <Typography
              sx={{
                display: "inline",
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
              component="span"
              variant="body2"
              color="text.primary"
            >
              {message}
            </Typography>
          </>
        }
        secondary={
          <>
            {moment.utc(item.created_at).fromNow()}
            {" • "}
            <MuiLink
              component={Link}
              to={`/dashboard/${item.project_id}/overview`}
              title="Click to go to this project"
            >
              Project {item.project_name}
            </MuiLink>
            {" • "}
            <MuiLink
              component={Link}
              to={`/annotation/${item.project_id}?page=1&dataset_item_ids=${item.dataset_item_id}`}
            >
              view
            </MuiLink>
          </>
        }
      />
    </ListItem>
  );
};

export default ActivityFeed;
