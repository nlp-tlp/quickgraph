/**
 * If user selects "preannotations" - mandatory details should pop up that require them to select an existing ontology or specify details for a new one that will be created with the preannotation resource.
 */

import { useEffect } from "react";
import useResource from "../../shared/hooks/api/resource";
import ResourceDetails from "./components/Details";
import Editor from "./components/Editor";
import Create from "../../shared/components/Create/Create";
import Review from "../../shared/components/Create/Review";

// import { validateCSV, validateEntityOntologyData } from "./components/utils";
// import { countTreeItemsAndMaxDepth } from "../../shared/utils/treeView";
import useResources from "../../shared/hooks/api/resources";

const resourceValidator = ({
  values,
  classification,
  subClassification,
  data,
}) => {
  // This function validates whether a given resource is valid.
  return values.errors.length === 0 && values.data.length !== 0;
};

const CreateResource = () => {
  const { submitting, createResource } = useResource();
  const baseURL = "/resource-creator";

  const { resources, fetchResources, loading } = useResources();

  useEffect(() => {
    if (loading) {
      fetchResources({ aggregate: false, include_system: true });
    }
  }, [loading]);

  const defaultValues = {
    name: "",
    description: "",
    dataType: "json", // json - ontology/constraints, csv - preannotations
    data: "",
    errors: [],
    // visualMode: false, // Used to toggle between visual/text edit modes for json data
    classification: "ontology",
    sub_classification: "entity",
    resources: {
      entityId: null,
      relationId: null,
      entityClasses: [],
      relationClasses: [],
    },
    // ontologyId: null, // Used to link preannotations and constraints with ontology resources
    // ontologyIds: [], // Array of ontology {value: "_id", name: "name"}
  };

  const defaultValidation = {
    details: false,
    editor: false,
    review: false,
  };

  const validationFunctions = (values) => ({
    details: values.name !== "",
    editor: resourceValidator({
      values: values,
      classification: values.classification,
      sub_classification: values.sub_classification,
      data: values.data,
    }),
  });

  const reviewValidationFunction = (values) =>
    [
      validationFunctions(values)["details"],
      validationFunctions(values)["editor"],
    ].every(Boolean);

  const reviewData = (values) => ({
    details: {
      summary: [
        `Name: ${values.name}`,
        `Description: ${values.description}`,
        `Resource Type: ${values.classification}`,
        `Resource Sub Type: ${values.sub_classification}`,
      ],
    },
    editor: {
      summary: [
        values.uploadMethod && `Upload method: ${values.uploadMethod}`,
        // values.classification === "ontology" &&
        //   countTreeItemsAndMaxDepth(JSON.parse(values.data)),
      ],
    },
  });

  const submitFunction = (values) => {
    // console.log("Creating resource");
    const payload = {
      name: values.name,
      // description:
      //   values.description === "" ? "Not defined" : values.description,
      classification: values.classification,
      sub_classification: values.sub_classification,
      content: JSON.parse(values.data),
      is_blueprint: true,
    };

    // console.log("payload", payload);

    return createResource(payload);
  };

  const ReviewComponent = (values, stepValidation) => (
    <Review
      reviewData={reviewData(values)}
      stepValidation={stepValidation}
      submitting={submitting}
      submitFunction={() => submitFunction(values)}
      baseURL={baseURL}
    />
  );

  const stepComponents = ({ values, setValues, stepValidation }) => ({
    details: (
      <ResourceDetails
        values={values}
        setValues={setValues}
        resources={resources}
        loading={loading}
      />
    ),
    editor: <Editor values={values} setValues={setValues} />,
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
      allowedSteps={["details", "editor", "review"]}
    />
  );
};

export default CreateResource;
