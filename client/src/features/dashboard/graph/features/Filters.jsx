import "../Graph.css";
import { useState } from "react";
import { Button } from "react-bootstrap";
import "react-complex-tree/lib/style.css";
import { IoSearch } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { selectProject } from "../../../project/projectSlice";
import {
  selectAggregate,
  selectGraphData,
  selectNodeClasses,
  setFilters,
  resetFilters,
  selectGraphFilters,
  fetchGraph,
} from "../graphSlice";
import { useParams } from "react-router-dom";
import { FaUndo } from "react-icons/fa";
import { FilterSelectHierarchy } from "./FilterSelectHierarchy";

// import { TreeSelect } from "./TreeSelect";

export const Filters = () => {
  const dispatch = useDispatch();
  const aggregate = useSelector(selectAggregate);
  const graphData = useSelector(selectGraphData);
  const nodeClasses = useSelector(selectNodeClasses);
  const filters = useSelector(selectGraphFilters);

  const project = useSelector(selectProject);

  const [entityData, setEntityData] = useState(
    project && project.entityOntology
  );
  const [relationData, setRelationData] = useState(
    project && project.relationOntology
  );

  const handleSearch = () => {
    // Triggers graph call
    console.log("Searching graph...");
    // dispatch(
    //   fetchGraph({ projectId: project._id, searchTerm: filters.search.value })
    // );
  };

  const handleFilterReset = () => {
    console.log("Resetting filter");
    dispatch(resetFilters());
    dispatch(fetchGraph({ projectId: project._id }));
  };

  return (
    <>
      <div id="graph-filter-container">
        <p id="graph-filter-title">Filters</p>
        <div id="graph-filter-items">
          <span
            style={{
              width: "100%",
              justifyContent: "center",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              id="graph-filter-search"
              type="text"
              placeholder="search graph"
              value={filters.search.value}
              onChange={(e) =>
                dispatch(
                  setFilters({
                    ...filters,
                    search: { ...filters.search, value: e.target.value },
                  })
                )
              }
            />
            <Button
              size="sm"
              style={{
                height: "1.5rem",
                width: "1.5rem",
                padding: "0rem",
                margin: "0",
              }}
              disabled={filters.search.value === ""}
              variant="secondary"
              onClick={handleSearch}
            >
              <IoSearch />
            </Button>
            <Button
              size="sm"
              style={{
                height: "1.5rem",
                width: "1.5rem",
                padding: "0rem",
                margin: "0",
              }}
              variant="secondary"
              id="graph-filter-undo-button"
              disabled={filters.search.value === ""}
              onClick={handleFilterReset}
            >
              <FaUndo />
            </Button>
          </span>
        </div>
      </div>
      <FilterSelectHierarchy ontology={relationData} rootName={"Relations"} />
    </>
  );
};
