import { Alert, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { DocsLinks } from "../constants/general";
import { useAuth } from "../context/AuthContext";

const Contexts = {
  "/home": {
    text: "New to QuickGraph or want to learn more?",
    anchorText: "Check out the documentation!",
    link: DocsLinks.home,
    type: "external",
    personalize: true,
    personalizeText: "Hi there",
  },
  "/profile": {
    text: "This is your account settings.",
    anchorText: "Check out the documentation to find out more!",
    link: DocsLinks.profile,
    type: "external",
  },
  "/datasets-explorer": {
    text: "Welcome to the Datasets Explorer! To learn more ",
    anchorText: "click here.",
    link: DocsLinks["datasets-explorer"],
    type: "external",
  },
  "/projects-explorer": {
    text: "Welcome to the Projects Explorer! To learn more ",
    anchorText: "click here.",
    link: DocsLinks["projects-explorer"],
    type: "external",
  },
  "/resources-explorer": {
    text: "Welcome to the Resources Explorer! To learn more ",
    anchorText: "click here.",
    link: DocsLinks["resources-explorer"],
    type: "external",
  },
  "/resource-management": {
    text: "Welcome to Resource Management! To learn more ",
    anchorText: "click here.",
    link: DocsLinks["resource-management"],
    type: "external",
  },
  "/dataset-management": {
    text: "Welcome to Dataset Management! To learn more ",
    anchorText: "click here.",
    link: DocsLinks["dataset-management"],
    type: "external",
  },
  "/dashboard/overview": {
    text: "Welcome to your projects dashboard! To learn more about this page ",
    anchorText: "click here.",
    link: DocsLinks.dashboard.overview,
    type: "external",
  },
  "/dashboard/guidelines": {
    text: "To learn more about how annotation guidelines work - ",
    anchorText: "click here.",
    link: DocsLinks.dashboard.guidelines,
    type: "external",
  },
  "/dashboard/knowledge-graph": {
    text: "To learn more about knowledge graphs in QuickGraph - ",
    anchorText: "click here.",
    link: DocsLinks.dashboard["knowledge-graph"],
    type: "external",
  },
  "/dashboard/annotators": {
    text: "To learn more about QuickGraph annotators - ",
    anchorText: "click here.",
    link: DocsLinks.dashboard.annotators,
    type: "external",
  },
  "/dashboard/adjudication": {
    text: "To learn more about adjudication in QuickGraph - ",
    anchorText: "click here.",
    link: DocsLinks.dashboard.adjudication,
    type: "external",
  },
  "/dashboard/downloads": {
    text: "To learn more about project downloads - ",
    anchorText: "click here.",
    link: DocsLinks.dashboard.downloads,
    type: "external",
  },
  "/dashboard/resources": {
    text: "To learn more about project resources - ",
    anchorText: "click here.",
    link: DocsLinks.dashboard.resources,
    type: "external",
  },
  "/dashboard/settings": {
    text: "To learn more about project settings - ",
    anchorText: "click here.",
    link: DocsLinks.dashboard.settings,
    type: "external",
  },
  "/project-creator/details": {
    text: "Enter the details of your project to get started. To find out more about QuickGraph projects ",
    anchorText: "click here.",
    link: DocsLinks["project-creator"].details,
    type: "external",
  },
  "/project-creator/dataset": {
    text: 'Simply click the checkmark icon on the right hand side of the row to select/unselect a dataset. Selecting an "annotated" dataset will automatically select the ontology or ontologies which were used on the dataset and preload annotations. To find out more about QuickGraphs preset datasets ',
    anchorText: "click here.",
    link: DocsLinks["project-creator"].dataset,
    type: "external",
  },
  "/project-creator/ontologies": {
    text: "Simply click the checkmark icon on the right hand side of the row to select/unselect a ontology resource. To learn more ",
    anchorText: "click here.",
    link: DocsLinks["project-creator"].ontologies,
    type: "external",
  },
  "/project-creator/preannotation": {
    text: "Simply click the checkmark icon on the right hand side of the row to select/unselect a preannotation resource. To find out more about QuickGraphs project preannotation ",
    anchorText: "click here.",
    link: DocsLinks["project-creator"].preannotation,
    type: "external",
  },
  "/project-creator/invite": {
    text: "Simply enter the usernames of collaborators separated by commas and click Add to invite them. To find out more ",
    anchorText: "click here.",
    link: DocsLinks["project-creator"].invitation,
    type: "external",
  },
  "/project-creator/review": {
    text: 'If all the boxes are green, its time to create your project! Otherwise, click the "fix" button to go back and make the necessary changes. Please note project creation may take a few minutes if the dataset is large or preannotation resources have been selected. To learn more, ',
    anchorText: "click here.",
    link: DocsLinks["project-creator"].review,
    type: "external",
  },
  "/resource-creator/details": {
    text: "Enter the details of your resource to get started. To find out more about QuickGraph resources ",
    anchorText: "click here.",
    link: DocsLinks["resource-creator"].details,
    type: "external",
  },
  "/resource-creator/editor": {
    text: "QuickGraph supports numerous resource formats depending on the resource type. To find out more ",
    anchorText: "click here.",
    link: DocsLinks["resource-creator"].editor,
    type: "external",
  },
  "/resource-creator/review": {
    text: 'If all the boxes are green, its time to create your resource! Otherwise, click the "fix" button to go back and make the necessary changes. Please note resource creation may take a few minutes if there are a large amount of items. Having trouble? Click ',
    anchorText: "here.",
    link: DocsLinks["resource-creator"].review,
    type: "external",
  },
  "/dataset-creator/details": {
    text: "Enter the details of your dataset to get started. To find out more about QuickGraph datasets ",
    anchorText: "click here.",
    link: DocsLinks.datasets,
    type: "external",
  },
  "/dataset-creator/editor": {
    text: "QuickGraph supports numerous dataset formats including simple newline separated text, pre-annotated content, and rich objects. To find out more ",
    anchorText: "click here.",
    link: DocsLinks.datasets,
    type: "external",
  },
  "/dataset-creator/preprocessing": {
    text: "Preprocessing your dataset can improve annotation speed and consistency by reducing duplication and redundancy. To find out more about QuickGraphs preprocessing options ",
    anchorText: "click here.",
    link: DocsLinks.datasets,
    type: "external",
  },
  "/dataset-creator/review": {
    text: 'If all the boxes are green, its time to create your dataset! Otherwise, click the "fix" button to go back and make the necessary changes. Please note dataset creation may take a few minutes if there are a large amount of items.',
  },
};

const InfoSnackbar = (props) => {
  const { user } = useAuth;
  const { location } = props;
  const context = Contexts[location];

  if (context === undefined) {
    return null;
  }

  let personalizeText;
  if (context.hasOwnProperty("personalize")) {
    const nickname = user?.nickname;
    if (nickname) {
      personalizeText = `${context.personalizeText}, ${nickname.replace(
        ".",
        " "
      )}! `;
    } else {
      personalizeText = `${context.personalizeText}!`;
    }
  }

  if (context === undefined) {
    return null;
  }

  let InnerComponent;
  if (context.type === "internal") {
    InnerComponent = (
      <Typography variant="paragraph">
        {personalizeText}
        {context.text} <Link to={context.link}>{context.anchorText}</Link>
      </Typography>
    );
  } else {
    InnerComponent = (
      <Typography variant="paragraph">
        {personalizeText}
        {context.text}{" "}
        <a href={context.link} target="_blank" rel="noreferrer">
          {context.anchorText}
        </a>
      </Typography>
    );
  }

  return (
    <Alert severity="info" variant={context.variant ?? "standard"}>
      {InnerComponent}
    </Alert>
  );
};

export default InfoSnackbar;
