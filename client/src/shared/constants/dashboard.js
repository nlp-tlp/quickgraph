import { FlagFilter, SaveStateFilters, QualityFilter } from "./api";

export const PreprocessingStepsMapping = {
  lowerCase: "Lower cased",
  removeDuplicates: "Duplicate documents removed",
  charsRemoved: "Characters removed from corpus",
};

export const OverviewMetricsMapping = {
  entities: {
    name: "Entities Created",
    title:
      "Count of agreed upon entities (silver and weak) created by annotators",
  },
  entityAgreement: {
    name: "Average Entity Agreement",
    title: "Average entity inter-annotator agreement",
  },
  overallAgreement: {
    name: "Overall Agreement",
    title: "Average overall inter-annotator agreement",
  },
  progress: {
    name: "Project Progress",
    title:
      "Progress made to date (only counts documents saved by the minimum number of annotators)",
  },
  relationAgreement: {
    name: "Average Relation Agreement",
    title: "Average relation inter-annotator agreement",
  },
  triples: {
    name: "Triples Created",
    title:
      "Count of agreed upon triples (silver and weak) created by annotators",
  },
};

export const DownloadFilterSelectDefaults = {
  iaa: 0,
  quality: 2,
  saved: 2,
  flags: [],
};

export const DownloadFilterSelectOptions = {
  quality: QualityFilter,
  saved: SaveStateFilters,
  flags: FlagFilter,
};
