import { useState } from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import RelationViewer from "./RelationViewer";
import ShareIcon from "@mui/icons-material/Share";
import EntityHierarchy from "./EntityHierarchy";

const InteractiveAnnotationContainer = ({
  state,
  dispatch,
  open,
  demo = false,
}) => {
  const [expandedEntityIds, setExpandedEntityIds] = useState([]); // Used to persist the expanded state of the entity hierarchy.

  if (!state || !dispatch) return null;

  return (
    <List>
      {/* <Tooltip
        title={
          state.entityAnnotationMode
            ? "Click on items in the entity hierarchy to apply them to the selected token(s)"
            : "The relation viewer shows all created relations on the currently selected dataset item. Relations can be accepted, rejected or deleted here."
        }
        placement="right"
      >
        <ListItem sx={{ cursor: "help" }}>
          <ListItemIcon>
            {state.entityAnnotationMode ? <TouchAppIcon /> : <ShareIcon />}
          </ListItemIcon>
          <ListItemText
            primary={
              state.entityAnnotationMode
                ? "Entity Hierarchy"
                : `Relation Viewer ${
                    state.relations?.[state.currentTextSelected] !== undefined
                      ? "(" +
                        state.relations[state.currentTextSelected].length +
                        ")"
                      : ""
                  }`
            }
          />
        </ListItem>
      </Tooltip> */}
      {state.entityAnnotationMode ? (
        <EntityHierarchy
          expandedEntityIds={expandedEntityIds}
          setExpandedEntityIds={setExpandedEntityIds}
          open={open}
        />
      ) : (
        <RelationViewer
          state={state}
          dispatch={dispatch}
          open={open}
          demo={demo}
        />
      )}
    </List>
  );
};

export default InteractiveAnnotationContainer;
