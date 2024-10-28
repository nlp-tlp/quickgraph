import HomeIcon from "@mui/icons-material/Home";
import AddBoxIcon from "@mui/icons-material/AddBox";
import FolderIcon from "@mui/icons-material/Folder";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import FeedbackIcon from "@mui/icons-material/Feedback";
import SchemaIcon from "@mui/icons-material/Schema";
import ListIcon from "@mui/icons-material/List";
import { DocsLinks } from "../../../constants/general";

export const PrimaryNavItems = [
  {
    name: "Home",
    title: "Click to return home",
    icon: <HomeIcon />,
    href: "/home",
  },
  {
    name: "Projects Explorer",
    title: "Click to view all projects",
    icon: <FolderIcon />,
    href: "/projects-explorer",
    children: [
      {
        name: "New Project",
        title: "Click to create a new project",
        icon: <AddBoxIcon />,
        href: "/project-creator/details",
      },
    ],
  },
  {
    name: "Resources Explorer",
    title: "Click to view your resources",
    icon: <SchemaIcon />,
    href: "/resources-explorer",
    children: [
      {
        name: "New Resource",
        title: "Click to create a new resource",
        icon: <AddBoxIcon />,
        href: "/resource-creator/details",
      },
    ],
  },
  {
    name: "Datasets Explorer",
    title: "Click to view your datasets",
    icon: <ListIcon />,
    href: "/datasets-explorer",
    children: [
      {
        name: "New Dataset",
        title: "Click to create a new dataset",
        icon: <AddBoxIcon />,
        href: "/dataset-creator/details",
      },
    ],
  },
];

export const RedirectMenuItems = [
  {
    name: "Send Feedback",
    title: "Click to contact us or provide feedback",
    icon: <FeedbackIcon />,
    href: DocsLinks.feedback,
  },
  {
    name: "Documentation",
    title: "Click to open the documentation",
    icon: <TextSnippetIcon />,
    href: DocsLinks.home,
  },
];
