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

router.post("/graph/:projectId", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    const userId = authUtils.getUserIdFromToken(req.cookies.token);

    const ontologies = await Project.findById(
      { _id: req.params.projectId },
      { entityOntology: 1, relationOntology: 1, _id: 0 }
    ).lean();

    // Flatten entity and relation ontologies
    function flattenOntology(a) {
      return a.reduce(function (
        flattened,
        { id, name, fullName, colour = null, children }
      ) {
        return flattened
          .concat([{ id, name, fullName, colour }])
          .concat(children ? flattenOntology(children) : []);
      },
      []);
    }

    let flatEntityOntology = flattenOntology(ontologies.entityOntology);
    let flatRelationOntology = flattenOntology(ontologies.relationOntology);

    // Get all classes that are used and filter ontologies for these
    // makes users unable to select classes that do not have data

    let activeClasses = await Text.aggregate([
      {
        $match: {
          project_id: mongoose.Types.ObjectId(req.params.projectId),
        },
      },
      {
        $group: {
          _id: "$project_id",
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
        $unwind: {
          path: "$nodes",
        },
      },
      {
        $unwind: {
          path: "$edges",
        },
      },
      {
        $group: {
          _id: "$_id",
          entityClasses: {
            $addToSet: "$nodes.label_id",
          },
          relationClasses: {
            $addToSet: "$edges.label_id",
          },
        },
      },
      {
        $project: { _id: 0 },
      },
    ])
      .allowDiskUse(true)
      .exec();

    activeClasses = activeClasses.length > 0 ? activeClasses[0] : activeClasses;

    console.log("active classes", activeClasses);

    // Filter flat ontologies
    flatEntityOntology = flatEntityOntology.filter((item) =>
      activeClasses.entityClasses.includes(item.id.toString())
    );
    flatRelationOntology = flatRelationOntology.filter((item) =>
      activeClasses.relationClasses.includes(item.id.toString())
    );

    const markupMatch =
      req.params.aggregate === "true"
        ? { markup: { $gt: [{ $size: "$markup" }, 0] } }
        : {
            markup: {
              $elemMatch: { createdBy: mongoose.Types.ObjectId(userId) },
            },
          };

    // If separated graph - only show markup made by user with userId
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

    const textSearchFilter =
      req.body.filters.search.value === ""
        ? {}
        : {
            original: {
              $regex: new RegExp(req.body.filters.search.value),
              $options: "i",
            },
          };

    const classMatchFilter =
      req.body.filters.entityClasses.length > 0 &&
      req.body.filters.relationClasses.length > 0
        ? {
            $or: [
              req.body.filters.entityClasses.length > 0 && {
                "markup.label": {
                  $regex: req.body.filters.entityClasses.join("|"),
                },
              },
              req.body.filters.relationClasses.length > 0 && {
                "relation.label": {
                  $regex: req.body.filters.relationClasses.join("|"),
                },
              },
            ],
          }
        : {};

    // console.log("class match filter", classMatchFilter);

    const entityClassesFilter = {
      $addFields: {
        markup:
          req.body.filters.entityClasses.length > 0
            ? {
                $filter: {
                  input: "$markup",
                  as: "m",
                  cond: {
                    $in: ["$$m.label", req.body.filters.entityClasses],
                  },
                },
              }
            : "$markup",
      },
    };

    // console.log("entity class filter", entityClassesFilter);

    const relationClassesFilter = {
      $addFields: {
        relations:
          req.body.filters.relationClasses.length > 0
            ? {
                $filter: {
                  input: "$relations",
                  as: "r",
                  cond: {
                    $in: ["$$r.label", req.body.filters.relationClasses],
                  },
                },
              }
            : "$relations",
      },
    };

    // console.log("relation class filter", relationClassesFilter);

    const aggQuery = [
      {
        $match: {
          project_id: mongoose.Types.ObjectId(req.params.projectId),
          ...textSearchFilter,
          ...markupMatch,
          ...classMatchFilter,
          // saved: {
          //   $gt: [
          //     {
          //       $size: "$saved",
          //     },
          //     0,
          //   ],
          // },
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
      entityClassesFilter,
      relationClassesFilter,
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
    ];

    let response = await Text.aggregate(aggQuery).allowDiskUse(true).exec();
    graphData = response.length > 0 ? response[0] : response;

    console.log("graphData", graphData);

    if (graphData.length === 0) {
      console.log("No data returned");
      res.json({
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
        ontologies: {
          entity: flatEntityOntology,
          relation: flatRelationOntology,
        },
      });
    } else if (graphData.nodes.length < 2 || graphData.edges.length < 1) {
      console.log("Has insufficent nodes and/or edges");

      res.json({
        data: {
          nodes: [],
          edges: [],
        },
        classes: { nodes: null, edges: null },
        metrics: {
          totalDocs: graphData.totalTexts,
          totalNodes: 0,
          totalEdges: 0,
        },
        ontologies: {
          entity: flatEntityOntology,
          relation: flatRelationOntology,
        },
      });
    } else {
      console.log("Nodes and edges exist");
      // Add information to node/relations

      console.log("Number of nodes", graphData.nodes.length);
      const nodes =
        graphData.nodes.length > 0 &&
        graphData.nodes
          .map((n) => {
            const nodeColour = flatEntityOntology.filter(
              (item) => item.id.toString() == n.label_id.toString()
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
                background: n.suggested
                  ? addAlpha(nodeColour, 0.6125)
                  : nodeColour,
              },
              borderWidth: n.suggested ? 2 : 0,
              shapeProperties: {
                borderDashes: false,
              },
            };
          })
          .slice(0, 5001);

      console.log("Number of edges", graphData.edges.length);

      const edges =
        graphData.edges.length > 0 &&
        graphData.edges.map((e, index) => {
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

      console.log("edges", edges);

      // TODO: Merge getNodeGroups and getEdgeGroups

      const getNodeGroups = (nodes, ontology) => {
        // Create groups for legend/filters etc - including parent classes
        
        const nodeClasses = [...new Set(nodes.map((node) => node.class))];
        console.log(`nodeClasses -> ${nodeClasses}`);

        // const nodeClassesIncParents = nodes.flatMap(node => )

        // TODO: Get parents as well - filter on those with '/' in their names, flatMap them into nodeClasses.
        // const nodeClassesIncParents = ontology.filter(label => label.name.includes())

        



        const groups = ontology.filter((label) =>
          nodeClasses.includes(label.name)
        );
        // console.log(groups);
        return groups;
      };

      const getEdgeGroups = (edges, ontology) => {
        // Create group of edges for legend/filter etc.
        const edgeClasses = [...new Set(edges.map((e) => e.label))];
        // Get full name of edges using ontology
        const groups = ontology.filter((label) =>
          edgeClasses.includes(label.name)
        );
        return groups;
      };

      const filterNodes = (nodes, edges) => {
        // Filters nodes based on whether they are connected.
        const connectedNodes = edges
          .flatMap((e) => [e.from, e.to])
          .map((id) => id.toString());
        // console.log(connectedNodes);

        return nodes.filter((n) => connectedNodes.includes(n.id.toString()));
      };

      const buildSeparatedGraph = () => {
        /*
        Generates nodes, edges and groups for a seperated graph. A separated graph is a set of
        sub-graphs generated from document annotation.

        Notes:
          - Currently does not return weak entities
      */

        const fNodes = filterNodes(nodes, edges); // Filter out unconnected nodes

        const nodeClasses = getNodeGroups(fNodes, flatEntityOntology);
        const edgeClasses = getEdgeGroups(edges, flatRelationOntology);

        console.log(fNodes.length);

        res.json({
          data: {
            nodes: fNodes,
            edges: edges,
          },
          classes: { nodes: nodeClasses, edges: edgeClasses },
          metrics: {
            totalDocs: new Set(fNodes.map((n) => n.textId)).size,
            totalNodes: fNodes.length,
            totalEdges: edges.length,
          },
          ontologies: {
            entity: flatEntityOntology,
            relation: flatRelationOntology,
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
        const nodeClasses = getNodeGroups(superNodes, flatEntityOntology);
        const edgeClasses = getEdgeGroups(superEdges, flatRelationOntology);

        const fSuperNodes = filterNodes(superNodes, superEdgesReindexed);

        console.log("before aggregate response");

        res.json({
          data: {
            nodes: fSuperNodes,
            edges: superEdgesReindexed,
          },
          classes: { nodes: nodeClasses, edges: edgeClasses },
          metrics: {
            totalDocs: graphData.totalTexts,
            totalNodes: fSuperNodes.length,
            totalEdges: superEdgesReindexed.length,
          },
          ontologies: {
            entity: flatEntityOntology,
            relation: flatRelationOntology,
          },
        });
      };

      switch (req.body.aggregate) {
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
          res.status(400).send("Insufficient information provided");
          break;
      }
    }
  } catch (err) {
    res.json({ message: err });
  }
});

module.exports = router;
