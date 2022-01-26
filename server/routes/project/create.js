const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const _ = require("lodash");
const authUtils = require("../auth/utils");
const Project = require("../../models/Project");
const Text = require("../../models/Text");
const axios = require("axios").default;

router.post("/create", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Creating project", { route: "/api/project/create" });
    const userId = authUtils.getUserIdFromToken(req.cookies.token);

    logger.info("Creating base project");
    const project = await Project.create({
      projectManager: userId,
      name: req.body.name,
      description: req.body.description,
      preprocessing: {
        lowerCase: req.body.lowerCase,
        removeDuplicates: req.body.removeDuplicates,
        charsRemoved: req.body.charsRemove,
        charset: req.body.charsetRemove,
      },
      entityOntology: req.body.entityOntology,
      relationOntology: req.body.relationOntology,
      settings: {
        performClustering: req.body.performClustering,
        annotatorsPerDoc: 1,
      },
      tasks: req.body.tasks,
    });
    const projectId = project._id;
    const entityOntology = project.entityOntology;
    const relationOntology = project.relationOntology;

    logger.info("Pre-processing texts");
    let texts = req.body.texts;
    texts = texts.map((text) => text.replace("\t", " ").replace("\r", " "));

    if (req.body.lowerCase) {
      texts = texts.map((text) => text.toLowerCase());
    }
    if (req.body.charsRemove) {
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
      const regexCharsEscaped = req.body.charsetRemove
        .split("")
        .map((char) => (escapedChars.includes(char) ? `\\${char}` : char));
      const regex = new RegExp("[" + regexCharsEscaped + "]", "g");
      texts = texts.map((text) => text.replace(regex, " "));
    }

    // remove multiple white spaces and trim
    texts = texts.map((text) => text.replace(/\s+/g, " ").trim());

    // remove texts that are empty after pre-processing
    let filteredTexts = texts
      .filter((text) => text.length > 0)
      .map((text) => text);

    // drop duplicates
    if (req.body.removeDuplicates) {
      filteredTexts = [...new Set(filteredTexts)];
    }

    logger.info("Performing pre-annotation");

    const getPreannotatedEntities = (text) => {
      const dictionary = req.body.entityDictionary;
      const tokens = text.split(" ");
      return Object.keys(dictionary)
        .map((ngram) => {
          if (text.includes(ngram)) {
            const ngramTokens = ngram.split(" ");
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
                    start: index,
                    end: index + ngramOrder - 1,
                    label: entityOntology.filter(
                      (l) =>
                        l.name.toLowerCase() === dictionary[ngram].toLowerCase()
                    )[0].name, // Handles for upper/lowercase; if ontology is 'Item' and dictionary is 'item', this will figure it out.
                    label_id: entityOntology.filter(
                      (l) =>
                        l.name.toLowerCase() === dictionary[ngram].toLowerCase()
                    )[0]._id,
                    suggested: true,
                    createdBy: userId, // Assigns pre-annotated documents to the project-manager... #TODO revise this...
                  };
                } else if (token === ngramTokens[0]) {
                  // Unigram
                  return {
                    start: index,
                    end: index,
                    label: entityOntology.filter(
                      (l) =>
                        l.name.toLowerCase() === dictionary[ngram].toLowerCase()
                    )[0].name, // Handles for upper/lowercase
                    label_id: entityOntology.filter(
                      (l) =>
                        l.name.toLowerCase() === dictionary[ngram].toLowerCase()
                    )[0]._id,
                    suggested: true,
                    createdBy: userId, // Assigns pre-annotated documents to the project-manager... #TODO revise this...
                  };
                }
              })
              .filter((e) => e); // Filter out undefined spans

            return spansTemp;
          }
        })
        .flat()
        .filter((e) => e);
    };

    logger.info("Performing semantic clustering");
    let textClusterMapping;
    let clusterDetails;
    if (req.body.performClustering) {
      // Send corpus to rank cluster server to get sentence ranking and cluster assignment
      // NOTE: Documents do not have IDS and are only associated by position indexing.
      // TODO: Make the call to cluster server less hacky and make the _id of each text the index
      // within the cluster server.
      console.log("Getting rank order clusters");
      async function fetchCorpusClusters() {
        return axios({
          headers: { "Content-Type": "application/json" },
          proxy: false,
          url: "http://192.168.1.104:8000/rank_cluster", // TODO: Figure out why this doesn't work with localhost, 0.0.0.0, etc.
          method: "post",
          data: {
            corpus: filteredTexts, //JSON.stringify(filteredTexts),
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
      cluster: req.body.performClustering
        ? textClusterMapping[textIndex].cluster
        : 0, // Everything gets lumped into the same 'cluster' if no clustering is perrformed
      markup: getPreannotatedEntities(text),
      project_id: projectId,
    }));

    const textRes = await Text.insertMany(textObjs);
    const textObjectIds = textRes.map((text) => text._id);

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
    console.log('cluster details', clusterDetails);
    project.clusterDetails = req.body.performClustering ? clusterDetails : {};
    project.save();

    res.json({
      message: "project created successfully",
      project_id: projectId,
    });

    // TODO: weighting and ranking
  } catch (err) {
    res.json({ message: err });
    logger.error("Failed to create project", { route: "/api/project/create" });
  }
});

module.exports = router;
