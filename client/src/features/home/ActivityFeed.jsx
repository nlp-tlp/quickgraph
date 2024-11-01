import {
  Box,
  List,
  ListItem,
  Avatar,
  Typography,
  Divider,
  ListItemAvatar,
  ListItemText,
  Link as MuiLink,
  Button,
  Paper,
} from "@mui/material";
import { Link } from "react-router-dom";
import moment from "moment";
import { useAuth } from "../../shared/context/AuthContext";
import { useState, useMemo } from "react";

const ITEMS_PER_PAGE = 20;

const ActivityFeed = ({ data = [] }) => {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Sort data by most recent first and memoize to prevent unnecessary re-sorting
  const sortedActivities = useMemo(() => {
    return [...data].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [data]);

  // Get current slice of data to display
  const displayedActivities = sortedActivities.slice(0, displayCount);

  // Check if there's more data to show
  const hasMore = displayCount < sortedActivities.length;

  const handleShowMore = () => {
    setDisplayCount((prevCount) =>
      Math.min(prevCount + ITEMS_PER_PAGE, sortedActivities.length)
    );
  };

  return (
    <Box
      as={Paper}
      variant="outlined"
      height="600px"
      display="flex"
      flexDirection="column"
    >
      <Box sx={{ textAlign: "center" }} p={2}>
        <Typography variant="button">
          Activity Feed ({sortedActivities.length})
        </Typography>
      </Box>

      <Divider />

      {sortedActivities.length === 0 ? (
        <Box p={2} sx={{ textAlign: "center" }}>
          <Typography>No activity detected</Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" height="100%">
          <List
            sx={{
              width: "100%",
              overflowY: "auto",
              flex: 1,
            }}
          >
            {displayedActivities.map((item, index) => (
              <ActivityListItem
                key={`activity-${index}`}
                item={item}
                index={index}
              />
            ))}
          </List>

          {hasMore && (
            <Box
              p={2}
              sx={{
                textAlign: "center",
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Button
                onClick={handleShowMore}
                variant="text"
                sx={{ minWidth: 120 }}
              >
                Show More
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const ActivityListItem = ({ item, index }) => {
  const { user } = useAuth();
  const username = user?.username ?? "";

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
    <ListItem alignItems="flex-start">
      <ListItemAvatar>
        <Avatar alt={item.created_by}>{item.created_by[0]}</Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
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
