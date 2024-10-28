import { Typography, Stack } from "@mui/material";
import { FilterSelectHierarchy } from "./GraphFilterSelectHierarchy";

/**
 * HierarchyFilters component renders a list of hierarchy filters for ontologies.
 *
 * @param {Object} ontologies - The ontologies object with the structure: {ontologyType: [ontology items, ...], ...}.
 * @param {Object} filters - The current filters applied to the graph data.
 * @param {function} setFilters - The function to update the filters.
 * @returns {JSX.Element} The HierarchyFilters component.
 */
const HierarchyFilters = ({ ontologies = {}, filters, setFilters }) => {
  return (
    <>
      {Object.keys(ontologies).map((ontologyType) => {
        const ontologyItems = ontologies[ontologyType];

        // Only render Stack for ontologyType if there are ontology items
        if (ontologyItems && ontologyItems.length > 0) {
          return (
            <Stack key={ontologyType} direction="column">
              <Typography
                fontWeight={500}
                sx={{ textTransform: "capitalize" }}
                fontSize={14}
              >
                {ontologyType === "entity" ? "Nodes" : "Links"}
              </Typography>
              <FilterSelectHierarchy
                ontology={ontologyItems}
                filters={filters}
                setFilters={setFilters}
              />
            </Stack>
          );
        }

        return null;
      })}
    </>
  );
};
export default HierarchyFilters;
