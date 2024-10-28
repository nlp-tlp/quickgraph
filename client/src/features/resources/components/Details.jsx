import Details from "../../../shared/components/Create/Details";

const ResourceDetails = ({ values, setValues, resources, loading }) => {
  return (
    <Details
      components={[
        {
          type: "select",
          value: values.classification,
          setValueFunction: (targetValue) =>
            setValues((prevState) => ({
              ...prevState,
              classification: targetValue,
              dataType: "json",
              data: "",
            })),
          title: "Resource Type",
          caption: "Select the resource type you wish to create",
          options: [
            { value: "ontology", name: "Ontology" },
            // { value: "preannotation", name: "Preannotation" },
            // { value: "constraints", name: "Constraints" },
          ],
        },
        {
          type: "select",
          value: values.sub_classification,
          setValueFunction: (targetValue) =>
            setValues((prevState) => ({
              ...prevState,
              sub_classification: targetValue,
              dataType: "json",
              data: "",
            })),
          title: "Resource Sub Type",
          caption: "Select the resources sub type you wish to create",
          options: [
            { value: "entity", name: "Entity" },
            ...(values.classification !== "preannotation"
              ? [{ value: "relation", name: "Relation" }]
              : []),
          ],
        },
        {
          type: "text",
          value: values.name,
          setValueFunction: (targetValue) =>
            setValues((prevState) => ({ ...prevState, name: targetValue })),
          title: "Name",
          caption: "This is the name of your resource",
          placeholder: "Resource Name",
          showRandomize: true,
        },
        // {
        //   type: "text",
        //   value: values.description,
        //   setValueFunction: (targetValue) =>
        //     setValues((prevState) => ({
        //       ...prevState,
        //       description: targetValue,
        //     })),
        //   title: "Description",
        //   caption: "This is the description of your resource",
        //   placeholder: "Resource Description",
        // },
        {
          type: "select",
          hidden: values.classification === "ontology",
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
          title: `Select Existing ${values.sub_classification} Ontology`,
          label: loading
            ? "Loading..."
            : `${values.sub_classification} Ontology`,
          caption: `Choose the ${values.sub_classification} ontology that your ${values.classification} uses`,
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
      ]}
    />
  );
};

export default ResourceDetails;
