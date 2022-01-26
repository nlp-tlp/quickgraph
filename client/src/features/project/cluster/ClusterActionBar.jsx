import "./Cluster.css";
import history from "../../utils/history";
import { Button, Pagination } from "react-bootstrap";
import { BsChevronBarContract } from "react-icons/bs";
import { MdFileDownload } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import axios from "../../utils/api-interceptor";
import {
  resetFilters,
  selectProject,
  setFilters,
  selectFilters,
} from "../projectSlice";
import {
  setActiveCluster,
  selectActiveCluster,
  setShowCluster,
  setPage,
  setTextsIdle,
  selectPageBeforeViewChange,
} from "../../../app/dataSlice"   //"../text/textSlice";

export const ClusterActionBar = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const activeCluster = useSelector(selectActiveCluster);
  const pageBeforeViewChange = useSelector(selectPageBeforeViewChange);
  const filters = useSelector(selectFilters);

  const handleClusterPagination = (direction) => {
    // Note: Clusters will be expanded in this view
    if (activeCluster > 0 && [-1, 1].includes(direction)) {
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

  const handleClusterDownload = async () => {
    // Fetch results
    const response = await axios.post("/api/project/download/cluster/results", {
      project_id: project._id,
      cluster: activeCluster,
    });
    if (response.status === 200) {
      console.log(response.data);
      // Prepare for file download
      const fileName = `${project.name}_c${activeCluster}_annotations`;
      const json = JSON.stringify(response.data, null, 4);
      const blob = new Blob([json], { type: "application/json" });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName + ".json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
            {activeCluster > 1 && (
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
      {/* <Button
        id="close-btn"
        size="sm"
        variant="secondary"
        onClick={handleClusterClose}
      >
        <BsChevronBarContract style={{ fontWeight: "bold" }} />
      </Button> */}
    </div>
  );
};
