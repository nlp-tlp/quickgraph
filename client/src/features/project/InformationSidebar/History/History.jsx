import { useContext, useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Paper,
  Divider,
  IconButton,
  Stack,
  Collapse,
} from "@mui/material";
import { ProjectContext } from "../../../../shared/context/ProjectContext";
import moment from "moment";
import { pluralize } from "../../../../shared/utils/tools";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const mapping = (item) => {
  switch (item.action) {
    case "edit":
      return (
        <Typography fontSize={14}>
          <strong>Edited</strong> {item.count}{" "}
          {pluralize(item.annotation_type, item.count)}{" "}
          <span style={{ color: item.color }}>[{item.label_name}]</span>
        </Typography>
      );
    case "apply":
      return (
        <Typography fontSize={14}>
          <strong>Applied</strong> {item.count}{" "}
          {pluralize(item.annotation_type, item.count)}{" "}
          <span style={{ color: item.color }}>[{item.label_name}]</span>
        </Typography>
      );
    case "accept":
      return (
        <Typography fontSize={14}>
          <strong>Accepted</strong> {item.count}{" "}
          {pluralize(item.annotation_type, item.count)}{" "}
          <span style={{ color: item.color }}>[{item.label_name}]</span>
        </Typography>
      );
    case "delete":
      return (
        <Typography fontSize={14}>
          <strong>Deleted</strong> {item.count}{" "}
          {pluralize(item.annotation_type, item.count)}
        </Typography>
      );
    case "save":
      return (
        <Typography fontSize={14}>
          <strong>Modified save state</strong> of {item.count}{" "}
          {pluralize("item", item.count)}
        </Typography>
      );

    default:
      return null;
  }
};

const History = () => {
  const { state } = useContext(ProjectContext);
  const [open, setOpen] = useState(true);

  // console.log("history", state.history, state.history.size);

  return (
    <>
      <Box p={2} sx={{ textAlign: "left" }}>
        <Typography variant="button">Session History</Typography>
      </Box>
      <Divider flexItem />
      <Box
        p="0rem 1rem"
        sx={{
          maxHeight: "calc(100vh - 744px)",
          overflowY: "auto",
        }}
      >
        {state.history.size === 0 ? (
          <Box p={2} sx={{ textAlign: "center" }}>
            <Typography>No history</Typography>
          </Box>
        ) : (
          <List>
            {state.history.buffer
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((item, index) => (
                <>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            overflowWrap: "break-word",
                          }}
                        >
                          {mapping(item)}
                        </Typography>
                      }
                      secondary={moment(item.created_at).utc().fromNow()}
                    />
                  </ListItem>
                  {index !== state.history.size - 1 ? (
                    <Divider flexItem />
                  ) : null}
                </>
              ))}
          </List>
        )}
      </Box>
    </>
  );
};

export default History;
