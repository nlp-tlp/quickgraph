import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Stack,
  Chip,
  Tooltip,
  Box,
  Alert,
} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useTheme } from "@mui/material/styles";

const RelationList = ({ itemHasRelations, entities, relations }) => {
  const theme = useTheme();

  const readableRelations =
    relations
      .map((r) => ({
        relation: r,
        source: {
          ...r.source,
          ...entities.filter(
            (e) =>
              e.start === r.source.start &&
              e.end === r.source.end &&
              e.ontology_item_id === r.source.ontology_item_id
          )[0],
        },
        target: {
          ...r.target,
          ...entities.filter(
            (e) =>
              e.start === r.target.start &&
              e.end === r.target.end &&
              e.ontology_item_id === r.target.ontology_item_id
          )[0],
        },
      }))
      .sort((a, b) =>
        a.source.surface_form.localeCompare(b.source.surface_form)
      ) ?? [];

  return (
    <>
      {relations.length === 0 && itemHasRelations ? (
        <Box p={2}>
          <Alert severity="warning" variant="outlined">
            No relations have been agreed upon
          </Alert>
        </Box>
      ) : relations.length === 0 ? (
        <Box p={2}>
          <Alert severity="info" variant="outlined">
            No relations have been created yet
          </Alert>
        </Box>
      ) : (
        <List dense>
          {readableRelations.map((r, index) => (
            <ListItem>
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="caption" fontWeight={500}>
                      {index + 1}.
                    </Typography>
                    <Stack direction="row" alignItems="center">
                      <Tooltip
                        title={`${r.source.surface_form} (${r.source.ontology_item_fullname})`}
                        arrow
                      >
                        <Chip
                          label={r.source.surface_form}
                          size="small"
                          variant="outlined"
                          sx={{
                            width: 120,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "help",
                          }}
                        />
                      </Tooltip>
                      <ArrowRightIcon
                        sx={{ color: theme.palette.neutral.dark }}
                      />
                      <Tooltip title={r.relation.ontology_item_fullname} arrow>
                        <Chip
                          label={r.relation.ontology_item_name}
                          size="small"
                          variant="contained"
                          color="primary"
                          sx={{
                            width: 160,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "help",
                          }}
                        />
                      </Tooltip>
                      <ArrowRightIcon
                        sx={{ color: theme.palette.neutral.dark }}
                      />
                      <Tooltip
                        title={`${r.target.surface_form} (${r.target.ontology_item_fullname})`}
                        arrow
                      >
                        <Chip
                          label={r.target.surface_form}
                          size="small"
                          variant="outlined"
                          sx={{
                            width: 120,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "help",
                          }}
                        />
                      </Tooltip>
                    </Stack>
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
};

export default RelationList;
