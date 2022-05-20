import "./Cluster.css";
import "react-circular-progressbar/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";
import history from "../../utils/history";
import { selectFilters, selectProject, setFilters } from "../projectSlice";
import {
  selectClusterMetrics,
  selectPage,
  setActiveCluster,
  setTextsIdle,
  setPage,
  setPageBeforeViewChange,
  setShowCluster,
  selectTexts,
} from "../../../app/dataSlice";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import { teal } from "@mui/material/colors";

export const ClusterIcon = ({ textId }) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const filters = useSelector(selectFilters);
  const page = useSelector(selectPage);
  const clusterMetrics = useSelector(selectClusterMetrics);
  const texts = useSelector(selectTexts);
  const clusterNo = texts[textId].cluster;

  const handleClusterExpansion = () => {
    dispatch(setActiveCluster(clusterNo));
    dispatch(setPageBeforeViewChange(page));
    // Set pagination filter for cluster and set page to 1
    dispatch(
      setFilters({
        ...filters,
        cluster: {
          ...filters.cluster,
          value: { [clusterNo]: filters.cluster.options[clusterNo] },
        },
      })
    );
    dispatch(setPage(1));

    dispatch(setShowCluster(true));
    history.push(`/annotation/${project._id}/page=1`);
    dispatch(setTextsIdle());
  };

  const progress = Math.round(
    (clusterMetrics[clusterNo] / project.clusterDetails[clusterNo].count) * 100
  );

  return (
    <div
      style={{ width: "30px", height: "30px", cursor: "pointer" }}
      onClick={handleClusterExpansion}
      title={`Cluster ${clusterNo} (${project.clusterDetails[clusterNo].top_n_terms}): ${progress}% completed. Click to jump into cluster.`}
    >
      <CircularProgressbarWithChildren
        value={progress}
        maxValue={100}
        styles={buildStyles({
          pathColor: teal[700],
        })}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "12px",
            marginTop: "-5",
            userSelect: "none",
          }}
        >
          {project.clusterDetails[clusterNo].count}
        </div>
      </CircularProgressbarWithChildren>
    </div>
  );
};
