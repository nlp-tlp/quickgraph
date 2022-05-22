/**
 * Services for Text routes
 */

const logger = require("../../logger");
const Markup = require("../../models/Markup");
const Text = require("../../models/Text");
const Project = require("../../models/Project");
const utils = require("./utils");
const mongoose = require("mongoose");
const { getFlatOntology } = require("../project/utils");

const filterTexts = async (payload, skip, limit, userId) => {
  let response;
  let failed = false;

  if (Object.keys(payload.filters).length === 0) {
    logger.info("Fetching number of pages for paginator without a filter", {
      route: "/api/text/filter",
    });
    const textsCount = await Text.find({
      projectId: payload.projectId,
    }).count();
    const pages = Math.ceil(textsCount / limit);
    response = { totalPages: pages };
  } else {
    console.log("FILTERING TEXTS IN SERVICES");
    // console.log(payload, skip, limit, userId);

    const generalFilters = {
      projectId: mongoose.Types.ObjectId(payload.projectId),
      original: {
        $regex: payload.filters.search.value.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        ),
        $options: "i",
      },
      cluster:
        payload.filters.cluster &&
        Object.keys(payload.filters.cluster.value)[0] !== "all" // Shocking code :(
          ? parseInt(Object.keys(payload.filters.cluster.value)[0]) // value is {clusterNo: top_n_terms} filter is on clusterNo used on texts.
          : { $exists: true },
    };

    const saveStatesFilter =
      payload.filters.saved.value === "yes"
        ? {
            "saved.createdBy": mongoose.Types.ObjectId(userId),
          }
        : payload.filters.saved.value === "no"
        ? {
            "saved.createdBy": {
              $ne: mongoose.Types.ObjectId(userId),
            },
          }
        : {};

    const textIdFilter =
      payload.filters.textIds.value.length > 0
        ? {
            _id: {
              $in:
                // payload.filters.textIds.value,
                payload.filters.textIds.value.map((id) =>
                  mongoose.Types.ObjectId(id)
                ),
            },
          }
        : {};

    console.log("textIdFilter", textIdFilter);

    const filterFields = {
      ...generalFilters,
      ...saveStatesFilter,
      ...textIdFilter,
    };

    console.log(filterFields);

    switch (payload.getPages) {
      case true:
        // Returns total pages instead of page of results
        logger.info("Fetching number of pages for paginator", {
          route: "/api/text/filter",
        });
        const textsCount = await Text.find(filterFields).count();
        const pages = Math.ceil(textsCount / limit);
        response = { totalPages: pages };
        break;
      case false:
        logger.info("Fetching results from paginator", {
          route: "/api/text/filter",
        });

        const aggQuery = [
          { $match: filterFields },
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

        console.log("textAggregation", textAggregation);

        // Filter markup/relations for authenticated user
        const filteredTexts = textAggregation.map((text) => ({
          ...text,
          saved:
            text.saved.length > 0
              ? text.saved.filter((s) => s.createdBy == userId)
              : [],
        }));

        console.log(filteredTexts);

        const tokens = filteredTexts.flatMap((text) =>
          text.tokens.flatMap((token) => ({ ...token, textId: text._id }))
        );

        const markup = await Markup.find(
          {
            textId: { $in: filteredTexts.map((t) => t._id) },
            createdBy: userId,
          },
          { updatedAt: 0, createdAt: 0, __v: 0 }
        ).lean();

        // console.log("markup", markup);

        // TODO: Find a way to populate the `labelId` on the markup; currently
        // cannot do this as its a string and I cannot find a way to make a custom id ObjectId
        const project = await Project.findById(
          { _id: payload.projectId },
          { ontology: 1, tasks: 1 }
        ).lean();

        const ontology = getFlatOntology(project.ontology);

        let relations = {};
        if (project.tasks.relationAnnotationType.toLowerCase() === "open") {
          markup
            .filter((m) => !m.isEntity)
            .forEach((markup) => {
              relations[markup.textId]
                ? relations[markup.textId].push(markup)
                : ((relations[markup.textId] = []),
                  relations[markup.textId].push(markup));
            });
        } else {
          markup
            .filter((m) => !m.isEntity)
            .map((m) => {
              // REMOVE THIS STAGE WHEN POPULATE WORKS
              const oClass = ontology.filter(
                (item) => item._id.toString() == m.labelId.toString()
              )[0];
              return {
                ...m,
                name: oClass.name,
                fullName: oClass.fullName,
              };
            })
            .forEach((markup) => {
              relations[markup.textId]
                ? relations[markup.textId].push(markup)
                : ((relations[markup.textId] = []),
                  relations[markup.textId].push(markup));
            });
        }

        // console.log("relations", relations);

        let entities = {};
        markup
          .filter((m) => m.isEntity)
          .map((m) => {
            // REMOVE THIS STAGE WHEN POPULATE WORKS
            const oClass = ontology.filter(
              (item) => item._id.toString() == m.labelId.toString()
            )[0];
            // console.log("oClass", oClass);
            return {
              ...m,
              name: oClass.name,
              fullName: oClass.fullName,
              colour: oClass.colour,
              state: "active",
            };
          })
          .forEach((markup) => {
            entities[markup.textId]
              ? entities[markup.textId].push(markup)
              : ((entities[markup.textId] = []),
                entities[markup.textId].push(markup));
          });

        console.log("entities", entities);

        response = {
          texts: Object.assign.apply(
            null,
            filteredTexts
              .map((text) => ({
                _id: text._id,
                cluster: text.cluster,
                saved: text.saved,
                tokens: Object.assign.apply(
                  null,
                  text.tokens
                    .map((token) => ({
                      ...token,
                      textId: text._id,
                      state: null, // Used to trigger UI markup
                    }))
                    .map((x) => ({ [x._id]: x }))
                ),
              }))
              .map((x) => ({ [x._id]: x }))
          ),
          relations: relations,
          entities: entities,
          ontology: ontology,
        };

        break;
      default:
        failed = true;
        response = { message: "Oops. Something went wrong." };
    }
  }

  return { data: response, status: failed ? 500 : 200 };
};

const applySingleAnnotation = async (payload, userId) => {
  let response;
  let failed = false;

  let project = await Project.findById(
    { _id: payload.projectId },
    { ontology: 1 }
  ).lean();
  ontology = getFlatOntology(project.ontology);

  oClass = ontology.filter((item) =>
    payload.annotationType === "entity"
      ? item._id === payload.entityLabelId
      : item._id === payload.relationLabelId
  )[0];

  switch (payload.annotationType) {
    case "entity":
      const spanMarkup = await Markup.find({
        textId: payload.textId,
        isEntity: true,
        createdBy: userId,
        start: payload.entitySpanStart,
        end: payload.entitySpanEnd,
        labelId: payload.entityLabelId,
      });

      if (spanMarkup.length === 1) {
        if (spanMarkup[0].suggested) {
          // Convert into accepted entity span
          // TODO: handle after apply all is added...
          // const response = await Text.findOneAndUpdate(
          //   {
          //     _id: payload.textId,
          //     markup: { $elemMatch: { _id: matchedSpan._id } },
          //   },
          //   {
          //     $set: {
          //       "markup.$.suggested": false,
          //     },
          //   },
          //   { new: true }
          // );
        } else {
          // Markup already exists
          response = { data: null, count: null };
        }
      } else {
        // Does not exist - add as an accepted span.
        let newEntity = await Markup.create({
          textId: payload.textId,
          isEntity: true,
          createdBy: userId,
          start: payload.entitySpanStart,
          end: payload.entitySpanEnd,
          labelId: payload.entityLabelId,
          suggested: false,
          entityText: payload.entityText,
        });
        newEntity = {
          ...newEntity.toObject(),
          name: oClass.name,
          fullName: oClass.fullName,
          colour: oClass.colour,
        };

        response = { data: newEntity, count: 1 };
      }
      break;
    case "relation":
      logger.info("Apply single closed relation");

      const relationMarkup = await Markup.find({
        textId: payload.textId,
        isEntity: false,
        createdBy: userId,
        source: payload.sourceEntityId,
        target: payload.targetEntityId,
        labelId: payload.relationLabelId,
      });

      console.log("relationMarkup", relationMarkup);

      if (relationMarkup.length === 1) {
        if (relationMarkup[0].suggested) {
          // Convert into accepted relation
          // TODO: handle after apply all is added...
        }
      } else {
        // Relation does not exist.
        let newRelation = await Markup.create({
          textId: payload.textId,
          isEntity: false,
          createdBy: userId,
          source: payload.sourceEntityId,
          target: payload.targetEntityId,
          labelId: payload.relationLabelId,
          suggested: false,
        });

        // Need to fetch created relation to backref the entities for the Redux store to update
        // let newRelation = await Markup.findOne({ _id: createdRelation._id })
        //   .populate("source target")
        //   .lean();

        newRelation = {
          ...newRelation.toObject(),
          name: oClass.name,
          fullName: oClass.fullName,
        };

        response = { data: newRelation, count: 1 };
      }
      break;
    case "openRelation":
      logger.info("Adding single open relation");

      const openRelationMarkup = await Markup.find({
        textId: payload.textId,
        isEntity: false,
        createdBy: userId,
        source: payload.sourceEntityId,
        target: payload.targetEntityId,
        labelStart: payload.relationStart,
        labelEnd: payload.relationEnd,
      });

      console.log("openRelationMarkup", openRelationMarkup);

      console.log("payload", payload);

      if (openRelationMarkup.length === 1) {
        if (openRelationMarkup[0].suggested) {
          // Convert into accepted open relation
          // TODO: handle after apply all is added...
        }
      } else {
        // Relation does not exist
        logger.info("Open relation doesnt exist - adding one.");
        console.log({
          textId: payload.textId,
          isEntity: false,
          createdBy: userId,
          source: payload.sourceEntityId,
          target: payload.targetEntityId,
          labelStart: payload.relationStart,
          labelEnd: payload.relationEnd,
          labelText: payload.relationText,
          suggested: false,
        });
        const newOpenRelation = await Markup.create({
          textId: payload.textId,
          isEntity: false,
          createdBy: userId,
          source: payload.sourceEntityId,
          target: payload.targetEntityId,
          labelStart: payload.relationStart,
          labelEnd: payload.relationEnd,
          labelText: payload.relationText,
          suggested: false,
        });
        console.log("created newOpenRelation", newOpenRelation);
        response = { data: newOpenRelation, count: 1 };
      }
      break;
    default:
      failed = true;
      response = {
        message: "Incorrect annotation type supplied - please try again.",
      };
  }

  return { data: response, status: failed ? 400 : 200 }; // Not the best HTTP handling...
};

const applyAllAnnotations = async (payload, userId) => {
  let response;
  let failed = false;
  let matchedTexts;

  let project = await Project.findById(
    { _id: payload.projectId },
    { ontology: 1 }
  ).lean();
  ontology = getFlatOntology(project.ontology);

  oClass = ontology.filter((item) =>
    payload.annotationType === "entity"
      ? item._id === payload.entityLabelId
      : item._id === payload.relationLabelId
  )[0];

  switch (payload.annotationType) {
    case "entity":
      logger.info("Propagating entities");
      let appliedFocusEntitySpan = false; // Used for counting; has the focused span been annotated (if it hasn't been already)
      oClass = ontology.filter((item) => item._id === payload.entityLabelId)[0];

      // textIds
      console.log("TEXT IDS", payload.textIds);
      const entityText = payload.entityText;

      const spanMarkup = await Markup.find({
        textId: payload.textId,
        isEntity: true,
        createdBy: userId,
        start: payload.entitySpanStart,
        end: payload.entitySpanEnd,
        labelId: payload.entityLabelId,
      });

      console.log("spanMarkup", spanMarkup);

      let newFocusEntity = [];
      if (spanMarkup.length === 1) {
        if (spanMarkup[0].suggested) {
          // Convert into accepted entity span
          newFocusEntity = await Markup.findById(
            {
              _id: spanMarkup[0]._id,
            },
            { suggested: false },
            { new: true }
          );
          console.log(newFocusEntity);

          newFocusEntity = newFocusEntity.toObject();
          appliedFocusEntitySpan = true;
        }
      } else {
        // Does not exist - add as an accepted span.
        newFocusEntity = await Markup.create({
          textId: payload.textId,
          isEntity: true,
          createdBy: userId,
          start: payload.entitySpanStart,
          end: payload.entitySpanEnd,
          labelId: payload.entityLabelId,
          suggested: false,
          entityText: entityText,
        });
        newFocusEntity = newFocusEntity.toObject();
        appliedFocusEntitySpan = true;
      }

      console.log(
        "match regex",
        `\\b${entityText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`
      );

      // Need to match with word boundaries so if matching on 'oil', a text with 'oils' is not returned
      matchedTexts = await Text.find({
        projectId: payload.projectId,
        original: {
          $regex: new RegExp(
            `\\b${entityText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`
          ),
          $options: "i",
        },
      }).lean();

      console.log("matchedTexts", matchedTexts);

      /* 
            Add suggested markup to matched texts. This requires finding the indexes of all tokens in the matched span
            Notes:
              - a single text can have *n* matched spans.
              - all tokens are matched with insensitivity e.g. 'Tooth' and 'tooth' will match.
          */

      const startToken = entityText.split(" ")[0].toLowerCase();
      const endToken = entityText
        .split(" ")
        [entityText.split(" ").length - 1].toLowerCase();
      const offset = payload.entitySpanEnd - payload.entitySpanStart;

      // Matched Text Spans are those that have markup already
      const matchedTextSpansV2 = await Markup.find({
        textId: { $in: matchedTexts.map((t) => t._id) },
        isEntity: true,
        // suggested: false,
        labelId: payload.entityLabelId,
      });
      console.log("matchedTextSpansV2", matchedTextSpansV2);

      const spanSegments = matchedTexts
        .flatMap((text) => {
          try {
            const tokens = text.tokens.map((t) => t.value);
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
                textId: text._id,
              }));
            return spanIndexes;
          } catch (err) {
            console.log("Error extracting span segments - text", text);
          }
        })
        .filter((segment) => segment); // Filter out any `undefined` values that may be caused due to errors
      console.log("spanSegments", spanSegments);

      // Map over spanSegments and check if they are already marked up
      // and create into bulk update objects
      const spanSegmentsToAnno = spanSegments
        .filter((span) => {
          const hasMarkup =
            matchedTextSpansV2.filter(
              (s) =>
                s.start === span.start &&
                s.end === span.end &&
                s.textId.toString() == span.textId.toString()
            ).length === 1;

          if (!hasMarkup) {
            return span;
          }
        })
        .map((span) => ({
          start: span.start,
          end: span.end,
          labelId: payload.entityLabelId,
          suggested: true,
          createdBy: userId,
          isEntity: true,
          textId: span.textId,
          entityText: entityText,
        }));

      console.log("spanSegmentsToAnno", spanSegmentsToAnno);

      let newEntities = await Markup.insertMany(spanSegmentsToAnno);
      console.log("newEntities", newEntities);

      const updatedEntities = newEntities.length;
      const returnEntities = newEntities
        .map((e) => e.toObject())
        .filter((e) => payload.textIds.includes(e.textId.toString()));

      console.log("returnEntities", returnEntities);

      response = {
        data: [...returnEntities, newFocusEntity].map((entity) => ({
          ...entity,
          name: oClass.name,
          fullName: oClass.fullName,
          colour: oClass.colour,
        })),
        count: updatedEntities + (appliedFocusEntitySpan ? 1 : 0),
        textIds: [...newEntities, newFocusEntity].map((e) => e.textId),
      };

      console.log("ENTITY APPLY ALL RESPONSE", response);

      break;
    case "relation":
      logger.info("Propagating closed relations");
      /*
            Applies relation to all matching documents.
    
            Steps:
              1. Apply relation to entities in focus text (if do not exist)
              2. Find all matching documents that have matching source and target spans offset with the same distance.
                2.1 Find texts that have the tokens in source/taget spans
          
          */

      // Check if relation already exists; will return null if it doesn't exist.
      let focusRelationDetails = await Markup.findOne({
        textId: payload.textId,
        isEntity: false,
        createdBy: userId,
        source: payload.sourceEntityId,
        target: payload.targetEntityId,
        labelId: payload.relationLabelId,
        suggested: false,
      })
        .populate("source target")
        .lean();

      const focusRelationExists = focusRelationDetails !== null;

      if (focusRelationDetails === null) {
        let focusRelation = await Markup.create({
          textId: payload.textId,
          isEntity: false,
          createdBy: userId,
          source: payload.sourceEntityId,
          target: payload.targetEntityId,
          labelId: payload.relationLabelId,
          suggested: false,
        });
        focusRelation = {
          ...focusRelation.toObject(),
          name: oClass.name,
          fullName: oClass.fullName,
        };

        focusRelationDetails = await Markup.findById({
          _id: focusRelation._id,
        })
          .populate("source target")
          .lean();
      }

      // Add relation between focus entities

      // Get entity label details from ontology for response
      const focusSourceEntityClass = ontology.filter(
        (item) => item._id === focusRelationDetails.source.labelId
      )[0];

      const focusTargetEntityClass = ontology.filter(
        (item) => item._id === focusRelationDetails.target.labelId
      )[0];

      console.log("focusSourceEntityClass", focusSourceEntityClass);
      console.log("focusTargetEntityClass", focusTargetEntityClass);

      // Match texts and apply entities and relations
      const focusSourceSpan = focusRelationDetails.source;
      const focusTargetSpan = focusRelationDetails.target;

      const focusSourceSpanEntityText = focusSourceSpan.entityText;
      const focusTargetSpanEntityText = focusTargetSpan.entityText;

      console.log(
        "focus source span",
        focusSourceSpan,
        "focus target span",
        focusTargetSpan
      );

      // Create regex to match other texts; index of source/target indicate position of
      // source/target texts. This accounts for directionality of relations.

      // Check whether relation is applied from left to right (LR) or right to left.
      const relationDirLR = focusSourceSpan.end <= focusTargetSpan.start;

      // First get token offset
      const focusEntityOffset = relationDirLR
        ? focusTargetSpan.start - focusSourceSpan.end - 1
        : focusSourceSpan.start - focusTargetSpan.end - 1;

      // const focusEntityOffset = focusTargetSpan.start - focusSourceSpan.end - 1;
      const matchRegex = relationDirLR
        ? `\\b${focusSourceSpanEntityText.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )} (\\w+ ){${focusEntityOffset}}${focusTargetSpanEntityText.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}\\b`
        : `\\b${focusTargetSpanEntityText.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )} (\\w+ ){${focusEntityOffset}}${focusSourceSpanEntityText.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}\\b`;
      console.log("matchRegex", matchRegex);

      matchedTexts = await Text.find({
        projectId: payload.projectId,
        original: {
          $regex: new RegExp(matchRegex, "gi"),
        },
      });

      // console.log("matchedTexts", matchedTexts);
      logger.info(`Texts matched: ${matchedTexts.length}`);

      /**
       * Create objects that will be used to create entities and relations then link them in the db.
       */
      const relationObjs = matchedTexts.flatMap((textObj) => {
        const text = textObj.original;

        // Build tokenChar mapping
        let count = 0;
        let start = 0;
        let tokenCharArr = [];
        text.split("").map((char, index) => {
          if (index === text.length - 1) {
            tokenCharArr.push({ start: start, end: index, index: count });
          }
          if (char === " ") {
            tokenCharArr.push({ start: start, end: index - 1, index: count });
            start = index + 1;
            count += 1;
          }
        });

        const charPosToTokenIndex = (charPos, tokenCharArr) => {
          // Finds token index given character position
          const tokenIndex = tokenCharArr.filter(
            (item) => item.start <= charPos && charPos <= item.end
          )[0].index;
          return tokenIndex;
        };

        const matches = [...text.matchAll(new RegExp(matchRegex, "gi"))];

        return matches.map((m) => {
          let sourceStartPos;
          let sourceEndPos;
          let targetStartPos;
          let targetEndPos;
          switch (relationDirLR) {
            case true:
              // Create entities
              sourceStartPos = m.index;
              sourceEndPos =
                sourceStartPos + focusSourceSpanEntityText.length - 1;
              targetEndPos = m.index + m[0].length - 1;
              targetStartPos =
                targetEndPos - focusTargetSpanEntityText.length + 1;
              break;
            case false:
              sourceEndPos = m.index + m[0].length - 1;
              sourceStartPos =
                sourceEndPos - focusSourceSpanEntityText.length + 1;
              targetStartPos = m.index;
              targetEndPos =
                targetStartPos + focusTargetSpanEntityText.length - 1;
              break;
            default:
              break;
          }

          const sourceEntityBounds = {
            start: charPosToTokenIndex(sourceStartPos, tokenCharArr),
            end: charPosToTokenIndex(sourceEndPos, tokenCharArr),
          };
          const targetEntityBounds = {
            start: charPosToTokenIndex(targetStartPos, tokenCharArr),
            end: charPosToTokenIndex(targetEndPos, tokenCharArr),
          };

          return {
            source: sourceEntityBounds,
            target: targetEntityBounds,
            textId: textObj._id,
          };
        });
      });

      // console.log("relationObjs", relationObjs);

      // Fetch markup that corresponds to texts that have matched objects
      const matchedMarkup = await Markup.find({
        textId: { $in: relationObjs.map((obj) => obj.textId) },
      })
        .populate("source target")
        .lean();

      console.log("matchedMarkup", matchedMarkup);

      const newRelations = await Promise.all(
        relationObjs.map(async (obj) => {
          // Check if entities or relation exists in matchedMarkup

          const matchedSourceEntity = matchedMarkup
            .filter((m) => m.isEntity)
            .filter(
              (m) =>
                m.textId.toString() === obj.textId.toString() &&
                m.start === obj.source.start &&
                m.end === obj.source.end &&
                m.labelId === focusSourceSpan.labelId
            );
          const matchedTargetEntity = matchedMarkup
            .filter((m) => m.isEntity)
            .filter(
              (m) =>
                m.textId.toString() === obj.textId.toString() &&
                m.start === obj.target.start &&
                m.end === obj.target.end &&
                m.labelId === focusTargetSpan.labelId
            );

          const matchedRelation = matchedMarkup
            .filter((m) => !m.isEntity)
            .filter(
              (m) =>
                m.textId.toString() === obj.textId.toString() &&
                m.source.start === obj.source.start &&
                m.source.end === obj.source.end &&
                m.target.start === obj.target.start &&
                m.target.end === obj.target.end &&
                m.source.labelId === focusRelationDetails.source.labelId &&
                m.target.labelId === focusRelationDetails.target.labelId &&
                m.labelId === focusRelationDetails.labelId
            );

          const newSourceEntity =
            matchedSourceEntity.length === 0
              ? await Markup.create({
                  textId: obj.textId,
                  isEntity: true,
                  createdBy: userId,
                  start: obj.source.start,
                  end: obj.source.end,
                  labelId: focusSourceSpan.labelId,
                  entityText: focusSourceSpan.entityText,
                  suggested: true,
                })
              : matchedSourceEntity[0];

          const newTargetEntity =
            matchedTargetEntity.length === 0
              ? await Markup.create({
                  textId: obj.textId,
                  isEntity: true,
                  createdBy: userId,
                  start: obj.target.start,
                  end: obj.target.end,
                  labelId: focusTargetSpan.labelId,
                  entityText: focusTargetSpan.entityText,
                  suggested: true,
                })
              : matchedTargetEntity[0];

          // console.log(newSourceEntity, newTargetEntity);

          if (matchedRelation.length === 0) {
            let newRelation = await Markup.create({
              textId: obj.textId,
              isEntity: false,
              createdBy: userId,
              source: newSourceEntity._id,
              target: newTargetEntity._id,
              labelId: payload.relationLabelId,
              suggested: true,
            });

            return {
              ...newRelation.toObject(),
              name: oClass.name,
              fullName: oClass.fullName,
              source: {
                _id: newRelation.source,
                name: focusSourceEntityClass.name,
                fullName: focusSourceEntityClass.fullName,
                colour: focusSourceEntityClass.colour,
                isEntity: true,
                suggested: true,
                entityText: focusRelationDetails.source.entityText,
                labelId: focusRelationDetails.source.labelId,
                textId: obj.textId,
                start: obj.source.start,
                end: obj.source.end,
              },
              target: {
                _id: newRelation.target,
                name: focusTargetEntityClass.name,
                fullName: focusTargetEntityClass.fullName,
                colour: focusTargetEntityClass.colour,
                isEntity: true,
                suggested: true,
                entityText: focusRelationDetails.target.entityText,
                labelId: focusRelationDetails.target.labelId,
                textId: obj.textId,
                start: obj.target.start,
                end: obj.target.end,
              },
            };
          }
        })
      );

      console.log("1 - focusRelationDetails", focusRelationDetails);

      // add colour/fullname/name to focusRelation before sending back
      focusRelationDetails = {
        ...focusRelationDetails,
        source: {
          ...focusRelationDetails.source,
          name: focusSourceEntityClass.name,
          fullName: focusSourceEntityClass.fullName,
          colour: focusSourceEntityClass.colour,
        },
        target: {
          ...focusRelationDetails.target,
          name: focusTargetEntityClass.name,
          fullName: focusTargetEntityClass.fullName,
          colour: focusTargetEntityClass.colour,
        },
      };

      console.log("2 - focusRelationDetails", focusRelationDetails);

      // If reation exists, do not add it to response.
      response = {
        data: [
          ...newRelations.filter((r) => r),
          ...(focusRelationExists ? [] : [focusRelationDetails]),
        ],
        count: [
          ...newRelations.filter((r) => r),
          ...(focusRelationExists ? [] : [focusRelationDetails]),
        ].length,
        textIds: [
          ...newRelations.filter((r) => r),
          ...(focusRelationExists ? [] : [focusRelationDetails]),
        ].map((r) => r.textId),
      };

      break;
    case "openRelation":
      logger.info("Apply all for open relations");
      break;
    default:
      failed = true;
      response = {
        message: "Incorrect annotation type supplied - please try again.",
        count: null,
      };
  }

  return { data: response, status: failed ? 400 : 200 };
};

const acceptSingleAnnotation = async (payload) => {
  let response;
  let failed = false;

  switch (payload.annotationType) {
    case "entity":
      const entityRes = await Markup.findByIdAndUpdate(
        { _id: payload.spanId },
        { suggested: false },
        { new: true }
      );

      response = { data: entityRes, count: 1 };
      break;
    case "relation":
      logger.info("Accepting single relation and associated entities");
      console.log("payload", payload);

      await Markup.updateMany(
        {
          $or: [
            {
              labelId: payload.relationLabelId,
              source: payload.sourceEntityId,
              target: payload.targetEntityId,
            },
            {
              _id: payload.sourceEntityId,
            },
            {
              _id: payload.targetEntityId,
            },
          ],
        },
        { suggested: false },
        { new: true }
      );

      const relationRes = await Markup.find({
        $or: [
          {
            labelId: payload.relationLabelId,
            source: payload.sourceEntityId,
            target: payload.targetEntityId,
          },
          {
            _id: payload.sourceEntityId,
          },
          {
            _id: payload.targetEntityId,
          },
        ],
      }).lean();

      response = { data: relationRes, count: 1 };
      break;
    case "openRelation":
      logger.info("Accepting single open relation");
      break;
    default:
      failed = true;
      response = {
        message: "Incorrect annotation type supplied - please try again.",
      };
  }

  return { data: response, status: failed ? 400 : 200 };
};

const acceptAllAnnotations = async (payload) => {
  let response;
  let failed = false;
  let texts;
  let textIds;
  switch (payload.annotationType) {
    case "entity":
      const focusEntity = await Markup.findById({
        _id: payload.spanId,
      }).lean();

      const focusEntityText = payload.entityText;

      // Get all markup with same labelId as focus entity
      let entities = await Markup.find({
        labelId: focusEntity.labelId,
        suggested: true,
        isEntity: true,
      });

      console.log("entities", entities.length);

      // filter for those with same offset as focus entity
      entities = entities.filter(
        (e) => e.end - e.start === focusEntity.end - focusEntity.start
      );

      console.log("entities", entities.length);

      // get texts relating to filtered markup
      textIds = entities.map((e) => e.textId);
      texts = await Text.find(
        { _id: { $in: [...textIds, focusEntity.textId] } },
        { _id: 1, tokens: 1 }
      ).lean();

      // check if the span is the same text
      entities = entities.filter((e) => {
        const tokens = texts.filter(
          (text) => text._id.toString() == e.textId.toString()
        )[0].tokens;
        const entityTextSpan = tokens
          .filter((token) => e.start <= token.index && token.index <= e.end)
          .map((token) => token.value)
          .join(" ");

        if (entityTextSpan === focusEntityText) {
          return e;
        }
      });
      console.log("entities", entities.length);

      await Markup.updateMany(
        { _id: { $in: entities.map((e) => e._id) } },
        { suggested: false },
        { new: true }
      );

      response = { data: entities, count: entities.length };
      break;
    case "relation":
      logger.info("Accepting all relations and associated entities");

      const focusMarkup = await Markup.findOne({
        labelId: payload.relationLabelId,
        source: payload.sourceEntityId,
        target: payload.targetEntityId,
      })
        .populate("source target")
        .lean();
      console.log("focusMarkup", focusMarkup);

      texts = await Text.find(
        { projectId: payload.projectId },
        { _id: 1 }
      ).lean();
      textIds = texts.map((t) => t._id);

      //   Note: allMarkup includes focusMarkup entities
      const allMarkup = await Markup.find({
        isEntity: true,
        textId: { $in: textIds },
        entityText: {
          $in: [focusMarkup.source.entityText, focusMarkup.target.entityText],
        },
        labelId: {
          $in: [focusMarkup.source.labelId, focusMarkup.target.labelId],
        },
      }).lean();
      console.log("length allMarkup", allMarkup.length);
      const markupIds = allMarkup.map((m) => m._id);

      //   Get relations between entities with labelId
      const allMarkupRelations = await Markup.find({
        isEntity: false,
        source: { $in: markupIds },
        target: { $in: markupIds },
        labelId: payload.relationLabelId,
      }).lean();

      const allMarkupRelationsIds = allMarkupRelations.map((r) => r._id);

      await Markup.updateMany(
        { _id: { $in: [...markupIds, ...allMarkupRelationsIds] } },
        { suggested: false }
      );

      response = {
        data: [...allMarkup, ...allMarkupRelations].map((m) => ({
          ...m,
          suggested: false,
        })),
        count: allMarkupRelations.length,
      };
      break;
    case "openRelation":
      break;
    default:
      failed = true;
      response = {
        message: "Incorrect annotation type supplied - please try again.",
      };
  }

  return { data: response, status: failed ? 400 : 200 };
};

const deleteSingleAnnotation = async (payload) => {
  let response;
  let failed = false;

  switch (payload.annotationType) {
    case "entity":
      // Deletes entities and relations related to entity (if they exist)
      await Markup.deleteMany({
        $or: [
          {
            _id: payload.spanId,
          },
          { source: payload.spanId },
          { target: payload.spanId },
        ],
      });
      break;
    case "relation":
      // Deletes single relation (entities remain tagged)
      await Markup.deleteOne({
        isEntity: false,
        source: payload.sourceEntityId,
        target: payload.targetEntityId,
        labelId: payload.relationLabelId,
      });
      break;
    case "openRelation":
      break;
    default:
      failed = true;
      response = {
        message: "Incorrect annotation type supplied - please try again.",
      };
  }

  return { data: { data: null, count: 1 }, status: failed ? 400 : 200 };
};

const deleteAllAnnotations = async (payload, userId) => {
  let response;
  let failed = false;

  switch (payload.annotationType) {
    case "entity":
      const focusEntity = await Markup.findById({
        _id: payload.spanId,
      }).lean();
      const focusEntityText = payload.entityText;

      // Get all markup with same labelId as focus entity
      let entities = await Markup.find({
        labelId: focusEntity.labelId,
        ...(focusEntity.suggested ? { suggested: true } : {}),
      }).lean();

      // filter for those with same offset as focus entity
      entities = entities.filter(
        (e) => e.end - e.start === focusEntity.end - focusEntity.start
      );
      // Check if the span is the same text
      entities = entities.filter((e) => e.entityText === focusEntityText);
      const pageEntitiesIds = entities
        .filter((e) => payload.textIds.includes(e.textId.toString()))
        .map((e) => e._id);

      await Markup.deleteMany({
        $or: [
          {
            _id: pageEntitiesIds,
          },
          {
            source: pageEntitiesIds,
          },
          {
            target: pageEntitiesIds,
          },
        ],
      });

      response = {
        data: entities.filter((e) =>
          payload.textIds.includes(e.textId.toString())
        ),
        count: entities.length,
      };

      // Delete entities not on current page
      await Markup.deleteMany({
        _id: {
          $in: entities
            .filter((e) => !payload.textIds.includes(e.textId.toString()))
            .map((e) => e._id),
        },
      });
      const offpageEntityIds = entities
        .filter((e) => !payload.textIds.includes(e.textId.toString()))
        .map((e) => e._id);
      await Markup.deleteMany({
        $or: [
          {
            _id: offpageEntityIds,
          },
          {
            source: offpageEntityIds,
          },
          {
            target: offpageEntityIds,
          },
        ],
      });
      break;
    case "relation":
      /*
        Removes relations that have the same source, target and relation labels. The source and target entities
        must have the same offset from the tokens they are applied on.
      */
      // Fetch all relation markups with same relationLabelId (populating sourceEntityId and targetEntityId)

      console.log("relation delete all payload", payload);

      const relations = await Markup.find({
        labelId: payload.relationLabelId,
        isEntity: false,
        createdBy: userId,
        suggested: payload.suggested ? true : { $exists: true },
        // No textId filter here (e.g. to ensure other project labels aren't captured) as the unique-id is unlikely to ever be shared for a labelId.
      })
        .populate("source target textId")
        .lean();

      console.log("matched relations:", relations.length);

      const focusRelation = relations.filter(
        (r) =>
          r.source._id.toString() === payload.sourceEntityId &&
          r.labelId.toString() === payload.relationLabelId &&
          r.target._id.toString() === payload.targetEntityId
      )[0];

      const focusTokens = focusRelation.textId.tokens.map((t) => t.value);
      const focusSourceEntityText = focusTokens
        .slice(focusRelation.source.start, focusRelation.source.end + 1)
        .join(" ");
      const focusTargetEntityText = focusTokens
        .slice(focusRelation.target.start, focusRelation.target.end + 1)
        .join(" ");

      let relationsToDelete = relations
        .filter((r) => {
          // If source and target entity surface text match focusRelation - delete.
          const tokens = r.textId.tokens.map((t) => t.value);
          const hasSourceEntityText =
            tokens.slice(r.source.start, r.source.end + 1).join(" ") ===
            focusSourceEntityText;
          const hasTargetEntityText =
            tokens.slice(r.target.start, r.target.end + 1).join(" ") ===
            focusTargetEntityText;

          if (hasSourceEntityText && hasTargetEntityText) {
            return r;
          }
        })
        .map((r) => ({
          _id: r._id,
          textId: r.textId._id,
          source: r.source._id,
          target: r.target._id,
          labelId: r.labelId,
        }));

      await Markup.deleteMany({
        _id: { $in: relationsToDelete.map((r) => r._id) },
      });

      response = {
        data: relationsToDelete,
        count: relationsToDelete.length,
      };
      break;
    case "openRelation":
      break;
    default:
      failed = true;
      response = {
        message: "Incorrect annotation type supplied - please try again.",
      };
  }

  return { data: response, status: failed ? 400 : 200 };
};

const saveSingleText = async (payload, userId) => {
  const textId = payload.textIds[0];
  const isSaved = await Text.exists({
    _id: textId,
    "saved.createdBy": userId,
  });

  let text = await Text.findById({ _id: textId });
  const project = await Project.findById(
    { _id: text.projectId },
    { annotators: 1, tasks: 1 }
  ).lean();

  const markup = await Markup.find({ textId: textId }).lean();

  console.log(markup);
  // console.log(project.annotators);

  // Get IAA scores
  const iaaScores = utils.getAllIAA(
    project.annotators.map((a) => a.user),
    markup.filter((m) => m.isEntity),
    markup.filter((m) => !m.isEntity),
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
    saved: response.saved.filter((s) => s.createdBy == userId),
  };

  return { data: { data: response, count: 1, userId: userId }, status: 200 };
};

const saveManyTexts = async (payload, userId) => {
  const aggQuery = [
    {
      $match: {
        _id: {
          $in: payload.textIds.map((id) => mongoose.Types.ObjectId(id)),
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
        localField: "projectId",
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

  if (texts.length > 0) {
    logger.info(`saving ${texts.length} texts`);
    const project = await Project.findById(
      { _id: texts[0].projectId },
      { tasks: 1 }
    ).lean();

    const markup = await Markup.find({
      textId: { $in: texts.map((t) => t._id) },
    }).lean();

    const updateObjs = texts.map((text) => {
      // TODO: Update IAA SCORE for multiple annotators
      const iaaScores = utils.getAllIAA(
        text.annotators.map((a) => a.user),
        markup.filter(
          (m) => m.isEntity && m.textId.toString() === text._id.toString()
        ),
        markup.filter(
          (m) => !m.isEntity && m.textId.toString() === text._id.toString()
        ),
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

    let response = await Text.aggregate([
      {
        $match: {
          _id: {
            $in: payload.textIds.map((id) => mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $addFields: {
          saved: {
            $filter: {
              input: "$saved",
              as: "saved",
              cond: {
                $eq: ["$$saved.createdBy", mongoose.Types.ObjectId(userId)],
              },
            },
          },
        },
      },
    ])
      .allowDiskUse(true)
      .exec();

    // Filter response for current user
    response = response.map((t) => ({
      ...t,
      saved: t.saved.filter((s) => s.createdBy == userId),
    }));
    return { data: { data: response }, status: 200 };
  } else {
    // No unsaved texts in payload; send back empty payload.
    logger.info("No texts to save - all already saved by user.");
    return { data: { data: null }, status: 200 };
  }
};

module.exports = {
  filterTexts,
  applySingleAnnotation,
  applyAllAnnotations,
  acceptSingleAnnotation,
  acceptAllAnnotations,
  deleteSingleAnnotation,
  deleteAllAnnotations,
  saveSingleText,
  saveManyTexts,
};
