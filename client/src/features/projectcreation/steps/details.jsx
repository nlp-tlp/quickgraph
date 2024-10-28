import Details from "../../../shared/components/Create/Details";

const ProjectDetails = ({ values, setValues }) => {
  const updateValue = (key, value) => {
    setValues((prevState) => ({ ...prevState, [key]: value }));
  };

  return (
    <Details
      components={[
        {
          type: "text",
          value: values.name,
          setValueFunction: (targetValue) => updateValue("name", targetValue),
          title: "Name",
          caption:
            "Give your project a name to make it easily distinguishable. This can be modified at any time.",
          placeholder: "Project Name",
          showRandomize: true,
        },
        {
          type: "text",
          value: values.description,
          setValueFunction: (targetValue) =>
            updateValue("description", targetValue),
          title: "Description",
          caption:
            "Give your project a description to make it easy for annotators to understand its context. This can be modified at any time.",
          placeholder: "Project Description (Optional)",
        },
        {
          type: "checkbox",
          title: "Task Configuration",
          caption: "Set the annotation task(s) for this project.",
          items: [
            {
              value: values.tasks.relation,
              label: "Entity and Closed Relation Annotation",
              tooltip:
                "This configuration is useful for knowledge graph construction",
              updateFunction: () =>
                updateValue("tasks", {
                  ...values.tasks,
                  relation: true,
                }),
            },
            {
              value: !values.tasks.relation,
              label: "Entity Annotation Only",
              tooltip:
                "This configuration is useful for token classification information extraction tasks",
              updateFunction: () =>
                updateValue("tasks", {
                  ...values.tasks,
                  relation: false,
                }),
            },
          ],
        },
        {
          type: "checkbox",
          title: "Settings - Annotation Propagation",
          caption:
            "Disable annotation propagation for annotators. This can be updated in the projects dashboard.",
          items: [
            {
              value: values.settings.disablePropagation,
              label: "Turn off annotation propagation",
              // tooltip:
              //   "Disable annotators from propagating annotations. This is useful for new annotators.",
              updateFunction: () =>
                updateValue("settings", {
                  ...values.settings,
                  disablePropagation: !values.settings.disablePropagation,
                }),
            },
          ],
        },
        {
          type: "checkbox",
          title: "Settings - Discussions",
          caption:
            "Disable annotators from having discussions on dataset items. This can be updated in the projects dashboard.",
          items: [
            {
              value: values.settings.disableDiscussion,
              label: "Turn off dataset item discussion",
              // tooltip: "Disable annotators from discussing annotations.",
              updateFunction: () =>
                updateValue("settings", {
                  ...values.settings,
                  disableDiscussion: !values.settings.disableDiscussion,
                }),
            },
          ],
        },
      ]}
    />
  );
};

export default ProjectDetails;
