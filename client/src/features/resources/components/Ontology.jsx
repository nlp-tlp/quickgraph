import SchemaTreeViewWithButtons from "../../../shared/components/SchemaTreeView";
import useResource from "../../../shared/hooks/api/resource";

const Ontology = ({ values, setValues, editable }) => {
  const { updateResource } = useResource();

  const handleUpdate = () => {
    return updateResource({
      id: values._id,
      classification: values.classification,
      sub_classification: values.sub_classification,
      content: values.content,
    });
  };

  return (
    <SchemaTreeViewWithButtons
      details={{
        resource_id: values._id,
        name: values.name,
        classification: values.classification,
        sub_classification: values.sub_classification,
      }}
      treeData={values.content}
      setTreeData={(treeData) =>
        setValues({
          ...values,
          content: treeData,
        })
      }
      editable={editable}
      onUpdate={handleUpdate}
    />
  );
};

export default Ontology;
