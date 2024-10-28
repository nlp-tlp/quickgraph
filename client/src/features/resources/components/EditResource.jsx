import Ontology from "./Ontology";
import Preannotation from "./Preannotation";
import ErrorAlert from "../../../shared/components/ErrorAlert";

const EditResource = (props) => {
  const { values, editable } = props;

  let Component;
  switch (values.classification) {
    case "ontology":
      Component = <Ontology {...props} />;
      break;
    case "preannotation":
      Component = <Preannotation {...props} />;
      break;
    case "constraints":
      // Constraints
      break;

    default:
      Component = <p>An error occurred...</p>;
      // Component = <ErrorAlert />;
      break;
  }

  return Component;
};

export default EditResource;
