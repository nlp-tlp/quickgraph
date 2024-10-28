export const DocsBaseURL =
  import.meta.env.VITE_DOC_BASE_URL ?? "https://docs.quickgraph.tech";

const createDocsURL = (path) => `${DocsBaseURL}${path}`;

export const DocsLinks = {
  home: createDocsURL("/"),
  profile: createDocsURL("/interface/account-settings"),
  feedback: createDocsURL("/contact"),
  datasets: createDocsURL("/category/datasets"),
  "terms-and-conditions": createDocsURL("/terms-and-conditions"),
  "privacy-policy": createDocsURL("/privacy-policy"),
  "early-tester-program": createDocsURL("/early-tester-program"),
  "resource-creator": {
    details: createDocsURL(
      "/interface/resources/resource-creator/step-1-details"
    ),
    editor: createDocsURL(
      "/interface/resources/resource-creator/step-2-editor"
    ),
    review: createDocsURL(
      "/interface/resources/resource-creator/step-3-review"
    ),
  },
  "resources-explorer": createDocsURL(
    "/interface/resources/resources-explorer"
  ),
  "resource-management": createDocsURL(
    "/interface/resources/resource-management"
  ),
  "dataset-management": createDocsURL("/interface/datasets/dataset-management"),
  "datasets-explorer": createDocsURL("/interface/datasets/datasets-explorer"),
  "projects-explorer": createDocsURL("/interface/projects/projects-explorer"),
  "project-creator": {
    details: createDocsURL(
      "/interface/projects/project-creator/step-1-details"
    ),
    dataset: createDocsURL(
      "/interface/projects/project-creator/step-2-dataset"
    ),
    ontologies: createDocsURL(
      "/interface/projects/project-creator/step-3-ontologies"
    ),
    preannotation: createDocsURL(
      "/interface/projects/project-creator/step-4-preannotation"
    ),
    invitation: createDocsURL(
      "/interface/projects/project-creator/step-5-invitation"
    ),
    review: createDocsURL("/interface/projects/project-creator/step-6-review"),
  },
  dashboard: {
    summary: createDocsURL("/category/dashboard"),
    overview: createDocsURL("/interface/projects/dashboard/section-1-overview"),
    guidelines: createDocsURL(
      "/interface/projects/dashboard/section-2-guidelines"
    ),
    "knowledge-graph": createDocsURL(
      "/interface/projects/dashboard/section-3-knowledge-graph"
    ),
    annotators: createDocsURL(
      "/interface/projects/dashboard/section-4-annotators"
    ),
    adjudication: createDocsURL(
      "/interface/projects/dashboard/section-5-adjudication"
    ),
    settings: createDocsURL(
      "/interface/projects/dashboard/section-10-settings"
    ),
    downloads: createDocsURL(
      "/interface/projects/dashboard/section-6-downloads"
    ),
    resources: createDocsURL(
      "/interface/projects/dashboard/section-9-resources"
    ),
  },
};
