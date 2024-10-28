import { useEffect } from "react";
import Details from "../../../shared/components/Create/Details";
import useResources from "../../../shared/hooks/api/resources";

const DatasetDetails = ({ values, setValues }) => {
  // Fetch ontology items only if "datasetType" state is changed
  const { resources, fetchResources, loading } = useResources();

  useEffect(() => {
    if (values.datasetType !== 0) {
      console.log("Fetching ontology information");
      fetchResources({ aggregate: false, include_system: true });
    }
  }, [values.datasetType]);

  return (
    <Details
      components={[
        {
          type: "text",
          value: values.name,
          setValueFunction: (targetValue) =>
            setValues((prevState) => ({ ...prevState, name: targetValue })),
          title: "Name",
          caption: "This is the name of your dataset",
          placeholder: "Dataset Name",
          showRandomize: true,
        },
        {
          type: "text",
          value: values.description,
          setValueFunction: (targetValue) =>
            setValues((prevState) => ({
              ...prevState,
              description: targetValue,
            })),
          title: "Description",
          caption: "This is the description of your dataset",
          placeholder: "Dataset Description (Optional)",
        },
        {
          type: "select",
          value: values.datasetType,
          setValueFunction: (targetValue) =>
            setValues((prevState) => ({
              ...prevState,
              datasetType: targetValue,
              ...([1, 2].includes(targetValue) ? { dataType: "json" } : {}),
            })),
          title: "Annotated Dataset",
          caption: "Is this dataset preannotated?",
          options: [
            { name: "No", value: 0 },
            { name: "Yes - Entities", value: 1 },
            { name: "Yes - Entities and Relations", value: 2 },
          ],
        },
        {
          type: "select",
          hidden: values.datasetType === 0,
          value: values.suggestedAnnotations,
          setValueFunction: (targetValue) =>
            setValues((prevState) => ({
              ...prevState,
              suggestedAnnotations: targetValue,
            })),
          title: "Suggested Annotations",
          caption: "Should the annotations be set as suggested?",
          options: [
            { name: "No", value: false },
            { name: "Yes", value: true },
          ],
        },
        {
          type: "select",
          hidden: values.datasetType === 0,
          value: values.resources.entityId ?? "",
          setValueFunction: (targetValue) =>
            setValues((prevState) => ({
              ...prevState,
              resources: {
                ...prevState.resources,
                entityId: targetValue,
                entityClasses: resources.filter((r) => r.id === targetValue)[0]
                  .instances,
              },
            })),
          title: "Entity Ontology",
          caption: "Choose the entity ontology that defines the annotations",
          label: loading ? "Loading..." : "Entity Ontology",
          options: loading
            ? [{ name: "Please wait", value: "" }]
            : resources
                .filter((r) => r.sub_classification === "entity")
                .map((r) => ({
                  name: `${r.name} (${r.instances.length})`,
                  value: r.id,
                  title: `${r.instances.join(", ")}`,
                })),
        },
        {
          type: "select",
          hidden: [0, 1].includes(values.datasetType),
          value: values.resources.relationId ?? "",
          setValueFunction: (targetValue) =>
            setValues((prevState) => ({
              ...prevState,
              resources: {
                ...prevState.resources,
                relationId: targetValue,
                relationClasses: resources.filter(
                  (r) => r.id === targetValue
                )[0].instances,
              },
            })),
          title: "Relation Ontology",
          label: loading ? "Loading..." : "Relation Ontology",
          caption: "Choose the relation ontology that defines the annotations",
          options: loading
            ? [{ name: "Please wait", value: "" }]
            : resources
                .filter((r) => r.sub_classification === "relation")
                .map((r) => ({
                  name: `${r.name} (${r.instances.length})`,
                  value: r.id,
                  title: `${r.instances.join(", ")}`,
                })),
        },
      ]}
    />
  );
};

export default DatasetDetails;
