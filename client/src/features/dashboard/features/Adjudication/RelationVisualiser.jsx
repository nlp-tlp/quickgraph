import React, { useState } from "react";
import {
  Divider,
  Skeleton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import RelationList from "../RelationList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const RelationVisualiser = ({ data, loading, entities, relations }) => {
  const [expanded, setExpanded] = useState(true);

  const handleChange = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <Accordion
        aria-controls="relation-content"
        id="relation-header"
        variant="outlined"
        expanded={expanded}
        onChange={handleChange}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>
            Relations ({relations.length})
          </Typography>
        </AccordionSummary>
        <Divider />
        <AccordionDetails>
          {loading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <RelationList
              itemHasRelations={Object.keys(data.relations).length !== 0}
              entities={entities}
              relations={relations}
            />
          )}
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default RelationVisualiser;
