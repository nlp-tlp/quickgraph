const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const _ = require("lodash");
const authUtils = require("../auth/utils");
const utils = require("./utils");
const Project = require("../../models/Project");
const Text = require("../../models/Text");
const mongoose = require("mongoose");
const { getFontColour, addAlpha } = require("./utils");

router.get("/graph/:projectId", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    const userId = authUtils.getUserIdFromToken(req.cookies.token);

    const markupMatch =
      req.params.aggregate === "true"
        ? { markup: { $gt: [{ $size: "$markup" }, 0] } }
        : {
            markup: {
              $elemMatch: { createdBy: mongoose.Types.ObjectId(userId) },
            },
          };

    const userSeparatedGraphFilter =
      req.params.aggregate === "true"
        ? {}
        : {
            $addFields: {
              markup: {
                $filter: {
                  input: "$markup",
                  as: "m",
                  cond: {
                    $eq: ["$$m.createdBy", mongoose.Types.ObjectId(userId)],
                  },
                },
              },
              relations: {
                $filter: {
                  input: "$relations",
                  as: "r",
                  cond: {
                    $eq: ["$$r.createdBy", mongoose.Types.ObjectId(userId)],
                  },
                },
              },
            },
          };

    const aggQuery = [
      {
        $match: {
          project_id: mongoose.Types.ObjectId(req.params.projectId),
          // saved: {
          //   $gt: [
          //     {
          //       $size: "$saved",
          //     },
          //     0,
          //   ],
          // },
          ...markupMatch,
          // markup: {
          //   $gt: [
          //     {
          //       $size: "$markup",
          //     },
          //     0,
          //   ],
          // },
        },
      },
      userSeparatedGraphFilter,
      {
        $set: {
          "markup.textId": "$_id",
          "markup.textTokens": "$tokens",
          "markup.textOriginal": "$original",
          "relations.textId": "$_id",
        },
      },
      {
        $group: {
          _id: "$project_id",
          totalTexts: { $sum: 1 },
          nodes: {
            $push: "$markup",
          },
          edges: {
            $push: "$relations",
          },
        },
      },
      {
        $project: {
          totalTexts: 1,
          nodes: {
            $reduce: {
              input: "$nodes",
              initialValue: [],
              in: {
                $concatArrays: ["$$value", "$$this"],
              },
            },
          },
          edges: {
            $reduce: {
              input: "$edges",
              initialValue: [],
              in: {
                $concatArrays: ["$$value", "$$this"],
              },
            },
          },
        },
      },
      {
        $set: {
          "nodes.hidden": false,
          "edges.arrows": "to",
          "edges.hidden": false,
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
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
          entityOntology: "$project.entityOntology",
          relationOntology: "$project.relationOntology",
        },
      },
      {
        $project: {
          project: 0,
        },
      },
    ];

    const response = await Text.aggregate(aggQuery).allowDiskUse(true).exec();

    // Add information to node/relations
    const nodes = response[0].nodes
      .map((n) => {
        const nodeColour = response[0].entityOntology.filter(
          (label) => label._id.toString() == n.label_id.toString()
        )[0].colour;
        return {
          id: n._id,
          label: n.textTokens
            .slice(n.start, n.end + 1)
            .map((t) => t.value)
            .join(" "),
          class: n.label,
          text: n.textOriginal,
          textId: n.textId,
          hidden: n.hidden,
          hiddenLabel: n.textTokens
            .slice(n.start, n.end + 1)
            .map((t) => t.value)
            .join(" "),
          hiddenColor: nodeColour,
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
      })
      .slice(0, 5001);

    const edges = response[0].edges.map((e, index) => {
      return {
        id: index,
        from: e.source,
        to: e.target,
        label: e.label,
        arrows: e.arrows,
        hidden: e.hidden,
        hiddenLabel: e.label,
        textId: e.textId,
        suggested: e.suggested,
        dashes: e.suggested,
      };
    });
    // let relationOntology = response[0].relationOntology;

    // console.log(entityOntology);

    const getGroups = (nodes, ontology) => {
      // Create groups for legend/filters etc.
      const nodeClasses = [...new Set(nodes.map((node) => node.class))];
      const groups = Object.assign(
        {},
        ...ontology
          .filter((label) => nodeClasses.includes(label.name))
          .map((label) => ({
            [label.name]: { shape: "dot", color: label.colour },
          }))
      );

      return groups;
    };

    const buildSeparatedGraph = () => {
      /*
        Generates nodes, edges and groups for a seperated graph. A separated graph is a set of
        sub-graphs generated from document annotation.

        Notes:
          - Currently does not return weak entities
      */
      const groups = getGroups(nodes, response[0].entityOntology);
      res.json({
        data: {
          nodes: nodes,
          edges: edges,
        },
        groups: groups,
        metrics: {
          totalDocs: response[0].totalTexts,
          totalNodes: nodes.length,
          totalEdges: edges.length,
        },
      });
    };

    const buildAggregateGraph = () => {
      /*
          Aggregates entity and relations based on type/lexical content
          Given two entities - {value: pump, type: activity} and {value: pump, type: item},
          each will be considered unique.
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

      // console.log(superNodes);

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

      // console.log('sn v2', superNodes);

      // Create set of 'super' edges
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
      // console.log("superEdges", superEdges);

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
      const groups = getGroups(superNodes, response[0].entityOntology);

      res.json({
        data: {
          nodes: superNodes,
          edges: superEdgesReindexed,
        },
        groups: groups,
        metrics: {
          totalDocs: response[0].totalTexts,
          totalNodes: nodes.length,
          totalEdges: superEdgesReindexed.length,
        },
      });
    };

    switch (req.query.aggregate) {
      case "true":
        logger.info("Building aggregated graph");
        buildAggregateGraph();
        break;
      case "false":
        logger.info("Building seperated graph");
        buildSeparatedGraph();
        break;
      default:
        logger.error("Insufficient information provided");
        res.status(400).send("Insufficient information provided");
        break;
    }
  } catch (err) {
    res.json({ message: err });
  }
});

module.exports = router;
