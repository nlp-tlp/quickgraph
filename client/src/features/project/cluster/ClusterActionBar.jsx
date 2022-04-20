import { Pagination } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveCluster,
  setActiveCluster,
  setPage,
  setTextsIdle,
} from "../../../app/dataSlice";
import history from "../../utils/history";
import { selectFilters, selectProject, setFilters } from "../projectSlice";
import "./Cluster.css";

export const ClusterActionBar = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const activeCluster = useSelector(selectActiveCluster);
  const filters = useSelector(selectFilters);

  const handleClusterPagination = (direction) => {
    // Note: Clusters will be expanded in this view
    if (activeCluster >= 0 && [-1, 1].includes(direction)) {
      const newClusterNo = activeCluster + direction;
      // Page forward
      dispatch(setActiveCluster(newClusterNo));
      // Set pagination filter for cluster and set page to 1
      dispatch(
        setFilters({
          ...filters,
          cluster: {
            ...filters.cluster,
            value: { [newClusterNo]: filters.cluster.options[newClusterNo] },
          },
        })
      );
      dispatch(setPage(1));
      history.push(`/annotation/${project._id}/page=1`);
      dispatch(setTextsIdle());
    }
  };

  return (
    <div className="cluster-action-bar">
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "0.7rem",
              textAlign: "left",
              color: "#546e7a",
            }}
          >
            {filters.cluster.options[activeCluster].replace(/\|/g, " | ")}
          </span>
          <Pagination size="sm" style={{ padding: "0", margin: "0" }}>
            {activeCluster > 0 && (
              <Pagination.Prev onClick={() => handleClusterPagination(-1)} />
            )}
            <Pagination.Item active>C{activeCluster}</Pagination.Item>
            {
              activeCluster <
                Object.keys(filters.cluster.options).length - 2 && (
                <Pagination.Next onClick={() => handleClusterPagination(1)} />
              ) // -2 for current cluster and the 'all' placeholder
            }
          </Pagination>
        </div>
      </div>
    </div>
  );
};
