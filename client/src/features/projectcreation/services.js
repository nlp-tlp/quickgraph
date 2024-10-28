import { initializedСopy, addFullNames } from "../../shared/utils/treeview";

export const prepareCreatePayload = (values) => {
  /**
   * Converts values from multi-step create form into payload to send to backend
   */
  // Add data to ontologies including fullName field
  const entityOntology = structuredClone(values["entityOntology"]);
  const entityOntologyFN = addFullNames(initializedСopy(entityOntology));

  let relationOntologyFN = [];
  if (values.relationAnnotation) {
    const relationOntology = structuredClone(values["relationOntology"]);
    relationOntologyFN = addFullNames(initializedСopy(relationOntology));
  }

  const payload = {
    createType: values.corpusType,
    name: values.projectName,
    description: values.projectDescription,
    tasks: {
      entityAnnotation: true,
      relationAnnotation: values.relationAnnotation,
    },
    disablePropagation: values.disablePropagation,
    data: values.corpus,
    suggested: values.annotationsAreSuggestions,
    entityOntology: entityOntologyFN,
    relationOntology: relationOntologyFN,
    entityDictionary: values.entityDictionary,
    typedTripleDictionary: values.typedTripleDictionary,
    preprocessLowerCase: values.preprocessLowerCase,
    preprocessRemoveDuplicates: values.preprocessRemoveDuplicates,
    preprocessRemoveChars: values.preprocessRemoveChars,
    preprocessRemoveCharSet: values.preprocessRemoveCharSet,
    invitedUsers: values.invitedUsers,
    annotatorsPerDoc: values.annotatorsPerDoc,
  };

  return payload;
};
