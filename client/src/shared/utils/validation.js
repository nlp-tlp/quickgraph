// Functions for UI validation

const checkValid = (arr) => arr.every(Boolean);

export const ValidateAnnotatedData = (data, entityOntology) => {
  return true;
};

export const ValidateCreateDetails = (projectName, projectDescription) => {
  const validName = projectName !== "";
  return checkValid([validName]);
};

export const ValidateCreateOntologies = (
  relationAnnotation,
  entityOntology,
  relationOntology
) => {
  // Only looks at the top level nodes; if any child are empty, they will be removed later.

  const validEntityOntology =
    entityOntology.filter((node) => node.name !== "").length > 0;

  if (relationAnnotation) {
    const validRelationOntology =
      relationOntology.filter((node) => node.name !== "").length > 0;
    return checkValid([validEntityOntology, validRelationOntology]);
  } else {
    return checkValid([validEntityOntology]);
  }
};

export const ValidateCreateUpload = (corpusType, corpus, entityOntology) => {
  let validCorpus;
  if (Array.isArray(corpus)) {
    // Scratch upload (array)
    validCorpus = 0 < corpus.filter((i) => i !== "").length;
  } else {
    // Annotation upload (object)
    const corpusValidation = ValidateAnnotatedData(corpus, entityOntology);
    validCorpus = corpusValidation.valid;
  }

  return checkValid([validCorpus]);
};

export const ValidateCreatePreannotation = (
  entityOntology,
  relationOntology,
  entityDictionary,
  typedTripleDictionary
) => {
  if (entityDictionary.length === 0 && typedTripleDictionary.length === 0) {
    return true;
  }
};

export const ValidateCreateReview = (
  detailsValid,
  ontologiesValid,
  datasetValid,
  preannotationValid
) => {
  return checkValid([
    detailsValid,
    ontologiesValid,
    datasetValid,
    preannotationValid,
  ]);
};
