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

const filterAnnotations = (annotatorId, markup, relations) => {
  try {
    logger.info("Filtering annotations", { function: "filterAnnotations" });

    // console.log('m: ', markup, 'r: ', relations);

    const fEntities =
      markup !== undefined && markup.length > 0
        ? markup.filter(
            (span) => span.createdBy.toString() === annotatorId.toString()
          )
        : [];
    const fRels =
      relations !== undefined && relations.length > 0
        ? relations.filter(
            (rel) => rel.createdBy.toString() === annotatorId.toString()
          )
        : [];
    return { fEntities, fRels };
  } catch (err) {
    logger.error("Failed to filter annotations");
  }
};

const generateTriples = (annotatorId, markup, relations, agreementType) => {
  /* 
            Function for generating triples from markup and relations. Adds positional
            information based on token positions.
            
            Notes:
                - triples are 1:1 with relations
        */
  try {
    logger.info("Generating Triples", { function: "generateTriples" });
    const { fEntities, fRels } = filterAnnotations(
      annotatorId,
      markup,
      relations
    );

    let triples;
    switch (agreementType) {
      case "overall":
        triples = fRels.map((relation) => {
          const sourceSpan = fEntities.filter(
            (span) => span._id == relation.source
          )[0];
          const targetSpan = fEntities.filter(
            (span) => span._id == relation.target
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
            ...relation,
            rel_label: `${relation.label}|${sourceSpanIndex}_${targetSpanIndex}|`,
            source_label: `${relation.source_label}|${sourceSpanIndex}|`,
            target_label: `${relation.target_label}|${targetSpanIndex}|`,
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
            const entity = fEntities.filter((e) => e._id == entityId)[0];
            const entityLabel =
              entity.start === entity.end
                ? `${entity.label}|${entity.start}|`
                : `${entity.label}|${entity.start}-${entity.end}|`;

            return { entity_label: entityLabel };
          });
          logger.info(`Generated ${triples.length} from entities`);
        } else {
          //   Check if entities exist without relations
          triples = fEntities.map((entity) => {
            const entityLabel =
              entity.start === entity.end
                ? `${entity.label}|${entity.start}|`
                : `${entity.label}|${entity.start}-${entity.end}|`;
            return { entity_label: entityLabel };
          });
        }

        return triples;
      case "relations":
        triples = fRels.map((relation) => {
          const sourceSpan = fEntities.filter(
            (span) => span._id == relation.source
          )[0];
          const targetSpan = fEntities.filter(
            (span) => span._id == relation.target
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
            rel_label: `${relation.label}|${sourceSpanIndex}_${targetSpanIndex}|`,
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

const getIAA = (annotatorIds, markup, relations, agreementType) => {
  /* 
            Function for computing the IAA between an arbitrary number of annotators using ModSemBLUE.
            A pairwise score is generated for all annotators. The average of the pairwise scores is
            the score for the document.
        */

  //console.log("AGREEMENT TYPE:", agreementType);

  // Generate triples and ngrams from each annotators markup/relations
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
        generateTriples(id, markup, relations, agreementType),
        agreementType,
        ngramOrders
      ),
    }))
  );
  // console.log("filteredNgrams", filteredNgrams);

  //   Check if any of the ngrams are empty
  const hasEmptyArray =
    Object.values(filteredNgrams).filter((a) => a.length === 0).length > 0;
  //console.log("hasEmptyArray", hasEmptyArray);

  if (hasEmptyArray) {
    console.log("has empty array");
    return 0;
  } else {
    let scores = [];
    for (let i = 0; i < annotatorIds.length; i++) {
      // console.log("i:", i);
      // console.log("Candidate:", annotatorIds[i]);
      const candidate = filteredNgrams[annotatorIds[i]];
      for (let j = 0; j < annotatorIds.length; j++) {
        if (j !== i) {
          // console.log("j:", j);
          // console.log("Reference:", annotatorIds[j]);
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
  checkMatchedSpan: (markup, start, end, label) => {
    // Checks whether span exists between start and end in markup with the supplied entity label
    let matchedSpan = markup.filter(
      (s) => s.start === start && s.end === end && s.label === label
    );
    let hasMatchedSpan = false;
    if (matchedSpan.length === 1) {
      matchedSpan = matchedSpan[0];
      hasMatchedSpan = true;
    }
    return { hasMatchedSpan, matchedSpan };
  },
  checkMatchedSpanLabel: (markup, start, end, label) => {
    // Checks whether accepted/suggested span has a supplied label.
    const matchedSpan = markup.filter(
      (s) => s.start === start && s.end === end
    );
    const hasMatchedSpanLabel =
      matchedSpan.filter((s) => s.label === label).length === 1;
    return hasMatchedSpanLabel;
  },
  createTextSpan: (tokens, spanStart, spanEnd) => {
    // Creates a text span from a set of tokens using a spans start and end.
    // e.g. tokens: [hello, world, my, name], start: 0, end: 1, textSpan = "hello world"
    const textSpan = tokens
      .filter((token) => spanStart <= token.index && token.index <= spanEnd)
      .map((token) => token.value)
      .join(" ");
    return textSpan;
  },
  checkSpanRelations: (relations, spanId) => {
    // Checks whether span has relations associated to it.
    // If it does and the span is deleted, then remove them.
    // Can be as a source or target
    const matchedRelationIds = relations
      .filter(
        (r) =>
          r.source.toString() == spanId.toString() ||
          r.target.toString() == spanId.toString()
      )
      .map((r) => r._id);
    // console.log(
    //   "relations", relations,
    //   "spanId", spanId,
    //   "matched ",
    //   matchedRelationIds.length,
    //   "relations",
    //   matchedRelationIds,
    //   "\n"
    // );
    return matchedRelationIds;
  },
  filterResponse: (response, userId) => {
    // Filter response for auth user
    const filteredResponse = {
      ...response,
      markup: response.markup.filter((span) => span.createdBy == userId),
      relations: response.relations.filter((rel) => rel.createdBy == userId),
      saved: response.saved.filter((s) => s.createdBy == userId),
    };
    return filteredResponse;
  },
  getMatchingSpans: (
    userId,
    annotationType,
    action,
    startToken,
    endToken,
    offset,
    matchedTexts,
    entityLabel
  ) => {
    /*
      Maps through matching texts to find instances where spans are the same as the focus entity/relation.
    */

    const matchedTextSpans = matchedTexts.flatMap((text) => {
      // start and end index groups are found by matching on start tokens and checking if
      // the token offset *n-distance* from the start is equal to end token expected.
      // NOTE: a single text can have *n* substring matches...

      const spans = text.markup.filter((s) => s.createdBy == userId);
      const tokens = text.original.split(" ");

      let spanIndexes;
      if (annotationType === "entity") {
        spanIndexes = tokens
          .map((token, index) =>
            token.toLowerCase() === startToken &&
            tokens[index + offset].toLowerCase() === endToken
              ? index
              : ""
          )
          .filter(String)
          .map((startIndex) => ({
            start: startIndex,
            end: startIndex + offset,
          }));

        switch (action) {
          case "apply":
            if (spanIndexes.length === 0) {
              return []; // Flatmap takes care of empty array
            } else {
              return spanIndexes.map((span) => ({
                ...span,
                text_id: text._id,
                label: entityLabel,
              }));
            }
          case "delete":
            // filter spans based on span start/end and entityLabel
            return spanIndexes.flatMap((spanIndexPair) =>
              spans
                .filter(
                  (s) =>
                    s.start === spanIndexPair.start &&
                    s.end === spanIndexPair.end &&
                    s.label === entityLabel
                )
                .map((s) => ({ ...s, text_id: text._id }))
            );
        }
      } else if (annotationType === "relation") {
        //
      } else {
        // TODO: Handle this.
      }
    });

    return matchedTextSpans;
  },
  getAllIAA: (annotatorIds, markup, relations, relationAnnotation) => {
    logger.info("Fetching all inter annotator agreement scores");
    // console.log("annotatorIds: ", annotatorIds);
    // console.log("markup", markup);
    // console.log("relations", relations);
    // console.log('relationAnnotation',relationAnnotation);

    let scores;
    if (relationAnnotation && annotatorIds.length === 1) {
      scores = {
        entity: 100,
        relation: 100,
        overall: 100,
      };
    } else if (relationAnnotation) {
      scores = {
        entity: getIAA(annotatorIds, markup, relations, "entities"),
        relation: getIAA(annotatorIds, markup, relations, "relations"),
        overall: getIAA(annotatorIds, markup, relations, "overall"),
      };
    } else if (!relationAnnotation && annotatorIds.length === 1) {
      scores = { entity: 100 };
    } else {
      scores = { entity: getIAA(annotatorIds, markup, relations, "entities") };
    }
    return scores;
  },
};
