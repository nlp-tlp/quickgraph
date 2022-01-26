const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const utils = require("./utils");
const authUtils = require("../auth/utils");
const Project = require("../../models/Project");
const Text = require("../../models/Text");
const User = require("../../models/User");
const mongoose = require("mongoose");

router.get(
  "/dashboard/overview/:projectId",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      logger.info("Fetching dashboard overview information", {
        route: "/dashboard/overview",
      });

      const aggQuery = [
        {
          $project: {
            markup: 1,
            relations: 1,
            saved: 1,
            project_id: 1,
            iaa: 1,
          },
        },
        {
          $match: {
            project_id: mongoose.Types.ObjectId(req.params.projectId),
          },
        },
        {
          $group: {
            _id: "$project_id",
            savedBools: {
              $push: {
                $size: "$saved",
              },
            },
            totalTexts: {
              $sum: 1,
            },
            entities: {
              $sum: {
                $size: "$markup",
              },
            },
            triples: {
              $sum: {
                $size: "$relations",
              },
            },
            averageOverallIAA: {
              $avg: "$iaa.overall",
            },
            averageEntityIAA: {
              $avg: "$iaa.entity",
            },
            averageRelationIAA: {
              $avg: "$iaa.relation",
            },
            projectId: {
              $first: "$project_id",
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
            textsWithMinAnnotations: {
              $size: {
                $filter: {
                  input: "$savedBools",
                  as: "savedBools",
                  cond: {
                    $gte: [
                      "$$savedBools",
                      "$project.settings.annotatorsPerDoc",
                    ],
                  },
                },
              },
            },
            averageIAA: {
              overall: "$averageOverallIAA",
              entity: "$averageEntityIAA",
              relation: "$averageRelationIAA",
            },
          },
        },
        {
          $addFields: {
            progress: {
              $multiply: [
                {
                  $divide: ["$textsWithMinAnnotations", "$totalTexts"],
                },
                100,
              ],
            },
          },
        },
        {
          $project: {
            project: 0,
            savedBools: 0,
            projectId: 0,
          },
        },
      ];

      const response = await Text.aggregate(aggQuery).allowDiskUse(true).exec();
      res.json(response);
    } catch (err) {
      logger.error("Error fetching dashboard overview information");
      res.json({ message: err });
    }
  }
);

router.post(
  "/dashboard/overview/plot/:projectId",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      logger.info("Fetching plot data", {
        route: "/dashboard/overview/plot/:projectId",
      });

      if (!req.body.type) {
        res
          .status(400)
          .send(
            "Distribution type not supplied or incorrect. Please try again with either 'entity' or 'relation'."
          );
      }

      const project = await Project.findById({
        _id: req.params.projectId,
      })
        .populate("texts")
        .lean();

      const annotatorColours = await User.find(
        { _id: { $in: project.annotators.map((a) => a.user) } },
        { _id: 1, colour: 1, username: 1 }
      ).lean();

      console.log(annotatorColours);

      let labels;
      let datasets;
      let silverLabels;
      let weakLabels;
      let silverLabelColours;
      let weakLabelColours;
      let labelId2LabelDetail;
      let dates;

      switch (req.body.type) {
        case "overall":
          logger.info("Fetching overall progress");
          // Get number of annotated documents per day for all users

          const overallDistribution = await Text.aggregate([
            {
              $match: {
                project_id: mongoose.Types.ObjectId(req.params.projectId),
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
          res.json({ labels: labels, datasets: datasets });
          break;
        case "entity":
          logger.info("Fetching entity label distribution");

          labelId2LabelDetail = Object.assign(
            {},
            ...project.entityOntology.map((label) => ({
              [label._id]: label,
            }))
          );
          // console.log(labelId2LabelDetail);
          labels = Object.values(labelId2LabelDetail).map((label) => label);
          // console.log(labels);

          console.log(project.texts.filter);

          const markup = project.texts
            .filter((text) => text.markup)
            .flatMap((text) => text.markup);

          console.log("markup", markup);
          console.log(markup.filter((span) => !span.suggested));

          silverLabels = markup
            .filter((span) => !span.suggested)
            .map((span) => labelId2LabelDetail[span.label_id].fullName);
          console.log("silverLabels", silverLabels);

          weakLabels = markup
            .filter((span) => span.suggested)
            .map((span) => labelId2LabelDetail[span.label_id].fullName);

          console.log("weakLabels", weakLabels);

          silverLabelColours = labels.map((label) => label.colour);
          weakLabelColours = labels.map((label) =>
            utils.addAlpha(label.colour, 0.5)
          );

          break;
        case "relation":
          labelId2LabelDetail = Object.assign(
            {},
            ...project.relationOntology.map((label) => ({
              [label._id]: label,
            }))
          );
          // console.log(labelId2LabelDetail);
          // Note: colour added here for consistency; relations do not have native colours.
          labels = Object.values(labelId2LabelDetail).map((label) => ({
            ...label,
            colour: utils.getRandomColor(),
          }));
          silverLabels = project.texts
            .filter((text) => text.relations)
            .flatMap((text) =>
              text.relations
                .filter((rel) => !rel.suggested)
                .flatMap((rel) => labelId2LabelDetail[rel.label_id].fullName)
            );

          console.log(silverLabels);

          weakLabels = project.texts
            .filter((text) => text.relations)
            .flatMap((text) =>
              text.relations
                .filter((rel) => rel.suggested)
                .flatMap((rel) => labelId2LabelDetail[rel.label_id].fullName)
            );

          silverLabelColours = labels.map((label) => label.colour);
          weakLabelColours = labels.map((label) =>
            utils.addAlpha(label.colour, 0.5)
          );

          break;
        case "triple":
          logger.info("Fetching triple distribution");

          const tripleDistribution = await Text.aggregate([
            {
              $match: {
                project_id: mongoose.Types.ObjectId(req.params.projectId),
                saved: {
                  $gt: {
                    $size: 0, // TODO: Future make sure this is those with agreement over threshold
                  },
                },
              },
            },
            {
              $unwind: {
                path: "$relations",
              },
            },
            {
              $project: {
                relation: "$relations",
              },
            },
            {
              $group: {
                _id: {
                  source: "$relation.source_label",
                  target: "$relation.target_label",
                  relation: "$relation.label",
                },
                count: {
                  $sum: 1,
                },
              },
            },
            {
              $sort: {
                count: -1,
              },
            },
            {
              $limit: 20,
            },
          ])
            .allowDiskUse(true)
            .exec();

          // Transform into dataset for plot

          labels = tripleDistribution.map(
            (t) => `(${t._id.source}, ${t._id.relation}, ${t._id.target})`
          );

          datasets = tripleDistribution.map((t) => ({
            id: `(${t._id.source}, ${t._id.relation}, ${t._id.target})`,
            label: `(${t._id.source}, ${t._id.relation}, ${t._id.target})`,
            data: labels.map((label) =>
              label === `(${t._id.source}, ${t._id.relation}, ${t._id.target})`
                ? t.count
                : 0
            ),
            backgroundColor: "#b0bec5",
          }));

          res.json({ labels: labels, datasets: datasets });

          break;
        default:
          res
            .send(500)
            .send("An unexpected issue occurred 😞 - please try again");
          break;
      }

      const silverLabelFreqs = silverLabels.reduce((obj, e) => {
        obj[e] = (obj[e] || 0) + 1;
        return obj;
      }, {});

      const weakLabelFreqs = weakLabels.reduce((obj, e) => {
        obj[e] = (obj[e] || 0) + 1;
        return obj;
      }, {});

      // Order silver and weak labels - if label doesn't exist then gives 0
      const labelNames = labels.map((label) => label.fullName);
      const silverLabelsFreqAligned = labelNames.map((name) =>
        Object.keys(silverLabelFreqs).includes(name)
          ? silverLabelFreqs[name]
          : 0
      );
      const weakLabelsFreqAligned = labelNames.map((name) =>
        Object.keys(weakLabelFreqs).includes(name) ? weakLabelFreqs[name] : 0
      );

      const payload = {
        labels: labelNames,
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

      res.json(payload);
    } catch (err) {
      res.json({ message: err });
    }
  }
);

router.post(
  "/dashboard/adjudication",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      logger.info("Fetching data for adjudication page", {
        route: "/dashboard/adjudication",
      });

      const userId = authUtils.getUserIdFromToken(req.cookies.token);
      const expectedKeys = ["projectId", "filters"];

      if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
        res.status(400).send("One or more required fields not supplied");
      } else {
        const skip = parseInt((req.query.page - 1) * req.query.limit);
        const limit = parseInt(req.query.limit);
        const filters = req.body.filters;
        const sortDirection = parseInt(req.query.sort);

        // Check if user is on project
        const userAuthed = await Project.exists({
          _id: req.body.projectId,
          "annotators.user": userId,
        });
        if (!userAuthed) {
          res.status(401).send("Not authorized");
        }

        const aggQuery = [
          {
            $project: {
              original: 1,
              tokens: 1,
              markup: 1,
              relations: 1,
              saved: 1,
              project_id: 1,
              iaa: 1,
            },
          },
          {
            $match: {
              project_id: mongoose.Types.ObjectId(req.body.projectId),
            },
          },
          {
            $addFields: {
              saveCount: {
                $size: "$saved",
              },
            },
          },
          {
            $sort: {
              saveCount: sortDirection,
              _id: 1, // See: https://docs.mongodb.com/manual/reference/method/cursor.skip/#using-skip---with-sort--
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
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
              meetsMinAnnotations: {
                $gte: ["$saveCount", "$project.settings.annotatorsPerDoc"],
              },
            },
          },
          {
            $addFields: {
              annotators: {
                $filter: {
                  input: "$project.annotators",
                  as: "pa",
                  cond: {
                    $and: [
                      {
                        $eq: ["$$pa.disabled", false],
                      },
                      {
                        $eq: ["$$pa.state", "accepted"],
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "annotators.user",
              foreignField: "_id",
              as: "annotators",
            },
          },
          {
            $addFields: {
              annotators: {
                $map: {
                  input: "$annotators",
                  as: "a",
                  in: {
                    _id: "$$a._id",
                    colour: "$$a.colour",
                    username: "$$a.username",
                  },
                },
              },
            },
          },
          {
            $project: {
              project: 0,
              project_id: 0,
            },
          },
        ];

        const textAggregation = await Text.aggregate(aggQuery)
          .allowDiskUse(true)
          .exec();

        console.log(textAggregation);

        const text = textAggregation[0];
        const tokens = text.tokens;
        const relations = text.relations;
        const entities = text.markup;

        // console.log(text, tokens, relations, entities);

        let triplesAll = [];
        relations.map((r) => {
          const sourceEntity = entities.filter(
            (e) => e._id.toString() == r.source.toString()
          )[0];
          const targetEntity = entities.filter(
            (e) => e._id.toString() == r.target.toString()
          )[0];

          // Check if triple exists; if it does - add new
          const checkArr = (t, r) => {
            return [
              t.sourceLabel == r.source_label,
              t.sourceTokenStart == sourceEntity.start,
              t.sourceTokenEnd == sourceEntity.end,
              t.targetLabel == r.target_label,
              t.targetTokenStart == targetEntity.start,
              t.targetTokenEnd == targetEntity.end,
              ,
              t.relationLabel == r.label,
            ];
          };

          if (
            triplesAll.filter((t) => checkArr(t, r).every((v) => v === true))
              .length > 0
          ) {
            // If triple already found; add annotator to it.
            const tripleIndex = triplesAll.findIndex((v) =>
              checkArr(v, r).every((v) => v === true)
            );
            triplesAll[tripleIndex].createdBy.push(r.createdBy);
          } else {
            triplesAll.push({
              sourceLabel: r.source_label,
              sourceTokenStart: sourceEntity.start,
              sourceTokenEnd: sourceEntity.end,
              sourceToken: tokens
                .slice(sourceEntity.start, sourceEntity.end + 1)
                .map((t) => t.value)
                .join(" "),
              targetLabel: r.target_label,
              targetTokenStart: targetEntity.start,
              targetTokenEnd: targetEntity.end,
              targetToken: tokens
                .slice(targetEntity.start, targetEntity.end + 1)
                .map((t) => t.value)
                .join(" "),
              relationLabel: r.label,
              createdBy: [r.createdBy],
            });
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

        let entitiesAll = [];
        entities
          .filter((entity) => !entity.suggested)
          .filter(
            (entity) =>
              !relations
                .flatMap((r) => [r.source.toString(), r.target.toString()])
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
                sourceLabel: entity.label,
                // suggested: entity.suggested,
                sourceToken: tokens
                  .slice(entity.start, entity.end + 1)
                  .map((t) => t.value)
                  .join(" "),
                targetLabel: null,
                targetTokenStart: null,
                targetTokenEnd: null,
                targetToken: null,
                relationLabel: null,
                createdBy: [entity.createdBy],
              });
            }
          });

        const getAggregateAnnotation = (
          triples,
          numberAnnotators,
          threshold = 0.8
        ) => {
          // Marks triples with 'aggregate' status if meeting condition

          const filteredTriples = triples.map((triple) => ({
            ...triple,
            aggregate: triple.createdBy.length / numberAnnotators >= threshold,
          }));
          return filteredTriples;
        };

        const payload = {
          content: text,
          triples: getAggregateAnnotation(
            [...triplesAll, ...entitiesAll],
            Object.keys(text.annotators).length
          ),
        };
        res.json(payload);
      }
    } catch (err) {
      logger.error("Failed to fetch adjudication data");
      res.json({ message: err });
    }
  }
);

router.post(
  "/dashboard/effort/:projectId",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      logger.info("Fetching annotator effort overview", {
        route: "/api/project/dashboard/download",
      });
      // Return {username, id, colour, entities (total, silver/weak, saved), triples (total, saved)}

      const filters = req.body.filters;
      console.log(filters);

      const project = await Project.findById(
        { _id: req.params.projectId },
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
      switch (req.body.filters.saved) {
        case "any":
          saveMatch = {};
          break;
        case "yes":
          saveMatch = { saved: { $gt: [{ $size: "$saved" }, 0] } };
          break;
        case "no":
          saveMatch = { saved: { $size: 0 } };
          break;
        default:
          saveMatch = {};
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

      let qualityMatch;
      switch (req.body.filters.quality) {
        // NOTE: Currently this will return all texts that have the match, but doens't
        // remove weak entities from silver ones in the markup array etc. #TODO: Account for this.
        case "any":
          qualityMatch = {};
          break;
        case "silver":
          qualityMatch = {
            markup: { $elemMatch: { suggested: false } },
          };
          break;
        case "weak":
          qualityMatch = {
            markup: { $elemMatch: { suggested: true } },
          };
          break;
        default:
          qualityMatch = {};
          break;
      }

      const textMatch = [
        {
          $match: {
            project_id: mongoose.Types.ObjectId(req.params.projectId),
            ...saveMatch,
            ...iaaMatch,
            ...qualityMatch,
          },
        },
      ];

      const texts = await Text.aggregate(textMatch).allowDiskUse(true).exec();

      const triples = texts.flatMap((text) => text.relations);
      const entities = texts.flatMap((text) => text.markup);
      const savedTexts = texts.filter((text) => text.saved.length > 0);
      const savedTriples = savedTexts
        .filter((text) => text.relations)
        .flatMap((text) => text.relations);
      const savedEntities = savedTexts
        .filter((text) => text.markup)
        .flatMap((text) => text.markup);

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

      res.json({
        annotators: [
          ...annotators,
          { _id: "gold", colour: "#ffc107", username: "Gold" },
        ],
        results: Object.assign({}, ...[...results, goldResults]),
      });
    } catch (err) {
      logger.error("Failed to get dashboard download overview");
      res.json({ message: err });
    }
  }
);

// router.get(
//   "/dashboard/download/test",
//   authUtils.cookieJwtAuth,
//   async (req, res) => {
//     try {
//       // var jsonObj = getJSON();
//       var data = JSON.stringify({"hello": "world"});
//       res.header('Content-disposition', 'attachment; filename= myFile.json');
//       // res.header('Content-type', 'application/json');
//       res.write(data, function (err) {
//           res.end();
//       })
//     } catch (err) {
//       res.status(500).send("Something went wrong");
//     }
//   }
// );

router.post(
  "/dashboard/download",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      logger.info("Fetching download", {
        route: "/api/project/dashboard/download",
      });
      const expectedKeys = ["projectId", "filters"];

      if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
        res.status(400).send("One or more required fields not supplied");
      } else {
        const filters = req.body.filters;
        logger.info("Download filters", filters);

        const project = await Project.findById(
          { _id: req.body.projectId },
          { entityOntology: 1, relationOntology: 1, tasks: 1, settings: 1 }
        ).lean();
        const entityOntology = project.entityOntology;
        const relationOntology = project.relationOntology;
        const performingRelationAnnotation = project.tasks.relationAnnotation;
        const annotatorsPerDoc = project.settings.annotatorsPerDoc;
        logger.info("Loaded ontologies");

        let saveMatch;
        switch (req.body.filters.saved) {
          case "any":
            saveMatch = {};
            break;
          case "yes":
            saveMatch = { saved: { $gt: [{ $size: "$saved" }, 0] } };
            break;
          case "no":
            saveMatch = { saved: { $size: 0 } };
            break;
          default:
            saveMatch = {};
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

        let qualityMatch;
        switch (req.body.filters.quality) {
          // NOTE: Currently this will return all texts that have the match, but doens't
          // remove weak entities from silver ones in the markup array etc. #TODO: Account for this.
          case "any":
            qualityMatch = {};
            break;
          case "silver":
            qualityMatch = {
              markup: { $elemMatch: { suggested: false } },
            };
            break;
          case "weak":
            qualityMatch = {
              markup: { $elemMatch: { suggested: true } },
            };
            break;
          default:
            qualityMatch = {};
            break;
        }

        const textMatch = [
          {
            $match: {
              project_id: mongoose.Types.ObjectId(req.body.projectId),
              ...saveMatch,
              ...iaaMatch,
              ...qualityMatch,
            },
          },
        ];

        const texts = await Text.aggregate(textMatch).allowDiskUse(true).exec();

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

        switch (req.body.filters.annotationType) {
          case "triples":
            const tripleAnnotations = req.body.filters.annotators.map(
              (annotatorInfo) => {
                const annotatorUsername = annotatorInfo.username;
                const annotatorId = annotatorInfo._id;
                logger.info(`Processing annotation for ${annotatorUsername}`);

                if (annotatorId.toLowerCase() === "gold") {
                  // These are aggregate annotations.
                  const savedTexts = texts.filter(
                    (t) => t.saved.length >= annotatorsPerDoc
                  );

                  // CODE BORROWED FROM ADJUDICATION ENDPOINT
                  const goldTriples = savedTexts
                    .filter((text) => text.relations.length > 0)
                    .map((text) => {
                      const tokens = text.tokens;
                      const relations = text.relations;
                      const entities = text.markup;

                      // console.log(text, tokens, relations, entities);

                      let triplesAll = [];
                      relations.map((r) => {
                        const sourceEntity = entities.filter(
                          (e) => e._id.toString() == r.source.toString()
                        )[0];
                        const targetEntity = entities.filter(
                          (e) => e._id.toString() == r.target.toString()
                        )[0];

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
                              fullLabel: entityOntology.filter(
                                (l) =>
                                  l._id.toString() ===
                                  sourceEntity.label_id.toString()
                              )[0].fullName,
                              label: sourceEntity.label,
                              start: sourceEntity.start,
                              end: sourceEntity.end,
                              value: tokens
                                .map((t) => t.value)
                                .slice(sourceEntity.start, sourceEntity.end + 1)
                                .join(" "),
                              tokens: tokens
                                .map((t) => t.value)
                                .slice(
                                  sourceEntity.start,
                                  sourceEntity.end + 1
                                ),
                              quality: "gold",
                            },
                            target: {
                              fullLabel: entityOntology.filter(
                                (l) =>
                                  l._id.toString() ===
                                  targetEntity.label_id.toString()
                              )[0].fullName,
                              label: targetEntity.label,
                              start: targetEntity.start,
                              end: targetEntity.end,
                              value: tokens
                                .map((t) => t.value)
                                .slice(targetEntity.start, targetEntity.end + 1)
                                .join(" "),
                              tokens: tokens
                                .map((t) => t.value)
                                .slice(
                                  targetEntity.start,
                                  targetEntity.end + 1
                                ),
                              quality: "gold",
                            },
                            relation: {
                              fullLabel: relationOntology.filter(
                                (l) =>
                                  l._id.toString() === r.label_id.toString()
                              )[0].fullName,
                              label: r.label,
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
                        threshold = req.body.filters.iaa === 0
                          ? 0
                          : req.body.filters.iaa / 100
                      ) => {
                        // Marks triples with 'aggregate' status if meeting condition
                        const filteredTriples = triples
                          .filter((triple) => {
                            // console.log(
                            //   triple.createdBy.length / numberAnnotators
                            // );
                            // console.log(threshold);
                            return (
                              triple.createdBy.length / numberAnnotators >=
                              threshold
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
                        triples: aggregateTriples,
                      };

                      return payload;
                    });

                  return { [annotatorUsername]: goldTriples };
                } else {
                  // Filter texts for those that have relations and include the annotator
                  const allTriples = texts
                    .filter(
                      (text) =>
                        text.relations.length > 0 &&
                        text.relations.filter(
                          (r) =>
                            r.createdBy.toString() === annotatorId.toString()
                        ).length > 0
                    )
                    .map((text) => {
                      const relations = text.relations.filter(
                        (r) => r.createdBy.toString() === annotatorId.toString()
                      );

                      const triples = relations.flatMap((r) => {
                        const tokenValues = text.tokens.map((t) => t.value);
                        const sourceEntity = text.markup.filter(
                          (e) => e._id.toString() == r.source.toString()
                        )[0];
                        const targetEntity = text.markup.filter(
                          (e) => e._id.toString() == r.target.toString()
                        )[0];

                        return {
                          source: {
                            fullLabel: entityOntology.filter(
                              (l) =>
                                l._id.toString() ===
                                sourceEntity.label_id.toString()
                            )[0].fullName,
                            label: sourceEntity.label,
                            start: sourceEntity.start,
                            end: sourceEntity.end,
                            value: tokenValues
                              .slice(sourceEntity.start, sourceEntity.end + 1)
                              .join(" "),
                            tokens: tokenValues.slice(
                              sourceEntity.start,
                              sourceEntity.end + 1
                            ),
                            quality: sourceEntity.suggested ? "weak" : "silver",
                          },
                          target: {
                            fullLabel: entityOntology.filter(
                              (l) =>
                                l._id.toString() ===
                                targetEntity.label_id.toString()
                            )[0].fullName,
                            label: targetEntity.label,
                            start: targetEntity.start,
                            end: targetEntity.end,
                            value: tokenValues
                              .slice(targetEntity.start, targetEntity.end + 1)
                              .join(" "),
                            tokens: tokenValues.slice(
                              targetEntity.start,
                              targetEntity.end + 1
                            ),
                            quality: targetEntity.suggested ? "weak" : "silver",
                          },
                          relation: {
                            fullLabel: relationOntology.filter(
                              (l) => l._id.toString() === r.label_id.toString()
                            )[0].fullName,
                            label: r.label,
                            quality: r.suggested ? "weak" : "silver",
                          },
                          surfaceText: markupSurfaceText(
                            sourceEntity,
                            targetEntity,
                            text.tokens.map((t) => t.value)
                          ), // Note either source/target can be used here, they are realized on the same document.
                        };
                      });
                      return {
                        docId: text._id,
                        doc: text.tokens.map((t) => t.value),
                        triples: triples,
                        weight: 1, // Indicates how beliaveable inforamtion is; could be based on user confidence, source of text, etc.
                      };
                    });

                  return { [annotatorUsername]: allTriples };
                }
              }
            );

            res.json({
              meta: {
                filters: {
                  ...filters,
                  annotators: filters.annotators.map((a) => a.username),
                },
                // dataset: '',
              },
              annotations: tripleAnnotations,
            });
            break;
          case "entities":
            const entityAnnotations = req.body.filters.annotators.map(
              (annotatorInfo) => {
                const annotatorUsername = annotatorInfo.username;
                const annotatorId = annotatorInfo._id;
                logger.info(`Processing annotation for ${annotatorUsername}`);

                if (annotatorId.toLowerCase() === "gold") {
                  const savedTexts = texts.filter(
                    (t) => t.saved.length >= annotatorsPerDoc
                  );

                  const goldEntities = savedTexts
                    .filter((text) => text.markup)
                    .map((text) => {
                      const checkEntityArr = (e1, e2) => {
                        // e1 is the transformed entity with triple based key names and
                        // e2 is the native entity
                        console.log("e1", e1, "e2", e2);
                        return [
                          e1.start === e2.start,
                          e1.end === e2.end,
                          e1.label === e2.label,
                          e1.label_id.toString() === e2.label_id.toString(),
                        ];
                      };

                      const entities = text.markup;
                      // console.log(
                      //   entities.filter((entity) => !entity.suggested)
                      // );
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
                            entitiesAll[entityIndex].createdBy.push(
                              entity.createdBy
                            );
                          } else {
                            entitiesAll.push({
                              start: entity.start,
                              end: entity.end,
                              label: entity.label,
                              label_id: entity.label_id,
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
                        threshold = req.body.filters.iaa === 0
                          ? 0
                          : req.body.filters.iaa / 100
                      ) => {
                        console.log(entities);
                        const filteredEntities = entities
                          .filter((entity) => {
                            console.log(entity);
                            return (
                              entity.createdBy.length / numberAnnotators >=
                              threshold
                            );
                          })
                          .map((entity) => {
                            delete entity.createdBy;
                            return entity;
                          });
                        return filteredEntities;
                      };

                      const aggregateEntities = getAggregateAnnotation(
                        entitiesAll,
                        annotatorsPerDoc
                      );

                      const payload = {
                        docId: text._id,
                        doc: text.tokens.map((token) => token.value),
                        mentions: aggregateEntities.map((e) => ({
                          start: e.start,
                          end: e.end,
                          label: entityOntology.filter(
                            (l) => l._id.toString() === e.label_id.toString()
                          )[0].fullName,
                          quality: "gold",
                        })),
                      };

                      return payload;
                    });

                  return { [annotatorUsername]: goldEntities };
                } else {
                  const entities = texts.flatMap((text) => ({
                    docId: text._id,
                    doc: text.tokens.map((token) => token.value),
                    mentions: text.markup
                      .filter(
                        (span) =>
                          span.createdBy.toString() === annotatorId.toString()
                      )
                      .map((span) => ({
                        start: span.start,
                        end: span.end,
                        label: entityOntology.filter(
                          (l) => l._id.toString() === span.label_id.toString()
                        )[0].fullName,
                        quality: span.suggested ? "weak" : "silver",
                      })),
                  }));

                  return { [annotatorUsername]: entities };
                }
              }
            );
            res.json({
              meta: {
                filters: {
                  ...filters,
                  annotators: filters.annotators.map((a) => a.username),
                },
                // dataset: '',
              },
              annotations: entityAnnotations,
            });
            break;
          default:
            res.status(500).send("Something went wrong");
            break;
        }
      }
    } catch (err) {
      logger.error("Failed to download results");
      res.json({ message: err });
    }
  }
);

module.exports = router;
