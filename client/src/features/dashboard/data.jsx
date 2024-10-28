import Annotators from "./features/Annotators";
import Downloads from "./features/Downloads";
import Graph from "./features/Graph";
import Overview from "./features/Overview";
import Settings from "./features/Settings";
import Adjudication from "./features/Adjudication";
import Corrector from "./features/Corrector";
import Resources from "./features/Resources";
import Guidelines from "./features/Guidelines";
import BarChartIcon from "@mui/icons-material/BarChart";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import GroupIcon from "@mui/icons-material/Group";
import LayersIcon from "@mui/icons-material/Layers";
import DownloadIcon from "@mui/icons-material/Download";
import SettingsIcon from "@mui/icons-material/Settings";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import ArticleIcon from "@mui/icons-material/Article";
import HubIcon from "@mui/icons-material/Hub";
import GavelIcon from "@mui/icons-material/Gavel";
import SubjectIcon from "@mui/icons-material/Subject";
import { Navigate } from "react-router-dom";

export const getComponents = ({ state, dispatch }) => ({
  overview: {
    icon: <BarChartIcon />,
    title: "Overview",
    description: "View this projects overall progress",
    body: <Overview />,
    disabled: false,
    show: true,
    href: `/dashboard/${state.projectId}/overview`,
  },
  guidelines: {
    icon: <SubjectIcon />,
    title: "Guidelines",
    description: "View this projects annotation guidelines",
    body: <Guidelines />,
    disabled: false,
    show: true,
    href: `/dashboard/${state.projectId}/guidelines`,
  },
  "knowledge-graph": {
    icon: <BubbleChartIcon />,
    title: "Knowledge Graph",
    description:
      "View and interact with this projects annotation knowledge graph (only available for relation projects)",
    body: <Graph state={state} dispatch={dispatch} />,
    disabled: state.tasks && !state.tasks.relation,
    show: true,
    href: `/dashboard/${state.projectId}/knowledge-graph`,
  },
  annotators: {
    icon: <GroupIcon />,
    title: `Annotators ${
      state.annotators.length > 0
        ? "(" +
          state.annotators.filter((a) => a.state.toLowerCase() === "accepted")
            .length +
          ")"
        : ""
    }`,
    description: "Manage who can annotate this project",
    body: <Annotators annotators={state.annotators} />,
    disabled: false,
    show: state.userIsPM,
    href: `/dashboard/${state.projectId}/annotators`,
  },
  adjudication: {
    icon: <GavelIcon />,
    title: "Adjudication",
    description: "Review this projects annotations",
    body: <Adjudication />,
    disabled: false,
    show: true,
    href: `/dashboard/${state.projectId}/adjudication?page=1`,
  },
  corrector: {
    icon: <MonitorHeartIcon />,
    title: "Corrector",
    description: "hello world",
    body: <Corrector />,
    disabled: true,
    show: false,
  },
  downloads: {
    icon: <DownloadIcon />,
    title: "Downloads",
    description: "View and download annotation resources",
    body: <Downloads />,
    disabled: false,
    show: true,
    href: `/dashboard/${state.projectId}/downloads`,
  },
  dataset: {
    icon: <ArticleIcon />,
    title: `Dataset`,
    description: "View this projects dataset",
    body: <Navigate to={`/dataset-management/${state.datasetId}`} />,
    disabled: false,
    show: state.userIsPM,
    href: `/dataset-management/${state.datasetId}`,
  },
  resources: {
    icon: <HubIcon />,
    title: "Resources",
    description: "View or modify this projects resources",
    body: <Resources />,
    disabled: false,
    show: state.userIsPM,
    href: `/dashboard/${state.projectId}/resources`,
  },
  settings: {
    icon: <SettingsIcon />,
    title: "Settings",
    description: "Manage this projects settings",
    body: <Settings />,
    disabled: false,
    show: state.userIsPM,
    href: `/dashboard/${state.projectId}/settings`,
  },
});
