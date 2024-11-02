import useResource from "../../../shared/hooks/api/resource";
import SchemaTreeViewWithControls from "../../../shared/components/SchemaTreeViewWithControls";

const Ontology = ({ values, setValues, editable }) => {
  const { updateResource } = useResource();
  const handleUpdate = (updatedData) => {
    return updateResource({
      id: values._id,
      classification: values.classification,
      sub_classification: values.sub_classification,
      content: updatedData,
    });
  };

  return (
    <SchemaTreeViewWithControls
      initialData={values.content}
      handleDataChange={(treeData) =>
        setValues({
          ...values,
          content: treeData,
        })
      }
      handleDataUpdate={handleUpdate}
      editable={editable}
    />
  );
};

export default Ontology;
