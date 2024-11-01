import {
  Typography,
  Stack,
  List,
  ListItem,
  IconButton,
  Divider,
  Box,
  Chip,
  Tooltip,
  ListItemText,
} from "@mui/material";
import {
  ArrowRight as ArrowRightIcon,
  Share as ShareIcon,
  AutoFixHigh as AutoFixHighIcon,
  Close as CloseIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useContext } from "react";
import { ProjectContext } from "../../../shared/context/ProjectContext";

const RelationViewer = ({ state }) => {
  const readableRelations =
    state.relations[state.currentTextSelected]?.map((r) => ({
      relation: r,
      source: state.entities[state.currentTextSelected].filter(
        (l) => l.id === r.source_id
      )[0],
      target: state.entities[state.currentTextSelected].filter(
        (l) => l.id === r.target_id
      )[0],
    })) ?? [];

  if (!readableRelations) {
    return <p>Loading...</p>;
  }

  return (
    <Box sx={{ minHeight: 120 }}>
      {readableRelations.length > 0 ? (
        <RelationStack relations={readableRelations} />
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          height={120}
          textAlign="center"
          p={2}
        >
          <Typography variant="body2" gutterBottom>
            {state.currentTextSelected === null
              ? "No dataset item selected - select one to reveal its relations"
              : "No relations exist for this item"}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const RelationStack = ({ relations }) => {
  const theme = useTheme();
  const { state, handleAccept, handleDelete } = useContext(ProjectContext);

  const handleRelationAction = (relation, action) => {
    if (action === "delete" || action === "reject") {
      handleDelete({ markupId: relation.id, params: { apply_all: false } });
      // deleteAction({ markupId: relation.id, params: { apply_all: false } });
    } else if (action === "accept") {
      handleAccept({ markupId: relation.id, params: { apply_all: false } });
      // acceptAction({ markupId: relation.id, params: { apply_all: false } });
    }
  };
  return (
    <List
      disablePadding
      sx={{
        width: "100%",
        overflowY: "auto",
      }}
      dense
    >
      {relations.map((r, index) => (
        <>
          <ListItem key={`relation-${r.relation.id}-${index}`}>
            <ListItem
              // title="Click to highlight this relation"
              // onClick={() => handleRelationAction(r)}
              sx={{
                bgcolor:
                  state.sourceSpan &&
                  state.sourceSpan.id === r.source.id &&
                  "neutral.light",
              }}
            >
              <Stack
                direction="column"
                alignItems="center"
                justifyContent="center"
                sx={{ width: 30 }}
                mr={4}
              >
                <IconButton
                  size="small"
                  title={`This is ${
                    r.relation.suggested ? "a suggested" : "an accepted"
                  } relation`}
                >
                  {r.relation.suggested ? (
                    <AutoFixHighIcon fontSize="inherit" />
                  ) : (
                    <ShareIcon fontSize="inherit" />
                  )}
                </IconButton>
                {r.relation.suggested ? (
                  <>
                    <IconButton
                      size="small"
                      title="Click to accept this suggested relation"
                      onClick={() => handleRelationAction(r.relation, "accept")}
                    >
                      <CheckCircleOutlineIcon
                        fontSize="inherit"
                        color="success"
                      />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Click to reject this suggested relation"
                      onClick={() => handleRelationAction(r.relation, "reject")}
                    >
                      <CloseIcon fontSize="inherit" color="error" />
                    </IconButton>
                  </>
                ) : (
                  <IconButton
                    size="small"
                    title="Click to remove this relation"
                  >
                    <CloseIcon
                      fontSize="inherit"
                      color="error"
                      onClick={() => handleRelationAction(r.relation, "delete")}
                    />
                  </IconButton>
                )}
              </Stack>
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      sx={{ flexWrap: "wrap", gap: 1 }}
                    >
                      <Tooltip
                        title={`${r.source.surface_form} (${r.source.name})`}
                        placement="right"
                      >
                        <Chip
                          label={r.source.surface_form}
                          size="small"
                          variant="outlined"
                          sx={{
                            width: 100,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "help",
                            color: r.source.color,
                            borderColor: r.source.color,
                          }}
                          key={`relation-source-entity-text-${r.source.id}`}
                        />
                      </Tooltip>
                      <ArrowRightIcon
                        sx={{ color: theme.palette.neutral.dark }}
                      />
                      <Tooltip title={r.relation.fullname} placement="right">
                        <Chip
                          label={r.relation.name}
                          size="small"
                          variant="contained"
                          color="primary"
                          sx={{
                            width: 100,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "help",
                          }}
                          key={`relation-label-${r.relation.id}`}
                        />
                      </Tooltip>
                      <ArrowRightIcon
                        sx={{ color: theme.palette.neutral.dark }}
                      />
                      <Tooltip
                        title={`${r.target.surface_form} (${r.target.name})`}
                        placement="right"
                      >
                        <Chip
                          label={r.target.surface_form}
                          size="small"
                          variant="outlined"
                          sx={{
                            width: 100,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "help",
                            color: r.target.color,
                            borderColor: r.target.color,
                          }}
                          key={`relation-target-entity-text-${r.target.id}`}
                        />
                      </Tooltip>
                    </Stack>
                  </Stack>
                }
              />
            </ListItem>
          </ListItem>
          <Divider component="li" />
          {/* {relations.length !== index + 1 && (
          )} */}
        </>
      ))}
    </List>
  );
};

export default RelationViewer;
