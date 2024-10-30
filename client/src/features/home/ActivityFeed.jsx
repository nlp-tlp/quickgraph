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
  Skeleton,
  Paper,
} from "@mui/material";
import { Link } from "react-router-dom";
import moment from "moment";
import { useAuth } from "../../shared/context/AuthContext";
import { useEffect, useState } from "react";

// Mock fetch function
const fetchActivities = async (page, limit) => {
  // Example implementation:
  // const response = await fetch(`/api/activities?page=${page}&limit=${limit}`);
  // const data = await response.json();
  // return { items: data.items, hasMore: data.hasMore };
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        items: [],
        hasMore: false,
      });
    }, 1000);
  });
};

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const result = await fetchActivities(1, ITEMS_PER_PAGE);
        setActivities(result.items);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleShowMore = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchActivities(nextPage, ITEMS_PER_PAGE);

      setActivities((prev) => [...prev, ...result.items]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Failed to load more activities:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Box
      as={Paper}
      variant="outlined"
      height="600px"
      display="flex"
      flexDirection="column"
    >
      {loading ? (
        <Skeleton variant="rectangular" height="100%" width="100%" />
      ) : (
        <>
          <Box sx={{ textAlign: "center" }} p={2}>
            <Typography variant="button">
              Activity Feed ({activities?.length ?? 0})
            </Typography>
          </Box>

          <Divider />

          {activities.length === 0 ? (
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
                {activities
                  ?.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                  )
                  .map((item, index) => (
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
                    disabled={loadingMore}
                    variant="text"
                    sx={{ minWidth: 120 }}
                  >
                    {loadingMore ? <CircularProgress size={24} /> : "Show More"}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </>
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
