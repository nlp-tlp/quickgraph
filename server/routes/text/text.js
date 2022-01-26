const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const _ = require("lodash");
const mongoose = require("mongoose");
const Project = require("../../models/Project");
const Text = require("../../models/Text");
const authUtils = require("../auth/utils");
const utils = require("./utils");

router.post("/filter", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    const expectedKeys = ["projectId", "getPages", "filters"];

    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("One or more required fields not supplied");
    } else {
      const skip = parseInt((req.query.page - 1) * req.query.limit); // equiv to page
      const limit = parseInt(req.query.limit); // same as limit
      const filters = req.body.filters;

      if (Object.keys(filters).length === 0) {
        // No filters or specific texts supplied
        switch (req.body.getPages) {
          case true:
            logger.info("Fetching number of pages for paginator (no filter)", {
              route: "/api/text/filter",
            });

            const textsCount = await Text.find({
              project_id: req.body.projectId,
            }).count();
            const pages = Math.ceil(textsCount / limit);
            res.json({ totalPages: pages });
            break;
          case false:
            const aggQuery = [
              {
                $match: {
                  project_id: mongoose.Types.ObjectId(req.body.projectId),
                },
              },
              {
                $sort: { rank: 1 },
              },
              {
                $skip: skip,
              },
              {
                $limit: limit,
              },
            ];

            const textAggregation = await Text.aggregate(aggQuery)
              .allowDiskUse(true)
              .exec();
            res.json(textAggregation);
            break;
          default:
            res.status(500).send("Oops. Something went wrong.");
            break;
        }
      } else {
        const generalFilters = {
          project_id: mongoose.Types.ObjectId(req.body.projectId),
          original: {
            $regex: filters.search.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
          cluster:
            filters.cluster && Object.keys(filters.cluster.value)[0] !== "all" // Shocking code :(
              ? parseInt(Object.keys(filters.cluster.value)[0]) // value is {clusterNo: top_n_terms} filter is on clusterNo used on texts.
              : { $exists: true },
        };

        const annotationTypeFilter =
          filters.annotated.value === "silver"
            ? {
                markup: {
                  $elemMatch: {
                    createdBy: mongoose.Types.ObjectId(userId),
                    suggested: false,
                  },
                },
              }
            : filters.annotated.value === "weak"
            ? {
                markup: {
                  $elemMatch: {
                    createdBy: mongoose.Types.ObjectId(userId),
                    suggested: true,
                  },
                },
              }
            : // : filters.annotated.value === "silver and weak"
            // ? {
            //     markup: {
            //       $elemMatch: mongoose.Types.ObjectId(userId),
            //       suggested: { $in: [true, false] },
            //     },
            //   }
            filters.annotated.value === "none"
            ? {
                "markup.createdBy": {
                  $ne: mongoose.Types.ObjectId(userId),
                },
              }
            : {};

        const saveStatesFilter =
          filters.saved.value === "yes"
            ? {
                "saved.createdBy": mongoose.Types.ObjectId(userId),
              }
            : filters.saved.value === "no"
            ? {
                "saved.createdBy": {
                  $ne: mongoose.Types.ObjectId(userId),
                },
              }
            : {};

        const textIdFilter =
          filters.textIds.value.length > 0
            ? {
                _id: {
                  $in: filters.textIds.value.map((id) =>
                    mongoose.Types.ObjectId(id)
                  ),
                },
              }
            : {};

        const filterFields = {
          ...generalFilters,
          ...annotationTypeFilter,
          ...saveStatesFilter,
          ...textIdFilter,
        };
        // console.log(filterFields);
        const matchField = { $match: filterFields };

        // console.log("match field", matchField);

        switch (req.body.getPages) {
          case true:
            // Returns total pages instead of page of results
            logger.info("Fetching number of pages for paginator", {
              route: "/api/text/filter",
            });
            const textsCount = await Text.find(filterFields).count();
            const pages = Math.ceil(textsCount / limit);
            res.json({ totalPages: pages });
            break;
          case false:
            logger.info("Fetching results from paginator", {
              route: "/api/text/filter",
            });

            const aggQuery = [
              matchField,
              {
                $sort: { rank: 1 },
              },
              {
                $skip: skip,
              },
              {
                $limit: limit,
              },
            ];

            const textAggregation = await Text.aggregate(aggQuery)
              .allowDiskUse(true)
              .exec();

            // console.log('textAggregation', textAggregation);

            // textAggregation.map((text) => console.log(text.markup));

            // Filter markup/relations for authenticated user
            const filteredTexts = textAggregation.map((text) => ({
              ...text,
              markup:
                text.markup.length > 0
                  ? text.markup.filter((span) => span.createdBy == userId)
                  : [],
              relations:
                text.relations.length > 0
                  ? text.relations.filter((rel) => rel.createdBy == userId)
                  : [],
              saved:
                text.saved.length > 0
                  ? text.saved.filter((s) => s.createdBy == userId)
                  : [],
            }));

            // console.log(filteredTexts);

            res.json(filteredTexts);

            break;
          default:
            res.status(500).send("Oops. Something went wrong.");
            break;
        }
      }
    }
  } catch (err) {
    logger.error("Failed to get text pagination results", {
      route: `/api/text/filter/${req.body.projectId}`,
    });
    res.json({ message: err });
  }
});

router.post("/annotation/apply", authUtils.cookieJwtAuth, async (req, res) => {
  /* 
  End point for apply markup to an entiy span or relation
*/
  try {
    const expectedKeys = [
      "textId",
      "projectId",
      "applyAll",
      "suggested",
      "annotationType",
    ];
    const userId = authUtils.getUserIdFromToken(req.cookies.token);

    const applySingle = async () => {
      let text = await Text.findById({ _id: req.body.textId });
      if (req.body.annotationType === "entity") {
        //
        const markup = text.markup.filter((s) => s.createdBy == userId);
        const { hasMatchedSpan, matchedSpan } = utils.checkMatchedSpan(
          markup,
          req.body.entitySpanStart,
          req.body.entitySpanEnd,
          req.body.entityLabel
        );

        if (hasMatchedSpan && matchedSpan.suggested) {
          logger.info("Accepting existing suggested entity span");
          const response = await Text.findOneAndUpdate(
            {
              _id: req.body.textId,
              markup: { $elemMatch: { _id: matchedSpan._id } },
            },
            {
              $set: {
                "markup.$.suggested": false,
              },
            },
            { new: true }
          );

          res.json(response);
        } else if (hasMatchedSpan && !matchedSpan.suggested) {
          res.status(400).send("Span already has accepty entity");
        } else if (!hasMatchedSpan) {
          logger.info("Adding new entity span");
          const response = await Text.findOneAndUpdate(
            { _id: req.body.textId },
            {
              $push: {
                markup: {
                  start: req.body.entitySpanStart,
                  end: req.body.entitySpanEnd,
                  label: req.body.entityLabel,
                  label_id: req.body.entityLabelId,
                  suggested: false,
                  createdBy: userId,
                },
              },
            },
            { new: true }
          );
          res.json({ data: response, count: 1 });
        }
      } else if (req.body.annotationType === "relation") {
        logger.info("Apply single closed relation");

        // Add relation to focus text
        let text = await Text.findById({ _id: req.body.textId });
        text.relations =
          text.relations.filter(
            (r) =>
              r.source == req.body.sourceEntityId &&
              r.target == req.body.targetEntityId &&
              r.label == req.body.relationLabel
          ).length > 0 // Already has exact relation between entities
            ? text.relations
            : [
                ...text.relations,
                {
                  source: req.body.sourceEntityId,
                  source_label: req.body.sourceEntityLabel,
                  target: req.body.targetEntityId,
                  target_label: req.body.targetEntityLabel,
                  label: req.body.relationLabel,
                  label_id: req.body.relationLabelId,
                  suggested: false,
                  createdBy: userId,
                },
              ];

        await text.save();

        // Filter response for auth user
        text.markup = text.markup.filter((span) => span.createdBy == userId);
        text.relations = text.relations.filter(
          (rel) => rel.createdBy == userId
        );
        text.saved = text.saved.filter((s) => s.createdBy == userId);
        res.json({ data: text, count: 1 });
      } else if (req.body.annotationType === "openRelation") {
        logger.info("Adding single open relation");

        let text = await Text.findById({ _id: req.body.textId });

        console.log(
          req.body.relationLabel,
          req.body.relationStart,
          req.body.relationEnd
        );

        text.relations =
          text.relations.filter(
            (r) =>
              r.source == req.body.sourceEntityId &&
              r.target == req.body.targetEntityId &&
              r.label == req.body.relationLabel &&
              r.labelStart === req.body.relationStart &&
              r.labelEnd === req.body.relationEnd
          ).length > 0 // Already has exact relation between entities
            ? text.relations
            : [
                ...text.relations,
                {
                  source: req.body.sourceEntityId,
                  source_label: req.body.sourceEntityLabel,
                  target: req.body.targetEntityId,
                  target_label: req.body.targetEntityLabel,
                  label: req.body.relationLabel,
                  labelStart: req.body.relationStart,
                  labelEnd: req.body.relationEnd,
                  // label_id: req.body.relationLabelId,  // Open RE have no label IDs.
                  suggested: false,
                  createdBy: userId,
                },
              ];

        await text.save();

        // Filter response for auth user
        text.markup = text.markup.filter((span) => span.createdBy == userId);
        text.relations = text.relations.filter(
          (rel) => rel.createdBy == userId
        );
        text.saved = text.saved.filter((s) => s.createdBy == userId);
        res.json({ data: text, count: 1 });
      } else {
        res
          .status(400)
          .send("Incorrect annotation type supplied - please try again.");
      }
    };

    const applyAll = async () => {
      if (req.body.annotationType === "entity") {
        logger.info("Propagating entities");

        let appliedFocusEntitySpan = false; // Used for counting
        const text = await Text.findById({ _id: req.body.textId }).lean();
        const spanTextToMatch = utils.createTextSpan(
          text.tokens,
          req.body.entitySpanStart,
          req.body.entitySpanEnd
        );

        const matchedTexts = await Text.find({
          project_id: req.body.projectId,
          original: {
            $regex: spanTextToMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }).lean();

        // Apply annotation to focus entity span
        const markup = text.markup.filter((span) => span.createdBy == userId);
        const { hasMatchedSpan, matchedSpan } = utils.checkMatchedSpan(
          markup,
          req.body.entitySpanStart,
          req.body.entitySpanEnd,
          req.body.entityLabel
        );

        if (hasMatchedSpan && matchedSpan.suggested) {
          appliedFocusEntitySpan = true;
          await Text.findOneAndUpdate(
            {
              _id: req.body.textId,
              markup: { $elemMatch: { _id: matchedSpan._id } },
            },
            {
              $set: {
                "markup.$.suggested": false,
              },
            },
            { new: true }
          );
        } else if (hasMatchedSpan && !matchedSpan.suggested) {
          // Do nothing; span already exists.
        } else if (!hasMatchedSpan) {
          appliedFocusEntitySpan = true;
          await Text.findOneAndUpdate(
            { _id: req.body.textId },
            {
              $push: {
                markup: {
                  start: req.body.entitySpanStart,
                  end: req.body.entitySpanEnd,
                  label: req.body.entityLabel,
                  label_id: req.body.entityLabelId,
                  suggested: false,
                  createdBy: userId,
                },
              },
            },
            { new: true }
          );
        }

        /* 
          Add suggested markup to matched texts. This requires finding the indexes of all tokens in the matched span
          Notes:
            - a single text can have *n* matched spans.
            - all tokens are matched with insensitivity e.g. 'Tooth' and 'tooth' will match.
        */

        const startToken = spanTextToMatch.split(" ")[0].toLowerCase();
        const endToken = spanTextToMatch
          .split(" ")
          [spanTextToMatch.split(" ").length - 1].toLowerCase();
        const offset = req.body.entitySpanEnd - req.body.entitySpanStart;

        let matchedTextSpans;
        // Get matching spans
        matchedTextSpans = utils.getMatchingSpans(
          userId,
          "entity",
          "apply",
          startToken,
          endToken,
          offset,
          matchedTexts,
          req.body.entityLabel
        );
        // console.log("matchedTextSpans", matchedTextSpans);

        const updateObjs = matchedTextSpans.flatMap((span) => {
          const matchedText = matchedTexts.filter(
            (text) => text._id === span.text_id
          )[0];

          const { hasMatchedSpan, matchedSpan } = utils.checkMatchedSpan(
            matchedText.markup.filter((span) => span.createdBy == userId),
            span.start,
            span.end,
            req.body.entityLabel
          );

          if (
            span.start == req.body.entitySpanStart &&
            span.end == req.body.entitySpanEnd &&
            span.text_id == req.body.textId
          ) {
            // Skip; this entity span was created as an accepted entity already.
            return [];
          } else if (hasMatchedSpan) {
            // Has accepted or suggested entity span already.
            return [];
          } else if (!hasMatchedSpan) {
            // Does not have accepted or suggested entity span
            return {
              updateOne: {
                filter: { _id: span.text_id },
                update: {
                  $push: {
                    markup: {
                      start: span.start,
                      end: span.end,
                      label: span.label,
                      label_id: req.body.entityLabelId,
                      suggested: true,
                      createdBy: userId,
                    },
                  },
                },
                options: { new: true },
              },
            };
          }
        });

        await Text.bulkWrite(updateObjs);

        const matchedTextIds = [
          ...new Set(updateObjs.map((t) => t.updateOne.filter._id)),
        ];

        // console.log(matchedTextIds);

        const response = await Text.find({
          _id: { $in: [...matchedTextIds, req.body.textId] },
        }).lean();

        // Filter response for current user
        const filteredResponse = response.map((t) => {
          t.markup = t.markup.filter((span) => span.createdBy == userId);
          t.relations = t.relations.filter((rel) => rel.createdBy == userId);
          t.saved = t.saved.filter((s) => s.createdBy == userId);
          return t;
        });

        res.json({
          data: filteredResponse,
          count: updateObjs.length + (appliedFocusEntitySpan ? 1 : 0),
        });
      } else if (req.body.annotationType === "relation") {
        logger.info("Propagating relations");
        /*
          Applies relation to all matching documents.

          Steps:
            1. Apply relation to entities in focus text (if do not exist)
            2. Find all matching documents that have matching source and target spans offset with the same distance.
              2.1 Find texts that have the tokens in source/taget spans
        
        */

        const project = await Project.findById(
          { _id: req.body.projectId },
          { entityOntology: 1, relationOntology: 1 }
        ).lean();
        const entityOntology = project.entityOntology;

        // console.log(
        //   "Applying relation:",
        //   req.body.relationLabel,
        //   "to all matching documents"
        // );

        let text = await Text.findById({ _id: req.body.textId });

        // Add relation to focus text;
        text.relations =
          text.relations.filter(
            (r) =>
              r.source == req.body.sourceEntityId &&
              r.target == req.body.targetEntityId &&
              r.label == req.body.relationLabel
          ).length > 0 // Already has exact relation between entities
            ? text.relations
            : [
                ...text.relations,
                {
                  source: req.body.sourceEntityId,
                  source_label: req.body.sourceEntityLabel,
                  target: req.body.targetEntityId,
                  target_label: req.body.targetEntityLabel,
                  label: req.body.relationLabel,
                  label_id: req.body.relationLabelId,
                  suggested: false,
                  createdBy: userId,
                },
              ];

        await text.save();

        // Match texts and apply entities and relations
        const sourceSpan = text.markup.filter(
          (span) => span._id == req.body.sourceEntityId
        )[0];
        const targetSpan = text.markup.filter(
          (span) => span._id == req.body.targetEntityId
        )[0];

        const sourceSpanText = utils.createTextSpan(
          text.tokens,
          sourceSpan.start,
          sourceSpan.end
        );
        const targetSpanText = utils.createTextSpan(
          text.tokens,
          targetSpan.start,
          targetSpan.end
        );

        // console.log(
        //   "sourceSpanText",
        //   sourceSpanText,
        //   "targetSpanText",
        //   targetSpanText
        // );

        // Create regex to match other texts; index of source/target indicate position of
        // source/target texts. This accounts for directionality of relations.
        const matchRegex =
          sourceSpan.end <= targetSpan.start
            ? `${sourceSpanText.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )}.*${targetSpanText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
            : `${targetSpanText.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )}.*${sourceSpanText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
        console.log("matchRegex", matchRegex);

        const matchedTexts = await Text.find({
          project_id: req.body.projectId,
          original: { $regex: new RegExp(matchRegex), $options: "i" },
        });

        console.log("matchedTexts", matchedTexts);
        logger.info(`Texts matched: ${matchedTexts.length}`);

        // 2.2 check if source/target spans are offset the same distance as the focus text
        const offset = targetSpan.start - sourceSpan.end;
        // console.log("offset", offset);
        const sourceTextLength = sourceSpanText.split(" ").length;
        const targetTextLength = targetSpanText.split(" ").length;

        console.log(
          "sourceTextLength",
          sourceTextLength,
          " --- ",
          "targetTextLength",
          targetTextLength
        );

        const matchedTextsMarkup = matchedTexts.flatMap((text) => {
          // Map over tokens to find matches with the correct offset;
          // Note: source/target can be ngrams
          const tokens = text.tokens.map((t) => t.value);

          let spanIndexes;
          try {
            spanIndexes = tokens
              .map((_, index) => {
                // if (index === sourceSpan.start && (index+offset) === targetSpan.start && text._id === req.body.textId)
                // TODO HANDLE FOR FOCUS TEXT BUT DO NOT STOP NEW RELATIONS BEING APPLIED WITH DIFFERENT ENTITIES....

                const copySourceTokens = tokens.slice();
                const copyTargetTokens = tokens.slice();

                const sourceTextCandidate = copySourceTokens
                  .splice(index, sourceTextLength)
                  .join(" ")
                  .toLowerCase();
                const targetTextCandidate = copyTargetTokens
                  .splice(index + offset, targetTextLength)
                  .join(" ")
                  .toLowerCase();

                // console.log('index', index, 'offset', offset)
                // console.log('sourceTextCandidate', sourceTextCandidate, ' --- ', 'targetTextCandidate', targetTextCandidate)

                const hasMatch =
                  sourceTextCandidate === sourceSpanText.toLowerCase() &&
                  targetTextCandidate === targetSpanText.toLowerCase();

                if (hasMatch) {
                  console.log(
                    "tId:",
                    text._id,
                    "s:",
                    sourceTextCandidate,
                    // " - ",
                    // sourceSpanText,
                    "t:",
                    targetTextCandidate,
                    // " - ",
                    // targetSpanText,
                    "m:",
                    hasMatch
                  );
                }

                return hasMatch ? index : "";
              })
              .filter(String)
              .map((startIndex) => ({
                source: {
                  start: startIndex,
                  end: startIndex + sourceSpanText.split(" ").length - 1,
                  label: req.body.sourceEntityLabel,
                  label_id: entityOntology.filter(
                    (e) => e.name === req.body.sourceEntityLabel
                  )[0]._id, // TODO: need to use fullName incase duplicates exist in ontology
                  suggested: true,
                  createdBy: userId,
                },
                target: {
                  start: startIndex + offset,
                  end:
                    startIndex +
                    offset +
                    (targetSpanText.split(" ").length - 1),
                  label: req.body.targetEntityLabel,
                  label_id: entityOntology.filter(
                    (e) => e.name === req.body.targetEntityLabel
                  )[0]._id, // TODO: need to use fullName incase duplicates exist in ontology
                  suggested: true,
                  createdBy: userId,
                },
              }));
          } catch (err) {
            logger.error("Error occurred fetching span indexes");
            spanIndexes = [];
          }

          console.log("spanIndexes", spanIndexes);
          if (spanIndexes.length === 0) {
            return []; //flatMap takes care of this.
          } else {
            return spanIndexes.map((span) => ({
              ...span,
              text_id: text._id,
              label: req.body.relationLabel,
            }));
          }
        });
        console.log("matchedTextsMarkup", matchedTextsMarkup);

        // Group matchedTextsMarkup by TextId for CRUD operations

        const groups = _.groupBy(matchedTextsMarkup, "text_id");
        console.log("groups", groups);

        const updatedEntitiesV2 = await Promise.all(
          Object.keys(groups).map(async (textId) => {
            const newEntitySpans = groups[textId];
            // console.log("newEntitySpans", newEntitySpans);

            // console.log("textId", textId);

            const matchedText = matchedTexts.filter(
              (text) => text._id == textId
            )[0];

            // console.log(matchedText.markup);

            // Filter new entities
            const newEntitySpansFiltered = newEntitySpans.flatMap((eSpan) => {
              // Check if entities exist on span
              const sourceEntity = matchedText.markup.filter(
                (s) =>
                  s.start === eSpan.source.start &&
                  s.end === eSpan.source.end &&
                  s.label === eSpan.source.label
              )[0];

              const targetEntity = matchedText.markup.filter(
                (s) =>
                  s.start === eSpan.target.start &&
                  s.end === eSpan.target.end &&
                  s.label === eSpan.target.label
              )[0];

              const hasSourceEntity = sourceEntity !== undefined;
              const hasTargetEntity = targetEntity !== undefined;

              const newEntities = [
                hasSourceEntity ? [] : eSpan.source,
                hasTargetEntity ? [] : eSpan.target,
              ].flat();
              // console.log("NEW ENTITIES", newEntities);

              if (newEntities.length !== 0) {
                return newEntities;
              } else {
                return [];
              }
            });

            const response = await Text.findByIdAndUpdate(
              { _id: textId },
              {
                $push: { markup: { $each: newEntitySpansFiltered } },
              },
              { new: true }
            );

            console.log("newEntitySpansFiltered", newEntitySpansFiltered);

            return {
              [textId]: response.markup.filter((span) => {
                console.log("response span", span);
                // This is filtered for markup of interest otherwise all the markups will get relations!
                if (
                  newEntitySpansFiltered.filter(
                    (span2) =>
                      span2.start === span.start &&
                      span2.end === span.end &&
                      span2.label_id.toString() == span.label_id.toString() &&
                      span2.createdBy.toString() == span.createdBy.toString()
                  ).length > 0
                ) {
                  return span;
                }
              }),
            };
          })
        );
        const newEntityGroups = Object.assign({}, ...updatedEntitiesV2);

        console.log("newEntityGroups", newEntityGroups);

        // CREATE RELATIONS
        const newRelations = Promise.all(
          Object.keys(groups).map(async (textId) => {
            const pendingRelations = groups[textId];

            console.log("pendingRelations", pendingRelations);

            const markup = newEntityGroups[textId];

            const filteredRelations = pendingRelations.flatMap((rel) => {
              try {
                const newRel = {
                  source: markup.filter(
                    (s) =>
                      s.start === rel.source.start &&
                      s.end === rel.source.end &&
                      s.label === rel.source.label
                  )[0]._id,
                  source_label: req.body.sourceEntityLabel,
                  target: markup.filter(
                    (s) =>
                      s.start === rel.target.start &&
                      s.end === rel.target.end &&
                      s.label === rel.target.label
                  )[0]._id,
                  target_label: req.body.targetEntityLabel,
                  label: req.body.relationLabel,
                  label_id: req.body.relationLabelId,
                  suggested: true,
                  createdBy: userId,
                };
                return newRel;
              } catch (err) {
                // If the pending relations has a set of entities that isn't
                // applicable it will raise an error; currently these should be ignored.
                // TODO: Handle without increasing the already nuts complexity.
                return [];
              }
            });

            const response = await Text.findByIdAndUpdate(
              { _id: textId },
              { $push: { relations: { $each: filteredRelations } } },
              { new: true }
            );

            return response;
          })
        );

        // console.log("newRelations", newRelations);

        const response = await Text.find({
          _id: {
            $in: Object.keys(newEntityGroups).map((id) =>
              mongoose.Types.ObjectId(id)
            ),
          },
        }).lean();

        // Filter response for current user
        const filteredResponse = response.map((t) => {
          t.markup = t.markup.filter((span) => span.createdBy == userId);
          t.relations = t.relations.filter((rel) => rel.createdBy == userId);
          t.saved = t.saved.filter((s) => s.createdBy == userId);
          return t;
        });

        // Fetch new text objects with filtering
        // const response = await Text.aggregate([
        //   {
        //     $match: {
        //       _id: {
        //         $in: Object.keys(newEntityGroups).map((id) => mongoose.Types.ObjectId(id)),
        //       },
        //     },
        //   },
        //   {
        //     $addFields: {
        //       markup: {
        //         $filter: {
        //           input: "$markup",
        //           as: "markup",
        //           cond: {
        //             $eq: [
        //               "$$markup.createdBy",
        //               mongoose.Types.ObjectId(userId),
        //             ],
        //           },
        //         },
        //       },
        //       saved: {
        //         $filter: {
        //           input: "$saved",
        //           as: "saved",
        //           cond: {
        //             $eq: ["$$saved.createdBy", mongoose.Types.ObjectId(userId)],
        //           },
        //         },
        //       },
        //       relations: {
        //         $filter: {
        //           input: "$relations",
        //           as: "relations",
        //           cond: {
        //             $eq: [
        //               "$$relations.createdBy",
        //               mongoose.Types.ObjectId(userId),
        //             ],
        //           },
        //         },
        //       },
        //     },
        //   },
        // ])
        //   .allowDiskUse(true)
        //   .exec();

        res.json({
          data: filteredResponse,
          count: Object.keys(newEntityGroups).length,
        });
      } else {
        res
          .status(400)
          .send("Incorrect annotation type supplied - please try again.");
      }
    };

    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("One or more required fields not supplied");
    } else {
      switch (req.body.applyAll) {
        case true:
          logger.info("Applying annotation to all");
          applyAll();
          break;
        case false:
          logger.info("Applying single annotation");
          applySingle();
          break;
        default:
          res.status(400).send("Invalid value supplied for applyAll");
      }
    }
  } catch (err) {
    res.json({ message: err });
  }
});

router.patch(
  "/annotation/accept",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      const expectedKeys = [
        "projectId",
        "textId",
        "applyAll",
        "suggested",
        "annotationType",
      ];
      const userId = authUtils.getUserIdFromToken(req.cookies.token);

      const acceptSingle = async () => {
        // let text = await Text.findById({ _id: req.body.textId });
        if (req.body.annotationType === "entity") {
          const response = await Text.findOneAndUpdate(
            {
              _id: req.body.textId,
              markup: { $elemMatch: { _id: req.body.spanId } },
            },
            {
              $set: {
                "markup.$.suggested": false,
              },
            },
            { new: true }
          );

          res.json({ data: response, count: 1 });
        } else if (req.body.annotationType === "relation") {
          let text = await Text.findById({ _id: req.body.textId });

          text.markup = text.markup.map((span) => {
            if (
              [
                req.body.sourceEntityId.toString(),
                req.body.targetEntityId.toString(),
              ].includes(span._id.toString())
            ) {
              return { ...span.toObject(), suggested: false };
            } else {
              return span;
            }
          });

          text.relations = text.relations.map((rel) => {
            if (rel._id.toString() === req.body.relationId.toString()) {
              return { ...rel.toObject(), suggested: false };
            } else {
              return rel;
            }
          });

          await text.save();

          // Filter response for auth user
          text.markup = text.markup.filter((span) => span.createdBy == userId);
          text.relations = text.relations.filter(
            (rel) => rel.createdBy == userId
          );
          text.saved = text.saved.filter((s) => s.createdBy == userId);
          res.json({ data: text, count: 1 });
        } else {
          res
            .status(401)
            .send("Incorrect annotation type supplied - please try again.");
        }
      };

      const acceptAll = async () => {
        if (req.body.annotationType === "entity") {
          const text = await Text.findById({ _id: req.body.textId }).lean();
          const focusSpan = text.markup.filter(
            (s) => s._id == req.body.spanId
          )[0];
          const spanTextToMatch = utils.createTextSpan(
            text.tokens,
            focusSpan.start,
            focusSpan.end
          );

          // Filter texts for those that have matching span
          const matchedTexts = await Text.find({
            project_id: req.body.projectId,
            original: {
              $regex: spanTextToMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
            "markup.suggested": true,
            "markup.createdBy": userId,
          }).lean();

          // Get matched text span indexes
          const startToken = spanTextToMatch.split(" ")[0].toLowerCase();
          const endToken = spanTextToMatch
            .split(" ")
            [spanTextToMatch.split(" ").length - 1].toLowerCase();
          const offset = focusSpan.end - focusSpan.start;

          let matchedTextSpans;
          matchedTextSpans = matchedTexts.flatMap((text) => {
            const spans = text.markup.filter((s) => s.createdBy == userId);
            const tokens = text.original.split(" ");

            const spanIndexes = tokens
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

            // filter spans based on span start/end and entityLabel
            const spansFiltered = spanIndexes.flatMap((spanIndexPair) =>
              spans
                .filter(
                  (s) =>
                    s.start === spanIndexPair.start &&
                    s.end === spanIndexPair.end &&
                    s.label === req.body.entityLabel
                )
                .map((s) => ({ ...s, text_id: text._id }))
            );
            return spansFiltered;
          });

          // Create update objects for entity spans
          const updateObjs = matchedTextSpans.flatMap((span) => {
            const matchedText = matchedTexts.filter(
              (text) => text._id === span.text_id
            )[0];

            const { hasMatchedSpan, matchedSpan } = utils.checkMatchedSpan(
              matchedText.markup.filter(
                (span) => span.createdBy == userId && !span.suggested
              ),
              span.start,
              span.end,
              req.body.entityLabel
            );

            if (hasMatchedSpan) {
              // Has accepted or suggested entity span already.
              return [];
            } else {
              return {
                updateOne: {
                  filter: {
                    _id: span.text_id,
                    markup: { $elemMatch: { _id: span._id } },
                  },
                  update: {
                    $set: {
                      "markup.$.suggested": false,
                    },
                  },
                  options: { new: true },
                },
              };
            }
          });

          await Text.bulkWrite(updateObjs);

          const matchedTextIds = matchedTexts.map((t) => t._id);

          const response = await Text.find({
            _id: { $in: matchedTextIds },
          }).lean();

          // Filter response for auth user
          const filteredResponse = response.map((t) => {
            t.markup = t.markup.filter((span) => span.createdBy == userId);
            t.relations = t.relations.filter((rel) => rel.createdBy == userId);
            t.saved = t.saved.filter((s) => s.createdBy == userId);
            return t;
          });

          res.json({ data: filteredResponse, count: updateObjs.length });
        } else if (req.body.annotationType === "relation") {
          /*
            Removes relations that have the same source, target and relation labels.
            Note: The entities need to be removed in a separate action.
          */
          // const texts = await Text.find({
          //   relations: {
          //     $elemMatch: {
          //       source_label: req.body.sourceEntityLabel,
          //       target_label: req.body.targetEntityLabel,
          //       label: req.body.relationLabel, // TODO: consider the case where duplicate labels are in ontology; need to use fullName
          //       suggested: req.body.suggested ? true : { $exists: true }, // If suggested, just remove suggestions, otherwise remove all.
          //     },
          //   },
          // });
          // const updatedTexts = await Promise.all(
          //   texts.map(async (text) => {
          //     text.relations = text.relations.filter(
          //       (rel) =>
          //         rel.source_label != req.body.sourceEntityLabel &&
          //         rel.target_label != req.body.targetEntityLabel &&
          //         rel.label != req.body.relationLabel
          //     );
          //     await text.save();
          //     return text;
          //   })
          // );
          // Filter response for auth user
          // const filteredResponse = updatedTexts.map((t) => {
          //   t.markup = t.markup.filter((span) => span.createdBy == userId);
          //   t.relations = t.relations.filter(
          //     (rel) => rel.createdBy == userId
          //   );
          //   t.saved = t.saved.filter((s) => s.createdBy == userId);
          //   return t;
          // });
          // res.json(filteredResponse);
        } else {
          res
            .status(401)
            .send("Incorrect annotation type supplied - please try again.");
        }
      };

      if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
        res.status(400).send("One or more required fields not supplied");
      } else {
        const action = `${
          req.body.annotationType === "entity" ? "ENTITY" : "RELATION"
        }_${req.body.applyAll ? "APPLYALL" : "SINGLE"}`;
        logger.info(action);

        switch (req.body.applyAll) {
          case true:
            acceptAll();
            break;
          case false:
            acceptSingle();
            break;
          default:
            res.status(500).send("Something went wrong :(");
            break;
        }
      }
    } catch (err) {
      logger.error("Failed to accept annotation(s)");
      res.status(500).send("Something went wrong :(");
    }
  }
);

router.patch(
  "/annotation/delete",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    /* 
      Endpoint for deleting entity spans; also removes (breaks) any relations that are attached
      to the entity.
    */
    try {
      const expectedKeys = [
        "projectId",
        "textId",
        "applyAll",
        "suggested",
        "annotationType",
      ];
      const userId = authUtils.getUserIdFromToken(req.cookies.token);

      const deleteSingle = async () => {
        let text = await Text.findById({ _id: req.body.textId });
        if (req.body.annotationType === "entity") {
          const connectedRelations = utils.checkSpanRelations(
            text.relations.filter((r) => r.createdBy == userId),
            req.body.spanId
          );
          text.markup = text.markup.filter((s) => s._id != req.body.spanId);
          text.relations = text.relations.filter(
            (r) => !connectedRelations.includes(r._id)
          );
          await text.save();
        } else if (req.body.annotationType === "relation") {
          text.relations = text.relations.filter(
            (r) => r._id != req.body.relationId
          );
          await text.save();
        } else {
          res
            .status(401)
            .send("Incorrect annotation type supplied - please try again.");
        }

        // Filter response for current user
        text.markup = text.markup.filter((span) => span.createdBy == userId);
        text.relations = text.relations.filter(
          (rel) => rel.createdBy == userId
        );
        text.saved = text.saved.filter((s) => s.createdBy == userId);
        res.json({ data: text, count: 1 });
      };

      const deleteAll = async () => {
        if (req.body.annotationType === "entity") {
          const text = await Text.findById({ _id: req.body.textId }).lean();
          const focusSpan = text.markup.filter(
            (s) => s._id == req.body.spanId
          )[0];
          const spanTextToMatch = utils.createTextSpan(
            text.tokens,
            focusSpan.start,
            focusSpan.end
          );

          // Filter texts for those that have matching span
          const matchedTexts = await Text.find({
            project_id: req.body.projectId,
            original: {
              $regex: spanTextToMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
            markup: {
              $elemMatch: {
                createdBy: userId,
                suggested: req.body.suggested ? true : { $exists: true },
              },
            },
          }).lean();

          // Get matched text span indexes
          const startToken = spanTextToMatch.split(" ")[0].toLowerCase();
          const endToken = spanTextToMatch
            .split(" ")
            [spanTextToMatch.split(" ").length - 1].toLowerCase();
          const offset = focusSpan.end - focusSpan.start;

          let matchedTextSpans;
          // Get matching spans
          matchedTextSpans = utils.getMatchingSpans(
            userId,
            "entity",
            "delete",
            startToken,
            endToken,
            offset,
            matchedTexts,
            req.body.entityLabel
          );

          // Check if entity spans have relations connected
          matchedTextSpans = matchedTextSpans.map((span) => {
            const text = matchedTexts.filter((t) => t._id == span.text_id)[0];
            const connectedRelations = utils.checkSpanRelations(
              text.relations.filter((r) => r.createdBy == userId),
              span._id
            );
            return { ...span, connectedRelations: connectedRelations };
          });

          // console.log("matchedTextSpans", matchedTextSpans);

          // Create update objects for entity spans
          const updateObjs = matchedTextSpans.flatMap((span) => {
            if (req.body.suggested && !span.suggested) {
              return [];
            } else {
              return {
                updateOne: {
                  filter: {
                    _id: span.text_id,
                  },
                  update: {
                    $pull: {
                      markup: {
                        _id: span._id,
                        createdBy: userId,
                      },
                      relations: {
                        _id: { $in: span.connectedRelations },
                      },
                    },
                  },
                  options: { new: true },
                },
              };
            }
          });

          await Text.bulkWrite(updateObjs);

          const matchedTextIds = matchedTexts.map((t) => t._id);

          const response = await Text.find({
            _id: { $in: matchedTextIds },
          }).lean();

          // Filter response for current user
          const filteredResponse = response.map((t) => {
            t.markup = t.markup.filter((span) => span.createdBy == userId);
            t.relations = t.relations.filter((rel) => rel.createdBy == userId);
            t.saved = t.saved.filter((s) => s.createdBy == userId);
            return t;
          });

          res.json({
            data: filteredResponse,
            count: updateObjs.length,
          });
        } else if (req.body.annotationType === "relation") {
          /*
            Removes relations that have the same source, target and relation labels.
            Note: The entities need to be removed in a separate action.
          */

          const texts = await Text.find({
            relations: {
              $elemMatch: {
                source_label: req.body.sourceEntityLabel,
                target_label: req.body.targetEntityLabel,
                label: req.body.relationLabel, // TODO: consider the case where duplicate labels are in ontology; need to use fullName
                suggested: req.body.suggested ? true : { $exists: true }, // If suggested, just remove suggestions, otherwise remove all.
              },
            },
          });

          const updatedTexts = await Promise.all(
            texts.map(async (text) => {
              text.relations = text.relations.filter(
                (rel) =>
                  rel.source_label != req.body.sourceEntityLabel &&
                  rel.target_label != req.body.targetEntityLabel &&
                  rel.label != req.body.relationLabel
              );

              await text.save();
              return text;
            })
          );

          // Filter response for auth user
          const filteredResponse = updatedTexts.map((t) => {
            t.markup = t.markup.filter((span) => span.createdBy == userId);
            t.relations = t.relations.filter((rel) => rel.createdBy == userId);
            t.saved = t.saved.filter((s) => s.createdBy == userId);
            return t;
          });

          res.json({ data: filteredResponse, count: updatedTexts.length });
        } else {
          res
            .status(401)
            .send("Incorrect annotation type supplied - please try again.");
        }
      };

      if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
        res.status(400).send("One or more required fields not supplied");
      } else {
        const action = `${
          req.body.annotationType === "entity" ? "ENTITY" : "RELATION"
        }_${req.body.applyAll ? "APPLYALL" : "SINGLE"}`;
        logger.info(action);

        switch (req.body.applyAll) {
          case true:
            deleteAll();
            break;
          case false:
            deleteSingle();
            break;
          default:
            res.status(500).send("Something went wrong :(");
            break;
        }
      }
    } catch (err) {
      logger.error("Failed to delete entity/entities");
      res.status(500).send("Failed to delete entity/entities");
    }
  }
);

router.patch("/annotation/save", authUtils.cookieJwtAuth, async (req, res) => {
  // Updates the annotation state of a single, or set of, text(s).
  // Calculates tiered IAA at save time.
  try {
    logger.info("Saving annotation states on a single text", {
      route: "/api/text/annotation/save",
    });

    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    const expectedKeys = ["textIds"];

    const saveOne = async () => {
      const textId = req.body.textIds[0];
      const isSaved = await Text.exists({
        _id: textId,
        "saved.createdBy": userId,
      });

      let text = await Text.findById({ _id: textId });
      const project = await Project.findById(
        { _id: text.project_id },
        { annotators: 1, tasks: 1 }
      ).lean();

      // Get IAA scores
      const iaaScores = utils.getAllIAA(
        project.annotators.map((a) => a.user),
        text.markup.map((span) => ({
          ...span.toObject(),
          _id: span._id.toString(),
        })),
        text.relations.map((rel) => ({
          ...rel.toObject(),
          _id: rel._id.toString(),
        })),
        project && project.tasks.relationAnnotation
      );

      console.log("iaaScores", iaaScores);

      let response;
      if (isSaved) {
        response = await Text.findOneAndUpdate(
          {
            _id: textId,
          },
          {
            $pull: {
              saved: { createdBy: userId },
            },
            iaa: iaaScores,
          },
          { new: true }
        );
      } else {
        response = await Text.findOneAndUpdate(
          { _id: textId },
          {
            $push: {
              saved: { createdBy: userId },
            },
            iaa: iaaScores,
          },
          { upsert: true, new: true }
        );
      }

      // Filter response
      response = {
        ...response.toObject(),
        markup: response.markup.filter((s) => s.createdBy == userId),
        saved: response.saved.filter((s) => s.createdBy == userId),
        relations: response.relations.filter((r) => r.createdBy == userId),
      };

      res.json({ data: response, count: 1, userId: userId });
    };

    const saveMany = async () => {
      const aggQuery = [
        {
          $match: {
            _id: {
              $in: req.body.textIds.map((id) => mongoose.Types.ObjectId(id)),
            },
            saved: {
              $not: {
                $elemMatch: {
                  createdBy: mongoose.Types.ObjectId(userId),
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: "projects",
            localField: "project_id",
            foreignField: "_id",
            as: "project",
          },
        },
        {
          $unwind: {
            path: "$project",
          },
        },
        {
          $addFields: {
            annotators: "$project.annotators",
          },
        },
        {
          $project: {
            project: 0,
          },
        },
      ];

      const texts = await Text.aggregate(aggQuery).allowDiskUse(true).exec();

      const project = await Project.findById(
        { _id: texts[0].project_id },
        { tasks: 1 }
      ).lean();

      const updateObjs = texts.map((text) => {
        const iaaScores = utils.getAllIAA(
          text.annotators.map((a) => a.user),
          text.markup.map((span) => ({ ...span, _id: span._id.toString() })),
          text.relations.map((rel) => ({
            ...rel,
            _id: rel._id.toString(),
          })),
          project && project.tasks.relationAnnotation
        );
        return {
          updateOne: {
            filter: {
              _id: text._id,
            },
            update: {
              $push: {
                saved: { createdBy: userId },
              },
              iaa: iaaScores,
            },
            options: { upsert: true, new: true },
          },
        };
      });

      await Text.bulkWrite(updateObjs);

      const response = await Text.aggregate([
        {
          $match: {
            _id: {
              $in: req.body.textIds.map((id) => mongoose.Types.ObjectId(id)),
            },
          },
        },
        {
          $addFields: {
            markup: {
              $filter: {
                input: "$markup",
                as: "markup",
                cond: {
                  $eq: ["$$markup.createdBy", mongoose.Types.ObjectId(userId)],
                },
              },
            },
            saved: {
              $filter: {
                input: "$saved",
                as: "saved",
                cond: {
                  $eq: ["$$saved.createdBy", mongoose.Types.ObjectId(userId)],
                },
              },
            },
            relations: {
              $filter: {
                input: "$relations",
                as: "relations",
                cond: {
                  $eq: [
                    "$$relations.createdBy",
                    mongoose.Types.ObjectId(userId),
                  ],
                },
              },
            },
          },
        },
      ])
        .allowDiskUse(true)
        .exec();

      res.json(response);
    };

    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("textIds not supplied - please try again.");
    } else {
      switch (req.body.textIds.length > 1) {
        case true:
          logger.info("Updating save state of multiple documents");
          saveMany();
          break;
        case false:
          logger.info("Updating save state of a single document");
          saveOne();
          break;
        default:
          res
            .status(500)
            .send("Something went wrong 😞 - Give it another crack!");
          break;
      }
    }
  } catch (err) {
    logger.error("Failed to save annotations on single text");
    res.json({ message: err });
  }
});

module.exports = router;
