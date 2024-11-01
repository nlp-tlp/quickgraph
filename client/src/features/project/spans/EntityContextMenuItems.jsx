import { useContext } from "react";
import { Stack, IconButton } from "@mui/material";
import { teal, red, orange } from "@mui/material/colors";
import {
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  AddTask as AddTaskIcon,
  ContentPaste as ContentPasteIcon,
} from "@mui/icons-material";
import { ProjectContext } from "../../../shared/context/ProjectContext";

const EntityContextMenuItems = (props) => {
  const { textId, span, handlePopoverClose } = props;

  const {
    id: spanId,
    surface_form: spanSurfaceForm,
    ontology_item_id: spanOntologyItemId,
    start: spanStart,
    end: spanEnd,
    fullname: spanLabelFullName,
    suggested,
  } = span;

  const {
    state,
    handleDelete,
    handleApply,
    handleAccept,
    deleteMarkupOptimistically,
  } = useContext(ProjectContext);

  const handleDeleteAction = (applyAll) => {
    // deleteMarkupOptimistically({
    //   markupId: spanId,
    //   datasetItemId: textId,
    //   params: { apply_all: applyAll },
    //   finallyFunction: handlePopoverClose,
    // });
    handleDelete({
      markupId: spanId,
      datasetItemId: textId,
      params: { apply_all: applyAll },
      finallyFunction: handlePopoverClose,
    });
  };

  const handleAcceptAction = (applyAll) => {
    handleAccept({
      markupId: spanId,
      params: { apply_all: applyAll },
      finallyFunction: handlePopoverClose,
    });
  };

  const handleApplyAction = () => {
    const payload = {
      project_id: state.projectId,
      dataset_item_id: textId,
      extra_dataset_item_ids: Object.keys(state.texts),
      annotation_type: "entity",
      suggested: false,
      content: {
        ontology_item_id: spanOntologyItemId,
        start: spanStart,
        end: spanEnd,
        surface_form: spanSurfaceForm,
      },
    };

    handleApply({
      body: payload,
      params: { apply_all: true },
      finallyFunction: handlePopoverClose,
    });
  };

  const handleTouchStart = (action) => (event) => {
    event.preventDefault();
    action();
  };

  const popoverMenuInfo = [
    {
      name: "accept-all",
      icon: <AddTaskIcon fontSize="inherit" />,
      suggested: true,
      color: teal[300],
      title: `Accept all suggested annotations (${spanLabelFullName})`,
      action: () => handleAcceptAction(true),
      disabled: state.settings.disable_propagation,
    },
    {
      name: "accept-one",
      icon: <CheckCircleOutlineIcon fontSize="inherit" />,
      suggested: true,
      color: teal[500],
      title: `Accept this suggested annotation (${spanLabelFullName})`,
      action: () => handleAcceptAction(false),
    },
    {
      name: "apply-all",
      icon: <ContentPasteIcon fontSize="inherit" />,
      suggested: false,
      color: teal[500],
      title: `Apply annotation across entire project (${spanLabelFullName})`,
      action: () => handleApplyAction(),
      disabled: state.settings.disable_propagation,
    },
    {
      name: "delete-one",
      icon: <DeleteIcon fontSize="inherit" />,
      suggested: null,
      color: orange[500],
      title: `Delete this annotation (${spanLabelFullName})`,
      action: () => handleDeleteAction(false),
    },
    {
      name: "delete-all",
      icon: <DeleteSweepIcon fontSize="inherit" />,
      suggested: null,
      color: red[500],
      title: `Delete all identical annotations (${spanLabelFullName})`,
      action: () => handleDeleteAction(true),
      disabled: state.settings.disable_propagation,
    },
  ];

  return (
    <Stack direction="row" spacing={1} p={1}>
      {popoverMenuInfo
        .filter(
          (item) => item.suggested === suggested || item.suggested === null
        )
        .map((item, index) => (
          <IconButton
            title={item.disabled ? `Disabled - ${item.title}` : item.title}
            key={`entity-tooltip-btn-${item.name}`}
            size="small"
            sx={{ color: item.color }}
            onClick={item.action}
            onTouchStart={handleTouchStart(item.action)}
            disabled={item.disabled}
          >
            {item.icon}
          </IconButton>
        ))}
    </Stack>
  );
};

export default EntityContextMenuItems;
