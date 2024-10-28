import { alpha } from "@mui/material/styles";
import { Popover } from "@mui/material";
import RelationPopover from "./RelationPopover";
import EntityContextMenuItems from "./EntityContextMenuItems";
import MiscContextMenuItems from "./MiscContextMenuItems";

const ContextMenu = ({
  state,
  dispatch,
  anchorEl,
  setAnchorEl,
  textId,
  span,
}) => {
  const open = Boolean(anchorEl);

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleRelationPopoverClose = () => {
    dispatch({ type: "REMOVE_SOURCE_TARGET_RELS" });
    setAnchorEl(null);
  };

  const hasSuggestedRelation =
    state.relations &&
    Object.keys(state.relations).includes(textId) &&
    state.relations[textId].filter((r) => r.suggested).length > 0;

  if (state.entityAnnotationMode) {
    const labelColor = span.color;

    return (
      <Popover
        id="entity-span-mouse-over-popover"
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        elevation={0}
        PaperProps={{
          sx: {
            display: "flex",
            border: "1px solid",
            borderColor: alpha(labelColor, 0.6125),
          },
        }}
      >
        <EntityContextMenuItems
          textId={textId}
          span={span}
          handlePopoverClose={handlePopoverClose}
        />
        <MiscContextMenuItems
          span={span}
          textId={textId}
          handlePopoverClose={handlePopoverClose}
        />
      </Popover>
    );
  } else {
    return (
      <Popover
        id="relation-span-mouse-over-popover"
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        elevation={0}
        PaperProps={{
          sx: {
            border: "1px solid",
            // borderColor: alpha(labelColor, 0.6125),
          },
        }}
      >
        <RelationPopover
          state={state}
          dispatch={dispatch}
          handleRelationPopoverClose={handleRelationPopoverClose}
          textId={textId}
        />
      </Popover>
    );
  }
};

export default ContextMenu;
