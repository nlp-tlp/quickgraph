import {
  Stack,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  Box,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AddTaskIcon from "@mui/icons-material/AddTask";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import { teal, red, orange } from "@mui/material/colors";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useContext, useState, useEffect } from "react";
import { ProjectContext } from "../../../shared/context/ProjectContext";

const RelationPopover = ({ textId, handleRelationPopoverClose }) => {
  const { state, handleApply, handleAccept, handleDelete } =
    useContext(ProjectContext);

  const [srcSurfaceForm, setSrcSurfaceForm] = useState("");
  const [tgtSurfaceForm, setTgtSurfaceForm] = useState("");

  useEffect(() => {
    const calculateSurfaceForm = (span) => {
      if (!span) return "";

      const tokens = state.texts[textId]?.tokens;
      if (!tokens) return "";

      return tokens
        .slice(span.start, span.end + 1)
        .map((t) => t.value)
        .join(" ");
    };

    const newSrcSurfaceForm = calculateSurfaceForm(state.sourceSpan);
    const newTrgSurfaceForm = calculateSurfaceForm(state.targetSpan);

    setSrcSurfaceForm(newSrcSurfaceForm);
    setTgtSurfaceForm(newTrgSurfaceForm);
  }, [state.sourceSpan, state.targetSpan, textId, state.texts]);

  const flatRelationOntology = state.flatRelationOntology
    .filter((r) => {
      // If constraints is null, include the relation
      if (!r.constraints) {
        return true;
      }

      // If the domain/range aren't defined, treat them as empty lists
      const domain = r.constraints.domain || [];
      const range = r.constraints.range || [];

      // If both domain and range are empty lists, include the relation
      if (domain.length === 0 && range.length === 0) {
        return true;
      }

      // Otherwise check both domain and range constraints
      return (
        domain.includes(state.sourceSpan.ontologyItemId) &&
        range.includes(state.targetSpan.ontologyItemId)
      );
    })
    .sort((a, b) => state.relationCounts[b.id] - state.relationCounts[a.id]);

  // `filteredRelations` are those that are shown as chips on entity spans.
  const filteredRelations =
    state.relations[textId] === undefined
      ? []
      : state.relations[textId].filter(
          (r) =>
            state.sourceSpan !== null &&
            r.source_id === state.sourceSpan.id &&
            r.target_id === state.targetSpan.id
        );

  const handleRejectDeleteAction = ({ applyAll, relationId }) => {
    handleDelete({
      markupId: relationId,
      params: { apply_all: applyAll },
      finallyFunction: handleRelationPopoverClose,
    });
  };
  const handleApplyAction = ({ applyAll, ontologyItemId }) => {
    const payload = {
      project_id: state.projectId,
      dataset_item_id: textId,
      extra_dataset_item_ids: Object.keys(state.texts),
      annotation_type: "relation",
      suggested: false,
      content: {
        ontology_item_id: ontologyItemId,
        source_id: state.sourceSpan.id,
        target_id: state.targetSpan.id,
      },
    };

    handleApply({
      body: payload,
      params: { apply_all: applyAll },
      finallyFunction: handleRelationPopoverClose,
    });
  };

  const handleAcceptAction = ({ applyAll, relationId }) => {
    handleAccept({
      markupId: relationId,
      params: { apply_all: applyAll },
      finallyFunction: handleRelationPopoverClose,
    });
  };

  const popoverMenuInfo = [
    {
      name: "accept-all",
      icon: <AddTaskIcon fontSize="inherit" />,
      suggested: true,
      color: teal[300],
      title: `Accept all suggested relations`,
      action: ({ ontologyItemId, relationId }) =>
        handleAcceptAction({ applyAll: true, relationId: relationId }),
      disabled: state.settings.disable_propagation,
    },
    {
      name: "accept-one",
      icon: <CheckCircleOutlineIcon fontSize="inherit" />,
      suggested: true,
      color: teal[500],
      title: `Accept this suggested relation`,
      action: ({ ontologyItemId, relationId }) =>
        handleAcceptAction({ applyAll: false, relationId: relationId }),
    },
    {
      name: "apply-all",
      icon: <ContentPasteIcon fontSize="inherit" />,
      suggested: false,
      color: teal[500],
      title: `Apply relation across entire project`,
      action: ({ ontologyItemId, relationId }) =>
        handleApplyAction({ applyAll: true, ontologyItemId: ontologyItemId }),
      disabled: state.settings.disable_propagation,
    },
    {
      name: "apply-one",
      icon: <CheckCircleOutlineIcon fontSize="inherit" />,
      suggested: false,
      color: teal[500],
      title: `Apply this relation`,
      action: ({ ontologyItemId, relationId }) =>
        handleApplyAction({ applyAll: false, ontologyItemId: ontologyItemId }),
    },
    {
      name: "delete-one",
      icon: <DeleteIcon fontSize="inherit" />,
      suggested: false,
      color: orange[500],
      title: `Delete this relation`,
      action: ({ ontologyItemId, relationId }) =>
        handleRejectDeleteAction({ applyAll: false, relationId: relationId }),
    },
    {
      name: "delete-all",
      icon: <DeleteSweepIcon fontSize="inherit" />,
      suggested: false,
      color: red[500],
      title: `Delete all relations`,
      action: ({ ontologyItemId, relationId }) =>
        handleRejectDeleteAction({ applyAll: true, relationId: relationId }),
      disabled: state.settings.disable_propagation,
    },
    {
      name: "reject-one",
      icon: <DeleteIcon fontSize="inherit" />,
      suggested: true,
      color: orange[500],
      title: `Reject this suggested relation (entities will persist)`,
      action: ({ ontologyItemId, relationId }) =>
        handleRejectDeleteAction({ applyAll: false, relationId: relationId }),
    },
    {
      name: "reject-all",
      icon: <DeleteSweepIcon fontSize="inherit" />,
      suggested: true,
      color: red[500],
      title: `Reject all suggested relations (entities will persist)`,
      action: ({ ontologyItemId, relationId }) =>
        handleRejectDeleteAction({ applyAll: true, relationId: relationId }),
      disabled: state.settings.disable_propagation,
    },
  ];

  return (
    <>
      <Box p={2}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography fontWeight={500} fontSize={14}>
            Relations
          </Typography>
          <Chip
            label="esc"
            sx={{ fontWeight: 700, fontSize: 12 }}
            onClick={handleRelationPopoverClose}
            variant="outlined"
            clickable
            color="primary"
          />
        </Stack>
        <Stack direction="column">
          <Typography fontSize={12}>source: {srcSurfaceForm}</Typography>
          <Typography fontSize={12}>target: {tgtSurfaceForm}</Typography>
        </Stack>
      </Box>
      <Divider />
      <Stack
        direction="column"
        spacing={1}
        sx={{ maxHeight: 200, overflowY: "auto", width: 400, pb: 1 }}
      >
        {flatRelationOntology.map((relation) => {
          // `matchedRelations` filters the relation ontology down to those that have been applied between the src/tgt entities
          // Note: `relation.id` is the ontology_item_id.
          const matchedRelations = filteredRelations.filter(
            (r) => r.ontology_item_id === relation.id
          );
          const hasRelation = matchedRelations.length > 0;
          const hasSuggestedRelation = hasRelation
            ? matchedRelations.filter((r) => r.suggested).length > 0
            : hasRelation;

          const matchedRelationMap = Object.assign(
            {},
            ...matchedRelations.map((r) => ({ [r.ontology_item_id]: r.id }))
          );

          return (
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={2}
              key={relation.id}
              pt={2}
            >
              <Stack direction="row" alignItems="center" spacing={1} pl={1}>
                {hasRelation ? (
                  <RadioButtonCheckedIcon fontSize="0.5rem" />
                ) : (
                  <RadioButtonUncheckedIcon fontSize="0.5rem" />
                )}
                <Stack directon="column" justifyContent="center">
                  <Typography variant="body2">
                    {relation.fullname !== relation.name &&
                      relation.fullname.replace(relation.name, "")}
                  </Typography>
                  <Typography variant="subtitle2">
                    {relation.fullname !== relation.name
                      ? relation.name
                      : relation.fullname}
                  </Typography>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={1}>
                {popoverMenuInfo
                  .filter(
                    (item) =>
                      item.suggested === hasSuggestedRelation ||
                      item.suggested === null
                  )
                  .map((item) => (
                    <Tooltip
                      title={
                        item.disabled ? `Disabled - ${item.title}` : item.title
                      }
                      placement="bottom"
                    >
                      <div>
                        <IconButton
                          key={`relation-tooltip-btn-${item.name}`}
                          id={`relation-tooltip-btn-${item.name}`}
                          size="small"
                          sx={{ color: item.color }}
                          onClick={() =>
                            item.action({
                              ontologyItemId: relation.id,
                              relationId: matchedRelationMap[relation.id],
                            })
                          }
                          disabled={
                            item.disabled ||
                            (!hasRelation && item.name.startsWith("delete")) ||
                            (hasRelation && item.name.startsWith("apply"))
                          }
                        >
                          {item.icon}
                        </IconButton>
                      </div>
                    </Tooltip>
                  ))}
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </>
  );
};

export default RelationPopover;
