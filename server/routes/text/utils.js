/* 
    Annotation utilities
    Includes:
    
    // Algorithm for calculating IAA of triples using BLEU (adapting SemBLEU).
    
    // The current implementation is STRICT. Future work will relax the strict criteria to allow nodes/edges to be
    // counted as correct (or partially correct) if they are descendents.
*/

const logger = require("../../logger");

const findNgrams = (tokens, n) => {
  /* 
              Function for generating an array of ngrams.
          */
  var ngrams = [];
  for (var i = 0; i < tokens.length - n + 1; i++) {
    // - order + 1 is for truncating end tokens that would make non-order ngrams
    var ngram = tokens.slice(i, i + n);
    ngrams.push(ngram);
  }
  return ngrams;
};

const filterAnnotations = (annotatorId, entities, relations) => {
  try {
    logger.info("Filtering annotations", { function: "filterAnnotations" });
    // console.log("m: ", entities, "r: ", relations);
    console.log(
      `Size of before filtering - entities ${entities.length} and relations ${relations.length}`
    );

    const fEntities = entities.filter(
      (e) => e.createdBy.toString() === annotatorId.toString()
    );
    const fRels = relations.filter(
      (r) => r.createdBy.toString() === annotatorId.toString()
    );

    console.log(
      `Size of filtered entities ${fEntities.length} and relations ${fRels.length}`
    );

    return { fEntities, fRels };
  } catch (err) {
    logger.error("Failed to filter annotations");
  }
};

const generateTriples = (annotatorId, entities, relations, agreementType) => {
  /* 
            Function for generating triples from entities and relations. Adds positional
            information based on token positions.
            
            Notes:
                - triples are 1:1 with relations
        */
  try {
    logger.info("Generating Triples", { function: "generateTriples" });
    const { fEntities, fRels } = filterAnnotations(
      annotatorId,
      entities,
      relations
    );

    // console.log("filtered objects", fEntities, fRels);

    let triples;
    switch (agreementType) {
      case "overall":
        logger.info("Generating triples for overall agreement");
        triples = fRels.map((relation) => {
          console.log("overall relation", relation);

          // console.log("fEntities", fEntities);

          const sourceSpan = fEntities.filter(
            (e) => e._id.toString() === relation.source.toString()
          )[0];
          const targetSpan = fEntities.filter(
            (e) => e._id.toString() === relation.target.toString()
          )[0];

          console.log(sourceSpan, targetSpan);

          const sourceSpanIndex =
            sourceSpan.start === sourceSpan.end
              ? sourceSpan.start.toString()
              : `${sourceSpan.start}-${sourceSpan.end}`;
          const targetSpanIndex =
            targetSpan.start === targetSpan.end
              ? targetSpan.start.toString()
              : `${targetSpan.start}-${targetSpan.end}`;

          return {
            ...relation,
            rel_label: `${relation.labelId}|${sourceSpanIndex}_${targetSpanIndex}|`,
            source_label: `${sourceSpan.labelId}|${sourceSpanIndex}|`,
            target_label: `${targetSpan.labelId}|${targetSpanIndex}|`,
          };
        });
        return triples.map((triple) => ({
          source_label: triple.source_label,
          target_label: triple.target_label,
          rel_label: triple.rel_label,
        }));
      case "entities":
        const hasRelations = fRels.length > 0;
        if (hasRelations) {
          // Get entities that are on relations and remove duplicates
          const entityIds = [
            ...new Set(fRels.flatMap((r) => [r.source, r.target])),
          ];
          //   console.log("entityIds", entityIds);
          triples = entityIds.map((entityId) => {
            const entity = fEntities.filter(
              (e) => e._id.toString() === entityId.toString()
            )[0];
            const entityLabel =
              entity.start === entity.end
                ? `${entity.labelId}|${entity.start}|`
                : `${entity.labelId}|${entity.start}-${entity.end}|`;

            return { entity_label: entityLabel };
          });
          logger.info(`Generated ${triples.length} from entities`);
        } else {
          //   Check if entities exist without relations
          triples = fEntities.map((entity) => {
            const entityLabel =
              entity.start === entity.end
                ? `${entity.labelId}|${entity.start}|`
                : `${entity.labelId}|${entity.start}-${entity.end}|`;
            return { entity_label: entityLabel };
          });
        }

        return triples;
      case "relations":
        triples = fRels.map((relation) => {
          const sourceSpan = fEntities.filter(
            (e) => e._id.toString() === relation.source.toString()
          )[0];
          const targetSpan = fEntities.filter(
            (e) => e._id.toString() === relation.target.toString()
          )[0];

          const sourceSpanIndex =
            sourceSpan.start === sourceSpan.end
              ? sourceSpan.start.toString()
              : `${sourceSpan.start}-${sourceSpan.end}`;
          const targetSpanIndex =
            targetSpan.start === targetSpan.end
              ? targetSpan.start.toString()
              : `${targetSpan.start}-${targetSpan.end}`;

          return {
            rel_label: `${relation.labelId}|${sourceSpanIndex}_${targetSpanIndex}|`,
          };
        });
        return triples;
      default:
        logger.error("Something went wrong with generateTriples");
        break;
    }
  } catch (err) {
    logger.error("Failed to generate triples");
  }
};

const getAllNgrams = (triples, agreementType, orders) => {
  /* 
    Function for generating a set of n ordered ngrams from a set of
    triples.
  */

  logger.info("Getting NGrams", { function: "getAllNgrams" });
  let tokenSets;
  switch (agreementType) {
    case "overall":
      console.log("overall triples", triples);

      tokenSets = triples.map((triple) => [
        triple.source_label,
        triple.rel_label,
        triple.target_label,
      ]);
      break;
    case "entities":
      tokenSets = triples.map((triple) => [triple.entity_label]);
      break;
    case "relations":
      tokenSets = triples.map((triple) => [triple.rel_label]);
      break;
    default:
      logger.error("Something went wrong with getAllNgrams");
      break;
  }

  const output = tokenSets.flatMap((tokens, index) =>
    orders.map((order) => ({
      tripleIndex: index,
      order: order,
      ngrams: findNgrams(tokens, order),
    }))
  );
  return output;
};

const pairwiseScore = (ngramsA, ngramsB, orders) => {
  /* 
    Function for calculating the pairwise score between n ordered ngrams.
    Returns a score that is the average of all modified ngram precisions.
    See: BLEU: a Method for Automatic Evaluation of Machine Translation (https://aclanthology.org/P02-1040.pdf)
    
    Notes:
      - This is currently a strict implementation where exact matches are required.
  */
  const getCounts = (ngrams, order) => {
    return ngrams
      .filter((n) => n.order === order)
      .flatMap((n) => n.ngrams.map((gram) => gram.join("/")))
      .reduce((prev, curr) => ((prev[curr] = ++prev[curr] || 1), prev), {});
  };

  const ngramScores = orders.map((order) => {
    // console.log("Order: ", order);
    const countsA = getCounts(ngramsA, order);
    const countsB = getCounts(ngramsB, order);
    // console.log("ngramsACounts", countsA);
    // console.log("ngramsBCounts", countsB);
    let denom = Object.values(countsA).reduce((a, b) => a + b, 0); // Number grams
    let num = 0;
    for (const [key, value] of Object.entries(countsA)) {
      if (countsB[key] !== undefined) {
        num += num + countsB[key] > value ? value : countsB[key];
      }
    }
    return num / denom;
  });

  // console.log("ngramScores", ngramScores);
  return ngramScores.reduce((a, b) => a + b, 0) / ngramScores.length;
};

const getIAA = (annotatorIds, entities, relations, agreementType) => {
  /* 
    Function for computing the IAA between an arbitrary number of annotators using ModSemBLUE.
    A pairwise score is generated for all annotators. The average of the pairwise scores is
    the score for the document.
  */

  console.log("AGREEMENT TYPE:", agreementType);

  // Generate triples and ngrams from each annotators entities/relations
  const ngramOrders =
    agreementType === "overall"
      ? [1, 2, 3]
      : agreementType === "entities"
      ? [1]
      : [1];

  const filteredNgrams = Object.assign(
    {},
    ...annotatorIds.map((id) => ({
      [id]: getAllNgrams(
        generateTriples(id, entities, relations, agreementType),
        agreementType,
        ngramOrders
      ),
    }))
  );
  console.log("filteredNgrams", filteredNgrams);

  // Check if any of the ngrams are empty
  // this means an annotator hasn't annotated the document
  const hasEmptyArray =
    Object.values(filteredNgrams).filter((a) => a.length === 0).length > 0;
  //console.log("hasEmptyArray", hasEmptyArray);

  if (hasEmptyArray) {
    logger.error("Ngram array is empty - cannot compute this agreement type");
    return null;
  } else {
    let scores = [];
    for (let i = 0; i < annotatorIds.length; i++) {
      // console.log("i:", i);
      console.log("Candidate:", annotatorIds[i]);
      const candidate = filteredNgrams[annotatorIds[i]];
      for (let j = 0; j < annotatorIds.length; j++) {
        if (j !== i) {
          // console.log("j:", j);
          console.log("Reference:", annotatorIds[j]);
          const reference = filteredNgrams[annotatorIds[j]];
          if (reference.length === 0) {
            scores.push(0);
          } else {
            scores.push(pairwiseScore(candidate, reference, ngramOrders));
          }
        }
      }
    }
    // console.log(scores);
    return Math.round(
      (scores.reduce((a, b) => a + b, 0) / scores.length) * 100,
      2
    );
  }
};

module.exports = {
  getAllIAA: (annotatorIds, entities, relations, relationAnnotation) => {
    const multipleAnnotators = annotatorIds.length > 1;
    logger.info(
      `Fetching IAA scores - multiple annotators: ${multipleAnnotators} - relation annotation: ${relationAnnotation}`
    );
    // console.log("annotatorIds: ", annotatorIds);
    // console.log("entities", entities);
    // console.log("relations", relations);
    // console.log('relationAnnotation',relationAnnotation)

    let scores;
    switch (relationAnnotation) {
      case true:
        if (multipleAnnotators) {
          scores = {
            overall: getIAA(annotatorIds, entities, relations, "overall"),
            entity: getIAA(annotatorIds, entities, relations, "entities"),
            relation: getIAA(annotatorIds, entities, relations, "relations"),
          };

          // scores = {
          //   ...scores,
          //   test:
          //     [scores.entity, scores.relation].reduce((a, b) => a + b, 0) /
          //     [scores.entity, scores.relation].length,
          // };
        } else {
          scores = {
            overall: relations.length > 0 ? 100 : null,
            entity: 100,
            relation: relations.length > 0 ? 100 : null,
          };
        }
        break;
      case false:
        if (multipleAnnotators) {
          scores = {
            entity: getIAA(annotatorIds, entities, relations, "entities"),
          };
        } else {
          scores = { entity: 100 };
        }
        break;
    }
    return scores;
  },
};
