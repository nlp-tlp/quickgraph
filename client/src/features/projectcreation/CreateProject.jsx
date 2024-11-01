import { useEffect } from "react";
import ProjectDetails from "./steps/Details";
import { Preannotation } from "./steps/Preannotation";
import { Ontologies } from "./steps/Ontologies";
import { Dataset } from "./steps/Dataset";
import { Invite } from "./steps/Invite";
import {
  ValidateCreateDetails,
  ValidateCreatePreannotation,
  ValidateCreateReview,
} from "../../shared/utils/validation";
import useDatasets from "../../shared/hooks/api/datasets";
import useResources from "../../shared/hooks/api/resources";

import Create from "../../shared/components/Create/Create";
import useCreateProject from "../../shared/hooks/api/createProject";
import Review from "../../shared/components/Create/Review";

const CreateProject = () => {
  const {
    fetchResources,
    resources,
    error: resourcesError,
    loading: loadingResources,
  } = useResources();
  const {
    fetchProjectCreationDatasets,
    datasets,
    error: datasetsError,
    loading: loadingDatasets,
  } = useDatasets();

  useEffect(() => {
    if (loadingResources) {
      fetchResources({ aggregate: false, include_system: true });
    }
  }, [loadingResources]);

  useEffect(() => {
    if (loadingDatasets) {
      fetchProjectCreationDatasets();
    }
  }, [loadingDatasets]);

  const { submitting, createProject } = useCreateProject();

  const baseURL = "/project-creator";

  const defaultValues = {
    name: "",
    description: "",
    tasks: { entity: true, relation: false },
    settings: {
      disablePropagation: false,
      annotatorsPerItem: 1,
      suggestedPreannotations: true,
      disableDiscussion: false,
    },
    resources: {
      ontology: {
        entity: { name: null, id: null },
        relation: { name: null, id: null },
      },
      preannotation: {
        entity: { name: null, id: null },
        relation: { name: null, id: null },
      },
    },
    dataset: {
      name: null,
      id: null,
      dataset_type: null,
      entity_resource_ontology_id: null,
      relation_resource_ontology_id: null,
    },
    invitedUsers: [],
  };

  const defaultValidation = {
    details: false,
    dataset: false,
    ontologies: false,
    preannotation: false,
    invite: true,
    review: false,
  };

  const validationFunctions = (values) => ({
    details: ValidateCreateDetails(values.name, values.description),
    ontologies: Object.keys(values.tasks)
      .filter((task) => values.tasks[task])
      .every((task) => values.resources.ontology[task].id !== null),
    dataset: values.dataset.id !== null,
    preannotation: true, // TODO: come back and fix
    invite: true, // TODO: come back and fix
  });

  const reviewValidationFunction = (values) =>
    [
      validationFunctions(values)["details"],
      validationFunctions(values)["ontologies"],
      validationFunctions(values)["dataset"],
    ].every(Boolean);

  const reviewData = (values) => ({
    details: {
      summary: [
        `Name: ${values.name}`,
        `Description: ${values.description}`,
        `Task(s): ${
          !values.tasks.relation
            ? "Entity Typing"
            : "Entity Typing and Closed Relation Extraction"
        }`,
        `Propagation Disabled: ${values.settings.disablePropagation}`,
        `Discussion Disabled: ${values.settings.disableDiscussion}`,
      ],
    },
    dataset: {
      summary: [
        values.dataset.id ? `${values.dataset.name}` : "No dataset selected",
      ],
    },
    ontologies: {
      summary: [
        values.resources.ontology.entity.id
          ? `Entity Ontology: ${values.resources.ontology.entity.name}`
          : "No entity ontology selected",
        values.tasks.relation &&
          values.resources.ontology.relation.id &&
          `Relation Ontology: ${values.resources.ontology.relation.name}`,
      ],
    },
    preannotation: {
      summary: [
        values.dataset.is_annotated
          ? `Assigning annotated data as ${
              values.settings.suggestedPreannotations
                ? "suggestions"
                : "accepted"
            }`
          : values.resources.preannotation.entity.id
          ? `Preannotated Entities: ${values.resources.preannotation.entity.name}`
          : "No preannotated entities selected",
        values.tasks.relation &&
          values.resources.preannotation.relation.id &&
          `Preannotated Relations: ${values.resources.preannotation.relation.name}`,
      ],
    },
    invite: {
      summary: [
        `${
          values.invitedUsers.length === 0
            ? "Inviting no users"
            : "Invited " +
              values.invitedUsers.length +
              " users: " +
              values.invitedUsers.join(", ")
        }`,
      ],
    },
  });

  const submitFunction = (values) => {
    const payload = {
      name: values.name,
      description:
        values.description === "" ? "Not defined" : values.description,
      settings: {
        annotators_per_item: values.settings.annotatorsPerItem,
        disable_propagation: values.settings.disablePropagation,
        disable_discussion: values.settings.disableDiscussion,
        suggested_preannotations: values.settings.suggestedPreannotations,
      },
      tasks: values.tasks,
      blueprint_resource_ids: [
        ...Object.values(values.resources.ontology)
          .filter((i) => i.id)
          .map((i) => i.id),
        ...Object.values(values.resources.preannotation)
          .filter((i) => i.id)
          .map((i) => i.id),
      ],
      annotators: values.invitedUsers,
      blueprint_dataset_id: values.dataset.id,
    };

    return createProject(payload);
  };

  const ReviewComponent = (values, stepValidation) => (
    <Review
      reviewData={reviewData(values)}
      stepValidation={stepValidation}
      baseURL={baseURL}
    />
  );

  const stepComponents = ({ values, setValues, stepValidation }) => ({
    details: <ProjectDetails values={values} setValues={setValues} />,
    dataset: (
      <Dataset
        values={values}
        setValues={setValues}
        loading={loadingDatasets}
        error={datasetsError}
        datasets={datasets}
      />
    ),
    ontologies: (
      <Ontologies
        values={values}
        setValues={setValues}
        loading={loadingResources}
        error={resourcesError}
        resources={resources}
      />
    ),
    preannotation: (
      <Preannotation
        values={values}
        setValues={setValues}
        loading={loadingResources}
        resources={resources}
      />
    ),

    invite: <Invite values={values} setValues={setValues} />,
    review: ReviewComponent(values, stepValidation),
  });

  return (
    <Create
      defaultValues={defaultValues}
      defaultValidation={defaultValidation}
      stepComponents={stepComponents}
      validationFunctions={validationFunctions}
      reviewValidationFunction={reviewValidationFunction}
      baseURL={baseURL}
      submitFunction={submitFunction}
      submitting={submitting}
      allowedSteps={[
        "details",
        "dataset",
        "ontologies",
        "preannotation",
        "invite",
        "review",
      ]}
    />
  );
};

export default CreateProject;
