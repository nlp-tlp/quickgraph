import React from "react";
import {
  Divider,
  Skeleton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import DummyAnnotatedText from "../../../../shared/components/DummyAnnotatedText";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const EntityVisualiser = ({
  data,
  loading,
  selectedAnnotators,
  entities,
  filterEntityData,
}) => {
  const [expanded, setExpanded] = React.useState(true);

  const handleChange = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <Accordion
        aria-controls="entity-content"
        id="entity-header"
        variant="outlined"
        expanded={expanded}
        onChange={handleChange}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Entities ({entities.length})</Typography>
        </AccordionSummary>
        <Divider />
        <AccordionDetails>
          {loading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            // selectedAnnotators.length === 0 ? (
            //   <DummyAnnotatedText
            //     tokens={data.tokens}
            //     entities={filterEntityData(data.entities, data.annotators)}
            //   />
            // ) :
            <DummyAnnotatedText tokens={data.tokens} entities={entities} />
          )}
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default EntityVisualiser;
