import { useDispatch, useSelector } from "react-redux";
import history from "../../utils/history";
import {
  selectFilters,
  setFilters,
  resetFilters,
  selectProject,
} from "../../project/projectSlice";
import { DropdownButton, Dropdown, Button } from "react-bootstrap";
import { IoSearch } from "react-icons/io5";
import { FaUndo } from "react-icons/fa";
import {
  setPage,
  setTextsIdle,
  setShowCluster,
  setActiveCluster,
} from "../../../app/dataSlice"; //"../../project/text/textSlice";

export const Filters = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);
  const project = useSelector(selectProject);

  const applyFilters = () => {
    dispatch(setPage(1));
    history.push(`/annotation/${project._id}/page=1`);
    dispatch(setTextsIdle());
  };

  const applyFilterReset = () => {
    dispatch(setShowCluster(false));
    dispatch(setActiveCluster(null));
    dispatch(resetFilters());
    dispatch(setPage(1));
    history.push(`/annotation/${project._id}/page=1`);
    dispatch(setTextsIdle());
  };

  const clusterFilterValue = Object.values(filters["cluster"].value)[0];

  return (
    <div className="navbar-filter-container">
      {filters && (
        <span style={{ margin: "0rem 0.5rem" }} title={filters["search"].title}>
          <input
            id="filter-search-input"
            placeholder="Search documents"
            value={filters["search"].value}
            onChange={(e) =>
              dispatch(
                setFilters({
                  ...filters,
                  search: {
                    ...filters["search"],
                    value: e.target.value,
                  },
                })
              )
            }
          />
        </span>
      )}
      {/* Cluster specific filter */}
      {filters && project.settings.performClustering && (
        <span className="navbar-filter-item" title={filters["cluster"].title}>
          <span>{filters["cluster"].name}:</span>
          <DropdownButton
            size="sm"
            id="filter-dropdown-button"
            // Cannot get capitalize to work on the title; mannually making it below.
            title={
              clusterFilterValue === "all"
                ? `${clusterFilterValue[0].toUpperCase()}${clusterFilterValue.slice(
                    1
                  )}`
                : clusterFilterValue.replace(/\|/g, " | ")
            }
          >
            {Object.keys(filters["cluster"].options).map((clusterNo) => (
              <Dropdown.Item
                href=""
                style={{
                  textTransform:
                    filters["cluster"].options[clusterNo] === "all" &&
                    "capitalize",
                  // backgroundColor: 'grey'
                }}
                onClick={(e) =>
                  dispatch(
                    setFilters({
                      ...filters,
                      cluster: {
                        ...filters["cluster"],
                        value: {
                          [clusterNo]: filters["cluster"].options[clusterNo],
                        },
                      },
                    })
                  )
                }
              >
                {filters["cluster"].options[clusterNo].replace(/\|/g, " | ")}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </span>
      )}
      {filters &&
        Object.keys(filters)
          .filter(
            (key) =>
              filters[key].display && key !== "search" && key !== "cluster"
          )
          .map((key) => {
            const filter = filters[key];
            return (
              <span
                style={{
                  margin: "0rem 0.5rem",
                  display: "flex",
                  alignItems: "center",
                }}
                title={filter.title}
              >
                <span>{filter.name}:</span>
                <DropdownButton
                  size="sm"
                  id="filter-dropdown-button"
                  // Cannot get capitalize to work on the title; mannually making it below.
                  title={`${filter.value[0].toUpperCase()}${filter.value.slice(
                    1
                  )}`}
                  // style={{textTransform: 'capitalize !important'}}
                >
                  {filter.options.map((option) => (
                    <Dropdown.Item
                      href=""
                      style={{ textTransform: "capitalize" }}
                      onClick={(e) =>
                        dispatch(
                          setFilters({
                            ...filters,
                            [key]: {
                              ...filters[key],
                              value: option,
                            },
                          })
                        )
                      }
                    >
                      {option}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
              </span>
            );
          })}

      <Button size="sm" id="filter-search-button" onClick={applyFilters}>
        <span style={{ display: "flex", alignItems: "center" }}>
          <IoSearch style={{ marginRight: "0.25rem" }} />
          Apply
        </span>
      </Button>
      <Button size="sm" id="filter-undo-button" onClick={applyFilterReset}>
        <FaUndo />
      </Button>
    </div>
  );
};
