/**
 * Services for `Project` routes
 */

const logger = require("../../logger");
const utils = require("./utils");
const Project = require("../../models/Project");
const Text = require("../../models/Text");
const User = require("../../models/User");
const mongoose = require("mongoose");
const Markup = require("../../models/Markup");
const axios = require("axios").default;
const { getFlatOntology, filterOntology } = require("./utils");
const { getFontColour, addAlpha } = require("./utils");

const createProject = async (payload, userId) => {
  logger.info("Creating base project");
  // TODO: weighting and ranking

  const project = await Project.create({
    projectManager: userId,
    name: payload.name,
    description: payload.description,
    preprocessing: {
      lowerCase: payload.lowerCase,
      removeDuplicates: payload.removeDuplicates,
      charsRemoved: payload.charsRemove,
      charset: payload.charsetRemove,
    },
    ontology: [
      ...payload.entityOntology,
      ...(payload.tasks.relationAnnotation &&
      payload.tasks.relationAnnotationType === "closed"
        ? payload.relationOntology
        : []),
    ],
    settings: {
      performClustering: payload.performClustering,
      annotatorsPerDoc: 1,
    },
    tasks: payload.tasks,
  });

  const projectId = project._id;

  const flatEntityOntology = utils.getFlatOntology(
    project.ontology.filter((item) => item.isEntity)
  );

  const flatRelationOntology = utils.getFlatOntology(
    project.ontology.filter((item) => !item.isEntity)
  );

  logger.info("Pre-processing texts");
  let texts = payload.texts;

  console.log(texts);

  texts = texts.map((text) => text.replace("\t", " ").replace("\r", " "));

  if (payload.lowerCase) {
    texts = texts.map((text) => text.toLowerCase());
  }
  if (payload.charsRemove) {
    const escapedChars = [
      "[",
      "]",
      "{",
      "}",
      "(",
      ")",
      "*",
      "+",
      "?",
      "|",
      "^",
      "$",
      ".",
      "\\",
    ];
    const regexCharsEscaped = payload.charsetRemove
      .split("")
      .map((char) => (escapedChars.includes(char) ? `\\${char}` : char));
    const regex = new RegExp("[" + regexCharsEscaped + "]", "g");
    texts = texts.map((text) => text.replace(regex, " "));
  }

  console.log(texts);

  // remove multiple white spaces and trim
  texts = texts.map((text) => text.replace(/\s+/g, " ").trim());

  console.log(`texts ${texts.length}`);

  // remove texts that are empty after pre-processing
  let filteredTexts = texts
    .filter((text) => text.length > 0)
    .map((text) => text);

  // drop duplicates
  if (payload.removeDuplicates) {
    filteredTexts = [...new Set(filteredTexts)];
  }

  logger.info("Performing pre-annotation");

  const getPreannotatedEntities = (textObj) => {
    /**
     * Iterates over a dictionary of pre-annotated data
     * Dictionary: {'ngram': 'class'}
     */
    const tokens = textObj.original.split(" ");
    const dictionary = payload.entityDictionary;
    const annotatedEntities = Object.keys(dictionary)
      .flatMap((ngram) => {
        const ngramTokens = ngram.split(" ");
        if (ngramTokens.every((t) => tokens.includes(t))) {
          const ngramOrder = ngramTokens.length;
          const spansTemp = tokens
            .map((token, index) => {
              if (
                ngramOrder > 1 &&
                token === ngramTokens[0] &&
                tokens[index + ngramOrder - 1] === ngramTokens[ngramOrder - 1]
              ) {
                // Higher-order ngrams
                return {
                  textId: textObj._id,
                  start: index,
                  end: index + ngramOrder - 1,
                  labelId: flatEntityOntology.filter(
                    (l) =>
                      l.fullName.toLowerCase() ===
                      dictionary[ngram].toLowerCase()
                  )[0]._id,
                  suggested: true,
                  createdBy: userId, // Assigns pre-annotated documents to the project-manager... #TODO review
                  isEntity: true,
                  entityText: tokens.slice(index, index + ngramOrder).join(" "),
                };
              } else if (token === ngramTokens[0]) {
                // Unigram
                return {
                  textId: textObj._id,
                  start: index,
                  end: index,
                  labelId: flatEntityOntology.filter(
                    (l) =>
                      l.fullName.toLowerCase() ===
                      dictionary[ngram].toLowerCase()
                  )[0]._id,
                  suggested: true,
                  createdBy: userId, // Assigns pre-annotated documents to the project-manager... #TODO review
                  isEntity: true,
                  entityText: tokens.slice(index, index + 1).join(" "),
                };
              }
            })
            .filter((e) => e); // Filter out undefined spans

          console.log(textObj.original, spansTemp);

          return spansTemp;
        }
      })
      .filter((e) => e);

    console.log("annotatedEntities", annotatedEntities);
    return annotatedEntities;
  };

  let textClusterMapping;
  let clusterDetails;
  if (payload.performClustering) {
    // Send corpus to rank cluster server to get sentence ranking and cluster assignment
    // NOTE: Documents do not have IDS and are only associated by position indexing.
    logger.info("Performing clustering");

    async function fetchCorpusClusters() {
      return axios({
        headers: { "Content-Type": "application/json" },
        proxy: false,
        url: "http://server_cluster:8000/rank_cluster",
        method: "post",
        data: {
          corpus: filteredTexts.map((text) => text.replace('"', '\\"')), // Need to escape quotes otherwise this call will fail.
        },
      });
    }
    const clusterResponse = await fetchCorpusClusters();
    textClusterMapping = clusterResponse.data.clustered_corpus;
    clusterDetails = clusterResponse.data.cluster_details;
  }

  // text objects
  logger.info("Creating text objects");
  const textObjs = filteredTexts.map((text, textIndex) => ({
    original: text,
    tokens: text
      .split(" ")
      .filter((token) => token !== "") // cannot store empty strings in token array
      .map((token, index) => ({ index: index, value: token })),
    weight: 0, // TODO: Get REAL weight using ranking algortithm,
    rank: textIndex, // TODO: Get REAL rank from ranking weights; current just assigns based on input order
    cluster: payload.performClustering
      ? textClusterMapping[textIndex].cluster
      : 0, // Everything gets lumped into the same 'cluster' if no clustering is performed
    projectId: projectId,
  }));

  const textRes = await Text.insertMany(textObjs);
  const textObjectIds = textRes.map((text) => text._id);

  // const getPreannotatedTriples = (textObj) => {
  //   /**
  //    * Identifies entity mentions and created triples
  //    */

  //   console.log('textObj', textObj)

  //   const text = textObj.original;

  //   const tokens = textObj.original.split(" ");
  //   const dictionary = payload.typedTripleDictionary;

  //   console.log('dictionary', dictionary);

  //   const markup = dictionary.map((item) => {
  //     // console.log("dictionary item", item);

  //     console.log(text);

  //     console.log(text.includes(item.sourceSpan));

  //     if (text.includes(item.sourceSpan) && text.includes(item.targetSpan)) {
  //       const x = tokens.map((token, index) => {
  //         console.log("hello");

  //         console.log(token === item.sourceSpan.split(" ")[0]);

  //         if (
  //           token === item.sourceSpan.split(" ")[0] &&
  //           tokens[index + item.sourceSpan.split(" ").length] ===
  //             item.sourceSpan.split(" ")[item.sourceSpan.split(" ").length]
  //         ) {
  //           console.log(token);
  //         }
  //       });
  //     }
  //   });
  // };

  // if (Object.keys(payload.typedTripleDictionary).length > 0) {
  //   console.log("Preannotating triples");

  //   // Create entities
  //   const y = textRes.flatMap((text) => getPreannotatedTriples(text));

  //   // Create relations
  // }

  // Performing pre-annotation
  if (Object.keys(payload.entityDictionary).length > 0) {
    console.log("Pre-annotating entities");
    // console.log("dictionary", payload.entityDictionary);
    const entities = textRes.flatMap((text) => getPreannotatedEntities(text));
    await Markup.insertMany(entities);
    console.log("entities", entities);
  }

  // Add texts
  project.texts = textObjectIds;

  // Add annotator assignments
  project.annotators = [
    {
      user: userId,
      accessId: "",
      role: "projectManager",
      disabled: false,
      state: "accepted",
      assignment: textObjectIds,
    },
  ];
  // Add cluster details
  console.log("cluster details", clusterDetails);
  project.clusterDetails = payload.performClustering ? clusterDetails : {};
  project.save();

  return {
    data: {
      message: "project created successfully",
      projectId: projectId,
    },
    status: 200,
  };
};

const getDashboardOverview = async (projectId) => {
  const project = await Project.findById(
    { _id: projectId },
    { ontology: 0 }
  ).lean();

  const texts = await Text.find({
    projectId: projectId,
  }).lean();
  const markup = await Markup.find({
    textId: { $in: texts.map((t) => t._id) },
  }).lean();

  const textsWithMinAnnotations = texts.filter(
    (t) => t.saved.length >= parseInt(project.settings.annotatorsPerDoc)
  );

  return {
    data: {
      _id: project._id,
      totalTexts: texts.length,
      entities: markup.filter((m) => m.isEntity).length,
      triples: markup.filter((m) => !m.isEntity).length,
      textsWithMinAnnotations: textsWithMinAnnotations.length,
      averageIAA: {
        overall:
          textsWithMinAnnotations.length > 0
            ? Math.round(
                textsWithMinAnnotations
                  .map((t) => t.iaa.overall)
                  .reduce((a, b) => a + b) / textsWithMinAnnotations.length
              )
            : null,
        entity:
          textsWithMinAnnotations.length > 0
            ? Math.round(
                textsWithMinAnnotations
                  .map((t) => t.iaa.entity)
                  .reduce((a, b) => a + b) / textsWithMinAnnotations.length
              )
            : null,
        relation:
          textsWithMinAnnotations.length > 0
            ? Math.round(
                textsWithMinAnnotations
                  .map((t) => t.iaa.relation)
                  .reduce((a, b) => a + b) / textsWithMinAnnotations.length
              )
            : null,
      },
      progress: (textsWithMinAnnotations.length / texts.length) * 100,
    },
    status: 200,
  };
};

const getDashboardOverviewPlot = async (payload, projectId) => {
  const project = await Project.findById({
    _id: projectId,
  })
    .populate("texts")
    .lean();

  const annotatorColours = await User.find(
    { _id: { $in: project.annotators.map((a) => a.user) } },
    { _id: 1, colour: 1, username: 1 }
  ).lean();
  // console.log(annotatorColours);

  const flatOntology = getFlatOntology(project.ontology);

  logger.info(`Flat ontology size: ${flatOntology.length}`);

  const taskIsClosedRelationAnnotation =
    project.tasks.relationAnnotationType === "closed";

  let labels;
  let datasets;
  let silverLabels;
  let weakLabels;
  let silverLabelColours;
  let weakLabelColours;
  let labelId2LabelDetail;
  let labelFullName2Colour;
  let dates;
  let response;
  let failed = false;

  switch (payload.type) {
    case "overall":
      logger.info("Fetching overall progress");
      // Get number of annotated documents per day for all users
      const overallDistribution = await Text.aggregate([
        {
          $match: {
            projectId: mongoose.Types.ObjectId(projectId),
            saved: {
              $gt: {
                $size: 0,
              },
            },
          },
        },
        {
          $set: {
            updatedAtDate: {
              $dateFromParts: {
                year: {
                  $year: "$updatedAt",
                },
                month: {
                  $month: "$updatedAt",
                },
                day: {
                  $dayOfMonth: "$updatedAt",
                },
              },
            },
          },
        },
        {
          $unwind: {
            path: "$saved",
          },
        },
        {
          $group: {
            _id: {
              user: "$saved.createdBy",
              date: "$updatedAtDate",
            },
            count: {
              $sum: 1,
            },
            saved_docs: {
              $push: "$_id",
            },
          },
        },
        {
          $group: {
            _id: "$_id.user",
            distribution: {
              $push: {
                date: "$_id.date",
                count: "$count",
              },
            },
          },
        },
      ])
        .allowDiskUse(true)
        .exec();

      // Transform data for plot
      dates = overallDistribution.flatMap((user) =>
        user.distribution.flatMap((d) => d.date)
      );
      const sortedLabels = dates.sort((a, b) => {
        return new Date(a) - new Date(b);
      });
      labels = [
        ...new Set(sortedLabels.map((date) => date.toLocaleDateString())),
      ];
      datasets = overallDistribution.map((user) => {
        return {
          id: user._id,
          label: annotatorColours.filter(
            (a) => a._id.toString() == user._id.toString()
          )[0].username,
          data: labels.map((date) =>
            user.distribution.filter(
              (obj) => obj.date.toLocaleDateString() === date
            ).length > 0
              ? user.distribution.filter(
                  (obj) => obj.date.toLocaleDateString() === date
                )[0].count
              : 0
          ),
          backgroundColor: annotatorColours.filter(
            (a) => a._id.toString() == user._id.toString()
          )[0].colour,
        };
      });

      response = { labels: labels, datasets: datasets };
      console.log(response);
      break;
    case "entity":
      logger.info("Fetching entity label distribution");

      labelId2LabelDetail = Object.assign(
        {},
        ...flatOntology
          .filter((i) => i.isEntity)
          .map((label) => ({ [label._id]: label }))
      );

      labelFullName2Colour = Object.assign(
        {},
        ...flatOntology
          .filter((i) => i.isEntity)
          .map((label) => ({ [label.fullName]: label.colour }))
      );
      console.log("labelFullName2Colour", labelFullName2Colour);

      const entities = await Markup.find({
        textId: { $in: project.texts.map((t) => t._id) },
        isEntity: true,
      }).lean();

      // console.log("entities", entities);
      // console.log(entities.filter((span) => !span.suggested));

      silverLabels = entities
        .filter((entity) => !entity.suggested)
        .map((entity) => labelId2LabelDetail[entity.labelId].fullName);
      // console.log("silverLabels", silverLabels);

      weakLabels = entities
        .filter((entity) => entity.suggested)
        .map((entity) => labelId2LabelDetail[entity.labelId].fullName);

      // console.log("weakLabels", weakLabels);

      break;
    case "relation":
      labelId2LabelDetail = Object.assign(
        {},
        ...flatOntology
          .filter((i) => !i.isEntity)
          .map((label) => ({ [label._id]: label }))
      );

      // Note: colour added here for consistency; relations do not have native colours.
      // colour: utils.getRandomColor(),
      labelFullName2Colour = Object.assign(
        {},
        ...flatOntology
          .filter((i) => !i.isEntity)
          .map((label) => ({ [label.fullName]: utils.getRandomColor() }))
      );
      console.log("labelFullName2Colour", labelFullName2Colour);

      const relations = await Markup.find({
        textId: { $in: project.texts.map((t) => t._id) },
        isEntity: false,
      }).lean();

      silverLabels = relations
        .filter((relation) => !relation.suggested)
        .map((relation) =>
          taskIsClosedRelationAnnotation
            ? labelId2LabelDetail[relation.labelId].fullName
            : relation.labelText
        );

      // console.log(silverLabels);

      weakLabels = relations
        .filter((relation) => relation.suggested)
        .map((relation) =>
          taskIsClosedRelationAnnotation
            ? labelId2LabelDetail[relation.labelId].fullName
            : relation.labelText
        );

      console.log("silverlabels", silverLabels, "weaklabels", weakLabels);

      break;
    case "triple":
      logger.info("Fetching triple distribution");

      labelId2LabelDetail = Object.assign(
        {},
        ...flatOntology.map((label) => ({
          [label._id]: label,
        }))
      );

      const triples = await Markup.find({
        textId: { $in: project.texts.map((t) => t._id) },
        isEntity: false,
      })
        .populate("source target")
        .lean();

      console.log("triples", triples);

      // Minify triples
      const minTriples = triples.map((t) => ({
        triple: `(${labelId2LabelDetail[t.source.labelId].fullName}, ${
          labelId2LabelDetail[t.target.labelId].fullName
        }, ${
          taskIsClosedRelationAnnotation
            ? labelId2LabelDetail[t.labelId].fullName
            : t.labelText
        })`,
        suggested: t.suggested,
      }));

      // console.log("minTriples", minTriples);

      let counts = {};
      minTriples.forEach((obj) => {
        var key = JSON.stringify(obj);
        counts[key] = (counts[key] || 0) + 1;
      });

      // console.log("counts", counts);

      // Sort counts highest to lowest
      counts = Object.fromEntries(
        Object.entries(counts).sort(([, a], [, b]) => b - a)
      );

      // console.log('sorted counts',counts);

      // Transform into dataset for plot
      datasets = [];
      Object.keys(counts).forEach((key, index) => {
        const data = JSON.parse(key);
        datasets.push({
          id: index, //data.triple
          label: `${data.suggested ? "W" : ""}${data.triple}`,
          data: Object.keys(counts).map((key2) =>
            key2 === key ? counts[key] : 0
          ),
          backgroundColor: data.suggested ? "white" : "#b0bec5",
          borderColor: data.suggested ? "#b0bec5" : "white",
          borderWidth: data.suggested ? 2 : 0,
        });
      });

      labels = [...new Set(datasets.map((d) => d.label))];

      response = { labels: labels, datasets: datasets };

      break;
    default:
      failed = true;
      response = {
        message: "An unexpected issue occurred 😞 - please try again",
      };
  }

  if (["entity", "relation"].includes(payload.type)) {
    const silverLabelFreqs = silverLabels.reduce((obj, e) => {
      obj[e] = (obj[e] || 0) + 1;
      return obj;
    }, {});

    console.log("silverLabelFreqs", silverLabelFreqs);

    const weakLabelFreqs = weakLabels.reduce((obj, e) => {
      obj[e] = (obj[e] || 0) + 1;
      return obj;
    }, {});

    console.log("weakLabelFreqs", weakLabelFreqs);

    // Order silver and weak labels - if label doesn't exist then gives 0
    const labelNames = [
      ...new Set([
        ...Object.keys(silverLabelFreqs),
        ...Object.keys(weakLabelFreqs),
      ]),
    ];
    const silverLabelsFreqAligned = labelNames.map((name) =>
      Object.keys(silverLabelFreqs).includes(name) ? silverLabelFreqs[name] : 0
    );
    const weakLabelsFreqAligned = labelNames.map((name) =>
      Object.keys(weakLabelFreqs).includes(name) ? weakLabelFreqs[name] : 0
    );

    // Get colours for bars
    silverLabelColours = labelNames.map((name) => labelFullName2Colour[name]);
    weakLabelColours = labelNames.map((name) =>
      utils.addAlpha(labelFullName2Colour[name], 0.5)
    );

    response = {
      labels: labelNames.map((name) =>
        name.length > 25
          ? `...${name.slice(name.length - 22, name.length)}`
          : name
      ),
      datasets: [
        {
          id: 1,
          label: "silver",
          data: silverLabelsFreqAligned,
          backgroundColor: silverLabelColours,
          // borderColor: "black",
          // borderWidth: 1
        },
        {
          id: 2,
          label: "weak",
          data: weakLabelsFreqAligned,
          backgroundColor: "white",
          borderColor: weakLabelColours,
          borderWidth: 2,
          fill: false,
        },
      ],
    };
  }

  return { data: response, status: failed ? 500 : 200 };
};

const getDashboardAdjudication = async (payload, limit, skip, sort) => {
  console.log("ADJUDICATING!");
  const filters = payload.filters;

  const project = await Project.findById(
    { _id: payload.projectId },
    { annotators: 1, ontology: 1 }
  )
    .populate("annotators.user")
    .lean();

  const annotatorId2UserDetail = Object.assign(
    {},
    ...project.annotators.map((a) => ({
      [a.user._id]: { username: a.user.username, colour: a.user.colour },
    }))
  );

  console.log("annotatorId2UserDetail", annotatorId2UserDetail);

  let text = await Text.aggregate([
    {
      $match: {
        projectId: mongoose.Types.ObjectId(payload.projectId),
      },
    },
    {
      $addFields: {
        save_count: { $size: "$saved" },
      },
    },
    {
      $sort: { save_count: sort },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ])
    .allowDiskUse(true)
    .exec();
  text = text[0];

  const tokens = text.tokens;

  const markup = await Markup.find({ textId: text._id })
    .populate("source target")
    .lean();
  const relations = markup.filter((m) => !m.isEntity);
  const entities = markup.filter((m) => m.isEntity);
  // console.log(text, tokens, relations, entities);

  let triplesAll = [];
  relations.map((r) => {
    const sourceEntity = r.source;
    const targetEntity = r.target;

    // Check if triple exists; if it does - add new
    const checkArr = (t, r) => {
      console.log("checkArr ->", "t", t, "r", r);
      return [
        t.sourceTokenStart == sourceEntity.start,
        t.sourceTokenEnd == sourceEntity.end,
        t.targetTokenStart == targetEntity.start,
        t.targetTokenEnd == targetEntity.end,
      ];
    };

    if (
      triplesAll.filter((t) => checkArr(t, r).every((v) => v === true)).length >
      0
    ) {
      // If triple already found; add annotator to it.

      console.log("triplesAll", triplesAll);

      const tripleIndex = triplesAll.findIndex((v) =>
        checkArr(v, r).every((v) => v === true)
      );
      triplesAll[tripleIndex].createdBy.push(r.createdBy);
    } else {
      console.log("hello new triple");

      console.log(sourceEntity.entityText);
      console.log(r);

      const newTriple = {
        sourceTokenStart: sourceEntity.start,
        sourceTokenEnd: sourceEntity.end,
        sourceToken: sourceEntity.entityText,
        sourceLabelId: sourceEntity.labelId,
        targetTokenStart: targetEntity.start,
        targetTokenEnd: targetEntity.end,
        targetToken: targetEntity.entityText,
        targetLabelId: targetEntity.labelId,
        relationLabelId: r.labelId,
        createdBy: [r.createdBy],
      };

      console.log("newTriple", newTriple);
      triplesAll.push(newTriple);
      console.log("triplesAll", triplesAll);
    }
  });

  const checkEntityArr = (e1, e2) => {
    // e1 is the transformed entity with triple based key names and
    // e2 is the native entity
    return [
      e1.sourceTokenStart === e2.start,
      e1.sourceTokenEnd === e2.end,
      e1.sourceLabel === e2.label,
    ];
  };

  //   Entities that do not have relations
  let entitiesAll = [];
  entities
    .filter((entity) => !entity.suggested)
    .filter(
      (entity) =>
        !relations
          .flatMap((r) => [r.source._id.toString(), r.target._id.toString()])
          .includes(entity._id.toString())
    )
    .map((entity) => {
      if (
        entitiesAll.filter((e) =>
          checkEntityArr(e, entity).every((v) => v === true)
        ).length > 0
      ) {
        // If entity already exists, add annotator to it
        const entityIndex = entitiesAll.findIndex((e) =>
          checkEntityArr(e, entity).every((v) => v === true)
        );
        // console.log('existing entity')
        entitiesAll[entityIndex].createdBy.push(entity.createdBy);
      } else {
        // console.log("new entity");
        entitiesAll.push({
          sourceTokenStart: entity.start,
          sourceTokenEnd: entity.end,
          sourceLabelId: entity.labelId,
          sourceToken: entity.entityText,
          targetTokenStart: null,
          targetTokenEnd: null,
          targetToken: null,
          relationLabelId: null,
          createdBy: [entity.createdBy],
        });
      }
    });

  console.log("entitiesAll", entitiesAll);

  const getAggregateAnnotation = (
    triples,
    numberAnnotators,
    threshold = 0.8
  ) => {
    // Marks triples with 'aggregate' status if it meets threshold condition
    const filteredTriples = triples.map((triple) => ({
      ...triple,
      aggregate: triple.createdBy.length / numberAnnotators >= threshold,
    }));

    return filteredTriples;
  };

  console.log("text", text);

  return {
    data: {
      content: {
        ...text,
        saved: text.saved.map((s) => ({
          ...s,
          username: annotatorId2UserDetail[s.createdBy].username,
          colour: annotatorId2UserDetail[s.createdBy].colour,
        })),
      },
      triples: getAggregateAnnotation(
        [...triplesAll, ...entitiesAll],
        text.saved.length
      ),
      ontology: getFlatOntology(project.ontology),
    },
    status: 200,
  };
};

const getAnnotatorEffort = async (payload, projectId) => {
  const filters = payload.filters;
  const project = await Project.findById(
    { _id: projectId },
    { annotators: 1, tasks: 1 }
  )
    .populate({
      path: "annotators.user",
      select: { colour: 1, username: 1, _id: 1 }, // User is the id on the project annotators array
    })
    .lean();

  const performingRelationAnnotation = project.tasks.relationAnnotation;
  const annotators = project.annotators.map((a) => ({
    ...a.user,
    _id: a.user._id.toString(),
  }));

  // APPLY FILTERS
  let saveMatch;
  switch (filters.saved) {
    case "any":
      saveMatch = { saved: { $exists: true } };
      break;
    case "yes":
      saveMatch = { $expr: { $gt: [{ $size: "$saved" }, 0] } };
      break;
    case "no":
      saveMatch = { saved: { $size: 0 } };
      break;
    default:
      saveMatch = { saved: { $exists: true } };
      break;
  }

  const iaaMatch =
    parseInt(filters.iaa) === 0
      ? {}
      : {
          [performingRelationAnnotation ? "iaa.overall" : "iaa.entity"]: {
            $gte: parseInt(filters.iaa),
          },
        };

  const texts = await Text.find(
    {
      projectId: projectId,
      ...saveMatch,
      ...iaaMatch,
    },
    { _id: 1, saved: 1 }
  ).lean();
  // console.log(texts);
  const textIds = texts.map((t) => t._id);

  // console.log(texts);

  const markup = await Markup.find({
    textId: { $in: textIds },
    suggested:
      filters.quality === "silver"
        ? false
        : filters.quality === "weak"
        ? true
        : { $exists: true },
  });

  const triples = markup.filter((m) => !m.isEntity);
  const entities = markup.filter((m) => m.isEntity);
  const savedTexts = texts.filter((text) => text.saved.length > 0);
  const savedTextIds = savedTexts.map((t) => t._id.toString());
  const savedTriples = triples.filter((t) =>
    savedTextIds.includes(t.textId.toString())
  );
  const savedEntities = entities.filter((e) =>
    savedTextIds.includes(e.textId.toString())
  );

  const results = annotators.map((annotator) => {
    const fEntities = entities.filter(
      (entity) => entity.createdBy == annotator._id
    );
    const fTriples = triples.filter(
      (triple) => triple.createdBy == annotator._id
    );

    const fSavedEntities = savedEntities.filter(
      (ss) => ss.createdBy == annotator._id
    );
    const fSavedTriples = savedTriples.filter(
      (ss) => ss.createdBy == annotator._id
    );

    return {
      [annotator._id]: {
        entities: {
          total: fEntities.length,
          silver: fEntities.filter((entity) => !entity.suggested).length,
          weak: fEntities.filter((entity) => entity.suggested).length,
          saved: fSavedEntities.length,
        },
        triples: {
          total: fTriples.length,
          saved: fSavedTriples.length,
        },
      },
    };
  });

  const goldResults = {
    ["gold"]: {
      entities: {
        total: entities.length,
        gold: entities.filter((entity) => !entity.suggested).length,
        weak: entities.filter((entity) => entity.suggested).length,
        saved: savedEntities.length,
      },
      triples: {
        total: triples.length,
        saved: savedTriples.length,
      },
    },
  };

  return {
    data: {
      annotators: [
        ...annotators,
        { _id: "gold", colour: "#ffc107", username: "Gold" },
      ],
      results: Object.assign({}, ...[...results, goldResults]),
    },
    status: 200,
  };
};

const getAnnotationDownload = async (payload, projectId) => {
  const filters = payload.filters;
  logger.info("Download filters", filters);

  const project = await Project.findById(
    { _id: payload.projectId },
    { ontology: 1, tasks: 1, settings: 1 }
  ).lean();

  labelId2LabelDetail = Object.assign(
    {},
    ...getFlatOntology(project.ontology).map((label) => ({
      [label._id]: label,
    }))
  );

  const performingRelationAnnotation = project.tasks.relationAnnotation;
  const annotatorsPerDoc = project.settings.annotatorsPerDoc;
  logger.info("Loaded ontologies");

  let saveMatch;
  switch (filters.saved) {
    case "any":
      saveMatch = { saved: { $exists: true } };
      break;
    case "yes":
      saveMatch = { $expr: { $gt: [{ $size: "$saved" }, 0] } };
      break;
    case "no":
      saveMatch = { saved: { $size: 0 } };
      break;
    default:
      saveMatch = { saved: { $exists: true } };
      break;
  }

  // If filter is 0; return everything as iaa on unsaved docs are null.
  const iaaMatch =
    parseInt(filters.iaa) === 0
      ? {}
      : {
          [performingRelationAnnotation ? "iaa.overall" : "iaa.entity"]: {
            $gte: parseInt(filters.iaa),
          },
        };

  const texts = await Text.find({
    projectId: payload.projectId,
    ...saveMatch,
    ...iaaMatch,
  }).lean();
  const textIds = texts.map((t) => t._id);
  const markup = await Markup.find({
    textId: { $in: textIds },
    suggested:
      filters.quality === "silver"
        ? false
        : filters.quality === "weak"
        ? true
        : { $exists: true },
  })
    .populate("source target")
    .lean();

  logger.info(`${texts.length} Documents matched`);

  const markupSurfaceText = (source, target, tokens) => {
    // Provided the token indexes for source and target spans and the token set for a given text
    // this function highlights their realisations at the surface level
    // e.g. source: {start: 0, end: 1}, target: {start, 5, end: 5}, surfaceTextTokens: [hello, world, my name, is, tyler], the resulting surfaceText is: "[[hello world]] my name is [[tyler]]".
    // Note: This borrows from the conceptnet format: https://github.com/commonsense/conceptnet5/wiki/API#surfacetext

    const surfaceTokens = [...tokens]; // Stops array from accumulating
    surfaceTokens[source.start] = "[[" + surfaceTokens[source.start];
    surfaceTokens[target.start] = "[[" + surfaceTokens[target.start];
    surfaceTokens[target.end] = surfaceTokens[target.end] + "]]";
    surfaceTokens[source.end] = surfaceTokens[source.end] + "]]";
    return surfaceTokens.join(" ");
  };

  let response;
  let failed = false;
  switch (filters.annotationType) {
    case "triples":
      const tripleAnnotations = filters.annotators.map((annotatorInfo) => {
        const annotatorUsername = annotatorInfo.username;
        const annotatorId = annotatorInfo._id;
        logger.info(`Processing annotation for ${annotatorUsername}`);

        const taskIsClosedRelationAnnotation =
          project.tasks.relationAnnotationType === "closed";

        if (annotatorId.toLowerCase() === "gold") {
          // These are aggregate annotations.
          const savedTexts = texts.filter(
            (t) => t.saved.length >= annotatorsPerDoc
          );

          // CODE BORROWED FROM ADJUDICATION ENDPOINT
          const goldTriples = savedTexts.map((text) => {
            const tokens = text.tokens;
            const relations = markup.filter(
              (m) => !m.isEntity && m.textId.toString() === text._id.toString()
            );

            let triplesAll = [];
            relations.map((r) => {
              console.log("relations", r);

              const sourceEntity = r.source;
              const targetEntity = r.target;

              // Check if triple exists; if it does - add new
              const checkArr = (t, r) => {
                console.log(t, r);
                return [
                  t.source.label == r.source_label,
                  t.source.start == sourceEntity.start,
                  t.source.end == sourceEntity.end,
                  t.target.label == r.target_label,
                  t.target.start == targetEntity.start,
                  t.target.end == targetEntity.end,
                  t.relation.label == r.label,
                ];
              };

              if (
                triplesAll.filter((t) =>
                  checkArr(t, r).every((v) => v === true)
                ).length > 0
              ) {
                // If triple already found; add annotator to it.
                const tripleIndex = triplesAll.findIndex((v) =>
                  checkArr(v, r).every((v) => v === true)
                );
                triplesAll[tripleIndex].createdBy.push(r.createdBy);
              } else {
                triplesAll.push({
                  source: {
                    fullLabel:
                      labelId2LabelDetail[sourceEntity.labelId].fullName,
                    label: labelId2LabelDetail[sourceEntity.labelId].name,
                    start: sourceEntity.start,
                    end: sourceEntity.end,
                    value: sourceEntity.entityText,
                    tokens: sourceEntity.entityText.split(" "),
                    quality: "gold",
                  },
                  target: {
                    fullLabel:
                      labelId2LabelDetail[targetEntity.labelId].fullName,
                    label: labelId2LabelDetail[targetEntity.labelId].name,
                    start: targetEntity.start,
                    end: targetEntity.end,
                    value: targetEntity.entityText,
                    tokens: targetEntity.entityText.split(" "),
                    quality: "gold",
                  },
                  relation: {
                    fullLabel: labelId2LabelDetail[r.labelId].fullName,
                    label: labelId2LabelDetail[r.labelId].name,
                    quality: "gold",
                  },
                  surfaceText: markupSurfaceText(
                    sourceEntity,
                    targetEntity,
                    tokens.map((t) => t.value)
                  ), // Note either source/target can be used here, they are realized on the same document.
                  createdBy: [r.createdBy],
                });
              }
            });

            const getAggregateAnnotation = (
              triples,
              numberAnnotators,
              threshold = filters.iaa === 0 ? 0 : filters.iaa / 100
            ) => {
              // Marks triples with 'aggregate' status if meeting condition
              const filteredTriples = triples
                .filter((triple) => {
                  // console.log(
                  //   triple.createdBy.length / numberAnnotators
                  // );
                  // console.log(threshold);
                  return (
                    triple.createdBy.length / numberAnnotators >= threshold
                  );
                })
                .map((triple) => {
                  delete triple.createdBy;
                  return triple;
                });
              return filteredTriples;
            };

            const aggregateTriples = getAggregateAnnotation(
              triplesAll,
              annotatorsPerDoc
            );

            const payload = {
              docId: text._id,
              tokens: text.tokens.map((t) => t.value),
              triples: aggregateTriples,
            };

            return payload;
          });

          return { [annotatorUsername]: goldTriples };
        } else {
          // Filter texts for those that have relations and include the annotator

          // if (project.tasks.relationAnnotationType === "open") {
          //   logger.info("Generating open relation triples for users");
          // } else {
          const allTriples = texts.map((text) => {
            let triples = markup
              .filter(
                (m) =>
                  !m.isEntity &&
                  m.createdBy.toString() === annotatorId.toString() &&
                  m.textId.toString() === text._id.toString()
              )
              .map((r) => {
                return {
                  saved:
                    text.saved.filter(
                      (s) => s.createdBy.toString() === annotatorId.toString()
                    ).length > 0,
                  source: {
                    fullLabel: labelId2LabelDetail[r.source.labelId].fullName,
                    label: labelId2LabelDetail[r.source.labelId].name,
                    start: r.source.start,
                    end: r.source.end,
                    value: r.source.entityText,
                    tokens: r.source.entityText.split(" "),
                    quality: r.source.suggested ? "weak" : "silver",
                  },
                  target: {
                    fullLabel: labelId2LabelDetail[r.target.labelId].fullName,
                    label: labelId2LabelDetail[r.target.labelId].name,
                    start: r.target.start,
                    end: r.target.end,
                    value: r.target.entityText,
                    tokens: r.target.entityText.split(" "),
                    quality: r.target.suggested ? "weak" : "silver",
                  },
                  relation: {
                    ...(taskIsClosedRelationAnnotation && {
                      fullLabel: labelId2LabelDetail[r.labelId].fullName,
                    }),
                    label: taskIsClosedRelationAnnotation
                      ? labelId2LabelDetail[r.labelId].name
                      : r.labelText,
                    ...(!taskIsClosedRelationAnnotation && {
                      start: parseInt(r.labelStart),
                    }),
                    ...(!taskIsClosedRelationAnnotation && {
                      end: parseInt(r.labelEnd),
                    }),
                    quality: r.suggested ? "weak" : "silver",
                  },
                  surfaceText: markupSurfaceText(
                    r.source,
                    r.target,
                    text.tokens.map((t) => t.value)
                  ), // Note either source/target can be used here, they are realized on the same document.
                };
              });

            if (triples.length > 0) {
              return {
                docId: text._id,
                tokens: text.tokens.map((t) => t.value),
                triples: triples,
                weight: 1, // Indicates how beliaveable information is; could be based on user confidence, source of text, etc.
              };
            }
          });
          // }

          return { [annotatorUsername]: allTriples };
        }
      });

      response = {
        meta: {
          filters: {
            ...filters,
            annotators: filters.annotators.map((a) => a.username),
          },
        },
        annotations: tripleAnnotations,
      };
      break;
    case "entities":
      const entityAnnotations = filters.annotators.map((annotatorInfo) => {
        const annotatorUsername = annotatorInfo.username;
        const annotatorId = annotatorInfo._id;
        logger.info(`Processing annotation for ${annotatorUsername}`);

        if (annotatorId.toLowerCase() === "gold") {
          const savedTexts = texts.filter(
            (t) => t.saved.length >= annotatorsPerDoc
          );

          const goldEntities = savedTexts.map((text) => {
            const checkEntityArr = (e1, e2) => {
              // e1 is the transformed entity with triple based key names and
              // e2 is the native entity
              // console.log("e1", e1, "e2", e2);
              return [
                e1.start === e2.start,
                e1.end === e2.end,
                e1.label === e2.label,
                e1.labelId.toString() === e2.labelId.toString(),
              ];
            };

            const entities = markup.filter((m) => m.isEntity);

            let entitiesAll = [];
            entities
              .filter((entity) => !entity.suggested)
              .map((entity) => {
                console.log(entity);

                if (
                  entitiesAll.filter((e) =>
                    checkEntityArr(e, entity).every((v) => v === true)
                  ).length > 0
                ) {
                  // If entity already exists, add annotator to it
                  const entityIndex = entitiesAll.findIndex((e) =>
                    checkEntityArr(e, entity).every((v) => v === true)
                  );
                  // console.log('existing entity')
                  entitiesAll[entityIndex].createdBy.push(entity.createdBy);
                } else {
                  entitiesAll.push({
                    start: entity.start,
                    end: entity.end,
                    labelId: entity.labelId,
                    suggested: entity.suggested,
                    tokens: text.tokens
                      .map((t) => t.value)
                      .slice(entity.start, entity.end + 1)
                      .map((t) => t.value)
                      .join(" "),
                    createdBy: [entity.createdBy],
                  });
                }
              });

            const getAggregateAnnotation = (
              entities,
              numberAnnotators,
              threshold = filters.iaa === 0 ? 0 : filters.iaa / 100
            ) => {
              console.log(entities);
              const filteredEntities = entities
                .filter((entity) => {
                  console.log(entity);
                  return (
                    entity.createdBy.length / numberAnnotators >= threshold
                  );
                })
                .map((entity) => {
                  delete entity.createdBy;
                  return entity;
                });
              return filteredEntities;
            };

            logger.info("Aggregating annotations");

            const aggregateEntities = getAggregateAnnotation(
              entitiesAll,
              annotatorsPerDoc
            );

            const payload = {
              docId: text._id,
              tokens: text.tokens.map((token) => token.value),
              mentions: aggregateEntities.map((e) => ({
                start: e.start,
                end: e.end,
                label: labelId2LabelDetail[e.labelId].fullName,
                quality: "gold",
              })),
            };

            return payload;
          });

          return { [annotatorUsername]: goldEntities };
        } else {
          const entities = texts.map((text) => ({
            docId: text._id,
            tokens: text.tokens.map((token) => token.value),
            saved:
              text.saved.filter(
                (s) => s.createdBy.toString() === annotatorId.toString()
              ).length > 0,
            mentions: markup
              .filter(
                (m) =>
                  m.isEntity &&
                  m.createdBy.toString() === annotatorId.toString() &&
                  m.textId.toString() === text._id.toString()
              )
              .map((entity) => ({
                start: entity.start,
                end: entity.end,
                label: labelId2LabelDetail[entity.labelId].fullName,
                quality: entity.suggested ? "weak" : "silver",
              })),
          }));

          return { [annotatorUsername]: entities };
        }
      });
      response = {
        meta: {
          filters: {
            ...filters,
            annotators: filters.annotators.map((a) => a.username),
          },
        },
        annotations: entityAnnotations,
      };
      break;
    default:
      failed = true;
      response = {
        detail: "Server error - failed to create download. Please try again.",
      };
  }

  if (failed) {
    return {
      data: {
        detail: response,
      },
      status: 500,
    };
  } else {
    return { data: response, status: 200 };
  }
};

const getGraphData = async (payload, query, projectId, userId) => {
  let response;
  let failed = false;

  const project = await Project.findById(
    { _id: projectId },
    { ontology: 1, _id: 0, tasks: 1 }
  ).lean();

  // Flatten entity and relation ontologies
  const flatOntology = getFlatOntology(project.ontology);
  const labelId2LabelDetail = Object.assign(
    {},
    ...flatOntology.map((label) => ({
      [label._id]: label,
    }))
  );

  const taskIsClosedRelationAnnotation =
    project.tasks.relationAnnotationType === "closed";

  console.log("closed RE task", taskIsClosedRelationAnnotation);

  /*
    Get all classes that are used and filter ontologies for these
    makes users unable to select classes that do not have data
  */
  const textsWithIds = await Text.find(
    {
      projectId: projectId,
      original:
        payload.filters.searchTerm === ""
          ? { $exists: true }
          : {
              $regex: new RegExp(payload.filters.searchTerm),
              $options: "i",
            },
    },
    { _id: 1 }
  ).lean();

  console.log("textsWithIds", textsWithIds);

  const activeMarkup = await Markup.find({
    textId: { $in: textsWithIds.map((t) => t._id) },
    createdBy: payload.aggregate ? { $exists: true } : userId,
    suggested: payload.filters.showWeak ? { $exists: true } : false,
  }).lean();

  console.log("activeMarkup", activeMarkup);

  const activeLabelIds = [...new Set(activeMarkup.map((m) => m.labelId))];
  const activelabelFullNames = [
    ...new Set(activeLabelIds.map((i) => labelId2LabelDetail[i].fullName)),
  ];

  console.log("activelabelFullNames", activelabelFullNames);
  const activeOntology = filterOntology(project.ontology, activelabelFullNames);

  console.log("activeOntology", activeOntology);

  /* 
    Fetch graph data
    - Aggregate graph:
    - Separated graph: only shows markup made by the current user
  */

  const texts = await Text.find({
    projectId: projectId,
    original:
      payload.filters.searchTerm === ""
        ? { $exists: true }
        : {
            $regex: new RegExp(payload.filters.searchTerm),
            $options: "i",
          },
  });
  const textIds = texts.map((t) => t._id);

  logger.info(`Number of texts matched: ${textIds.length}`);

  let markup = await Markup.find({
    textId: { $in: textIds },
    createdBy: payload.aggregate ? { $exists: true } : userId,
    suggested: payload.filters.showWeak ? { $exists: true } : false,
    labelId:
      payload.filters.labelIds.length > 0
        ? { $nin: payload.filters.labelIds }
        : { $exists: true },
  })
    .populate("source target")
    .lean();

  console.log(`Total markup ${markup.length}`);

  // Filter out relations (+ their source/targets)
  markup = markup.filter((m) => {
    if (m.isEntity) {
      return !payload.filters.labelIds.includes(m.labelId);
    } else {
      // Check if relation is excluded or its entities are.
      return [m.labelId, m.source.labelId, m.target.labelId].every(
        (l) => !payload.filters.labelIds.includes(l)
      );
    }
  });

  console.log(
    `Total markup after filtering out excluded labelIds ${markup.length}`
  );

  // Combine standalone entities and entities that are on relations
  let entities = [
    ...markup.filter((m) => m.isEntity),
    ...markup.filter((m) => !m.isEntity).flatMap((m) => [m.source, m.target]),
  ];
  // Filter entities (duplicates from relations might be present)
  entities = [...new Map(entities.map((v) => [JSON.stringify(v), v])).values()];

  logger.info(`Number of markups: ${markup.length}`);

  if (entities.length === 0) {
    logger.info("Filtered data doesnt contain any entities");

    response = {
      data: {
        nodes: [],
        edges: [],
      },
      classes: { nodes: null, edges: null },
      metrics: {
        totalDocs: 0,
        totalNodes: 0,
        totalEdges: 0,
      },
      ontology: project.ontology,
      labelIds: [],
    };
  } else {
    logger.info("Nodes and edges exist in markup");
    // Add information to node/relations

    let nodes = entities;
    let edges = markup.filter((m) => !m.isEntity);

    logger.info(`Number of nodes: ${nodes.length}`);

    // Add additional information to nodes and reduce size to (300)

    // console.log(labelId2LabelDetail[n.labelId])
    nodes = nodes.slice(0, 2500).map((n) => {
      const nodeColour = labelId2LabelDetail[n.labelId].colour;
      return {
        id: n._id,
        label: n.entityText,
        labelId: n.labelId,
        class: labelId2LabelDetail[n.labelId].name,
        textId: n.textId,
        title: `Class: ${labelId2LabelDetail[n.labelId].fullName}`,
        hidden: false,
        hiddenLabel: n.entityText,
        tokenIndexStart: n.start,
        tokenIndexEnd: n.end,
        suggested: n.suggested,
        font: {
          color: getFontColour(nodeColour),
        },
        color: {
          border: nodeColour,
          background: n.suggested ? addAlpha(nodeColour, 0.6125) : nodeColour,
        },
        borderWidth: n.suggested ? 2 : 0,
        shapeProperties: {
          borderDashes: false,
        },
      };
    });

    // console.log(nodes);

    const filteredNodesIds = nodes.map((n) => n.id.toString());
    // console.log("filteredNodesIds", filteredNodesIds);
    // console.log(edges);

    edges = edges
      .filter(
        (e) =>
          filteredNodesIds.includes(e.source._id.toString()) ||
          filteredNodesIds.includes(e.target._id.toString())
      )
      .map((e, index) => ({
        id: index,
        from: e.source._id,
        to: e.target._id,
        label: labelId2LabelDetail[e.labelId].name,
        labelId: e.labelId,
        arrows: "to",
        hidden: false,
        hiddenLabel: labelId2LabelDetail[e.labelId].name,
        textId: e.textId,
        suggested: e.suggested,
        dashes: e.suggested,
      }));

    logger.info(`Number of edges: ${edges.length}`);

    // const filterNodes = (nodes, edges) => {
    //   // Filters nodes based on whether they are connected.
    //   const connectedNodes = edges
    //     .flatMap((e) => [e.from, e.to])
    //     .map((id) => id.toString());
    //   // console.log(connectedNodes);

    //   return nodes.filter((n) => connectedNodes.includes(n.id.toString()));
    // };

    const buildSeparatedGraph = () => {
      /*
           * Generates nodes, edges and groups for a seperated graph. A separated graph is a set of
             sub-graphs generated from document annotation.
          */

      response = {
        data: {
          nodes: nodes,
          edges: edges,
        },
        metrics: {
          totalDocs: new Set(nodes.map((n) => n.textId.toString())).size,
          totalNodes: nodes.length,
          totalEdges: edges.length,
        },
        labelIds: payload.filters.labelIds, //getFlatOntology(filteredActiveOntology).map((item) => item._id),
        ontology: activeOntology,
      };
    };

    const buildAggregateGraph = () => {
      /*
            Aggregates entity and relations based on type/lexical content
            Given two entities - {value: pump, type: activity} and {value: pump, type: item},
            each will be considered unique.

            Note: frequencies include both silver and weak labels.
          */

      // Create unique set of 'super' nodes
      // Ignores _ids and returns unique set of label/type pairs
      let superNodes = nodes
        .map((n) => ({
          label: n.label,
          class: n.class,
          color: n.color,
          hidden: n.hidden,
          font: n.font,
        }))
        .filter(
          (tag, index, array) =>
            array.findIndex(
              (t) => t.label == tag.label && t.class == tag.class
            ) == index
        );

      console.log(superNodes);

      // Add node _ids to super nodes
      superNodes = superNodes.map((sn, snIndex) => {
        const filteredNodeIds = nodes
          .filter((n) => n.class == sn.class && n.label == sn.label)
          .map((n) => n.id);
        return {
          ...sn,
          id: snIndex,
          nodeIds: filteredNodeIds,
          value: filteredNodeIds.length,
          title: `Type: ${sn.class}. Frequency: ${filteredNodeIds.length}.`,
        };
      });

      console.log("sn v2", superNodes);

      // Create set of 'super' edges
      console.log("edges before superEdges", edges);

      // - Converts nodes on standard edges into the nodes in the superNodes
      const superEdges = edges.map((edge, edgeIndex) => {
        const fromNode = edge.from.toString();
        const toNode = edge.to.toString();
        // No clue why these node ids need to be cast toString()
        const newFromNode = superNodes.filter((sn) =>
          sn.nodeIds.map((n) => n.toString()).includes(fromNode)
        )[0].id;
        const newToNode = superNodes.filter((sn) =>
          sn.nodeIds.map((n) => n.toString()).includes(toNode)
        )[0].id;

        // console.log('edge', edge)
        // console.log('newFromNode',newFromNode)
        // console.log('newToNode',newToNode)

        return {
          id: edgeIndex,
          from: newFromNode,
          to: newToNode,
          label: edge.label,
        };
      });
      console.log("superEdges", superEdges);

      // Group edges by from/to and label; remove duplicates and add count of relations
      const superEdgesWithCounts = superEdges.map((se) => {
        const count = superEdges.filter(
          (se1) =>
            se1.from == se.from && se1.to == se.to && se1.label == se.label
        ).length;

        return { ...se, value: count, title: `Frequency: ${count}` };
      });

      // console.log(
      //   "superEdgesWithCounts",
      //   superEdgesWithCounts,
      //   "count",
      //   superEdgesWithCounts.length
      // );

      // remove duplicate edges and reindex from 0
      const superEdgesGrouped = superEdgesWithCounts.reduce((acc, curr) => {
        const alreadyExists = acc.some(
          (item) =>
            item.from == curr.from &&
            item.to == curr.to &&
            item.label == curr.label
        );
        return alreadyExists ? acc : [...acc, curr];
      }, []);

      // console.log(
      //   "superEdgesGrouped",
      //   superEdgesGrouped,
      //   "count",
      //   superEdgesGrouped.length
      // );

      // Reindex edges
      const superEdgesReindexed = superEdgesGrouped.map((edge, index) => ({
        ...edge,
        id: index,
      }));

      // const fSuperNodes = filterNodes(superNodes, superEdgesReindexed);

      console.log("before aggregate response");
      response = {
        data: {
          nodes: superNodes, //fSuperNodes,
          edges: superEdgesReindexed,
        },
        metrics: {
          totalDocs: new Set(nodes.map((n) => n.textId.toString())).size,
          totalNodes: superNodes.length,
          totalEdges: superEdgesReindexed.length,
        },
        labelIds: payload.filters.labelIds,
        ontology: activeOntology,
      };
    };

    switch (payload.aggregate) {
      case true:
        logger.info("Building aggregated graph");
        buildAggregateGraph();
        break;
      case false:
        logger.info("Building seperated graph");
        buildSeparatedGraph();
        break;
      default:
        logger.error("Insufficient information provided");
        failed = true;
        response = { message: "Insufficient information provided" };
    }
  }

  return { data: response, status: failed ? 500 : 200 };
};

module.exports = {
  createProject,
  getDashboardOverview,
  getDashboardOverviewPlot,
  getDashboardAdjudication,
  getAnnotatorEffort,
  getAnnotationDownload,
  getGraphData,
};
