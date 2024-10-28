import DatasetDetails from "./components/Details";
import Editor from "./components/Editor";
import Preprocessing from "./components/Preprocessing";
import useDataset from "../../shared/hooks/api/dataset";
import Create from "../../shared/components/Create/Create";
import Review from "../../shared/components/Create/Review";

const CreateDataset = () => {
  const { submitting, createDataset } = useDataset();

  const baseURL = "/dataset-creator";

  const defaultValues = {
    name: "",
    description: "",
    dataType: "text",
    data: [],
    preprocessing: {
      lowercase: false,
      removeDuplicates: false,
      removeCharacters: "",
      tokenizer: "whitespace", //"punkt",
    },
    datasetType: 0, // 0 - no, 1 - yes entity, 2 - yes entity+relation
    suggestedAnnotations: false,
    resources: {
      entityId: null,
      relationId: null,
      entityClasses: [],
      relationClasses: [],
    },
    errors: [],
  };

  const defaultValidation = {
    details: false,
    editor: false,
    preprocessing: true,
    review: false,
  };

  const validationFunctions = (values) => ({
    details: values.name.trim() !== "",
    editor: Array.isArray(values.data)
      ? values.data.length > 0 && values.errors.length === 0
      : values.data.trim() !== "" && values.errors.length === 0,
  });
  const reviewValidationFunction = (values) =>
    [
      validationFunctions(values)["details"],
      validationFunctions(values)["editor"],
    ].every(Boolean);

  const reviewData = (values) => ({
    details: {
      summary: [`Name: ${values.name}`, `Description: ${values.description}`],
    },
    editor: {
      summary: [
        values.dataType && `Data Type: ${values.dataType.toUpperCase()}`,
        values.data
          ? `Dataset Items: ${
              values.dataType === "text"
                ? values.data.length
                : (() => {
                    try {
                      return JSON.parse(values.data).length;
                    } catch (error) {
                      return "Invalid JSON";
                    }
                  })()
            }`
          : "No data entered or uploaded",
      ],
    },
    preprocessing: {
      summary:
        values.dataType === "json"
          ? ["Preprocessing unavailable for JSON datasets"]
          : [
              `Lowercase: ${values.preprocessing.lowercase}`,
              `Remove Duplicates: ${values.preprocessing.removeDuplicates}`,
              `Remove Characters: ${values.preprocessing.removeCharacters}`,
              `Tokenizer: ${values.preprocessing.tokenizer}`,
            ],
    },
  });

  const submitFunction = (values) => {
    const payload = {
      is_blueprint: true,
      is_annotated: [1, 2].includes(values.datasetType),
      is_suggested: values.suggestedAnnotations,
      dataset_type: values.datasetType,
      name: values.name,
      description:
        values.description === "" ? "Not defined" : values.description,
      data_type: values.dataType,
      items: values.dataType === "text" ? values.data : JSON.parse(values.data),
      preprocessing: {
        lowercase:
          values.dataType === "text" ? values.preprocessing.lowercase : null,
        remove_duplicates:
          values.dataType === "text"
            ? values.preprocessing.removeDuplicates
            : null,
        remove_chars:
          values.dataType === "text"
            ? values.preprocessing.removeCharacters !== ""
            : null,
        remove_charset:
          values.dataType === "text"
            ? values.preprocessing.removeCharacters
            : null,
        tokenizer:
          values.dataType === "text" ? values.preprocessing.tokenizer : null,
      },
      entity_ontology_resource_id: values.resources.entityId,
      relation_ontology_resource_id: values.resources.relationId,
    };
    return createDataset(payload);
  };

  const ReviewComponent = (values, stepValidation) => (
    <Review
      reviewData={reviewData(values)}
      stepValidation={stepValidation}
      baseURL={baseURL}
    />
  );

  const stepComponents = ({ values, setValues, stepValidation }) => ({
    details: <DatasetDetails values={values} setValues={setValues} />,
    editor: <Editor values={values} setValues={setValues} />,
    preprocessing: <Preprocessing values={values} setValues={setValues} />,
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
      allowedSteps={["details", "editor", "preprocessing", "review"]}
    />
  );
};

export default CreateDataset;
