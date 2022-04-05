import { Button, Form } from "react-bootstrap";
import { FaUndo } from "react-icons/fa";
import { IoSearch, IoInformationCircle } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { selectProject } from "../../../project/projectSlice";
import "../Graph.css";
import {
  fetchGraph,
  resetFilters,
  selectAggregate,
  selectGraphFilters,
  setAggregate,
  setFilters,
  selectFilterClasses,
} from "../graphSlice";
import { FilterSelectHierarchy } from "./FilterSelectHierarchy";

export const Filters = () => {
  const dispatch = useDispatch();
  const filterClasses = useSelector(selectFilterClasses);

  const project = useSelector(selectProject);
  const aggregate = useSelector(selectAggregate);

  const handleGraphAggregation = (aggregate) => {
    dispatch(setAggregate(aggregate));
    dispatch(fetchGraph({ projectId: project._id }));
  };

  console.log(filterClasses);

  if (!project || !filterClasses) {
    return <div>Loading...</div>;
  } else {
    return (
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
            padding: "0 0.5rem",
            alignItems: "center",
          }}
        >
          <Form>
            <Form.Check
              type="switch"
              id="aggregate-graph"
              title="Click to toggle between entity typing and relation extraction
              modes"
              label="Aggregate Graph"
              checked={aggregate}
              onClick={() => handleGraphAggregation(!aggregate)}
            />
          </Form>
          <IoInformationCircle
            title="The aggregate knowledge graph only shows: documents meeting the required minimum annotations, and accepted (silver) annotations. The graph is limited to 5000 nodes at once. The separated graph is currently limited to your own annotations."
            style={{
              marginLeft: "0.25rem",
              fontSize: "1.25rem",
              cursor: "help",
            }}
          />
        </div>
        <div id="graph-filter-container">
          <p id="graph-filter-title">Filters</p>
          <SearchBar />
          <p style={{ margin: "0.25rem", fontWeight: "bold" }}>Entities</p>
          <FilterSelectHierarchy
            ontology={filterClasses.entities}
            rootName={"Entities"}
          />
          <p style={{ margin: "0.25rem", fontWeight: "bold" }}>Relations</p>
          <FilterSelectHierarchy
            ontology={filterClasses.relations}
            rootName={"Relations"}
          />
        </div>
      </>
    );
  }
};

const SearchBar = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectGraphFilters);

  const project = useSelector(selectProject);
  const handleSearch = () => {
    // Triggers graph call
    console.log("Searching graph...");
    dispatch(
      fetchGraph({ projectId: project._id, searchTerm: filters.search.value })
    );
  };

  const handleFilterReset = () => {
    console.log("Resetting filter");
    dispatch(resetFilters());
    dispatch(fetchGraph({ projectId: project._id }));
  };

  return (
    <div id="graph-filter-items">
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <input
          id="graph-filter-search"
          type="text"
          placeholder="Search graph"
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
        <div style={{ marginRight: "0.25rem" }}>
          <Button
            size="sm"
            style={{
              height: "1.5rem",
              width: "1.5rem",
              padding: "0rem",
              marginRight: "0.25rem",
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
            }}
            variant="secondary"
            id="graph-filter-undo-button"
            disabled={filters.search.value === ""}
            onClick={handleFilterReset}
          >
            <FaUndo />
          </Button>
        </div>
      </span>
    </div>
  );
};
