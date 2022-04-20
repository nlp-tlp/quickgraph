const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const dotenv = require("dotenv");
const authUtils = require("../auth/utils");
const User = require("../../models/User");
const Project = require("../../models/Project");
const Text = require("../../models/Text");
const crypto = require("crypto");
dotenv.config();
const mongoose = require("mongoose");

router.get("/", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Fetching all projects", { route: "/api/project/" });
    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    const aggQuery = [
      {
        $match: {
          annotators: {
            $elemMatch: {
              user: mongoose.Types.ObjectId(userId),
              disabled: false,
              state: "accepted",
            },
          },
        },
      },
      {
        $lookup: {
          from: "texts",
          localField: "texts",
          foreignField: "_id",
          as: "textInfo",
        },
      },
      {
        $addFields: {
          totalTexts: {
            $size: "$texts",
          },
          savedTexts: {
            $size: {
              $filter: {
                input: "$textInfo",
                as: "text",
                cond: {
                  $gte: [
                    {
                      $size: "$$text.saved",
                    },
                    "$settings.annotatorsPerDoc",
                  ],
                },
              },
            },
          },
          annotatorCount: { $size: "$annotators" },
        },
      },
      {
        $project: {
          _id: 1,
          totalTexts: 1,
          savedTexts: 1,
          tasks: 1,
          name: 1,
          description: 1,
          cluster: 1,
          annotatorCount: 1,
          createdAt: 1,
        },
      },
    ];

    const textAggregation = await Project.aggregate(aggQuery)
      .allowDiskUse(true)
      .exec();
    res.json(textAggregation);
  } catch (err) {
    res.json({ message: err });
    logger.error("Failed to fetch all projects", { route: "/api/project/" });
  }
});

router.patch("/:projectId", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Updating single project", { route: "/api/project/" });
    const userId = authUtils.getUserIdFromToken(req.cookies.token);

    const updatedProject = await Project.findOneAndUpdate(
      { _id: req.params.projectId, projectManager: userId },
      { [req.body.field]: req.body.value },
      { new: true }
    );

    res.json(updatedProject);
  } catch (err) {
    res.json({ message: err });
    logger.error("Failed to update single project", { route: "/api/project/" });
  }
});

router.get("/:projectId", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Fetching single project", {
      route: `/api/project/${req.params.projectId}`,
    });
    const user_id = authUtils.getUserIdFromToken(req.cookies.token);
    const response = await Project.findOne(
      {
        _id: req.params.projectId,
        $or: [
          { projectManager: user_id },
          {
            $and: [
              { "annotators.user": user_id },
              { "annotators.disabled": false },
              { "annotators.state": "accepted" },
            ],
          },
        ],
      },
      { texts: 0 }
    )
      .populate({
        path: "annotators.user",
        select: { _id: 1, username: 1, colour: 1 },
      })
      .lean();
    res.json(response);
  } catch (err) {
    res.json({ message: err });
    logger.error("Failed to fetch single project", {
      route: `/api/project/${req.params.projectId}`,
    });
  }
});

router.delete("/:projectId", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Deleting project", { route: "/api/project/" });
    const user_id = authUtils.getUserIdFromToken(req.cookies.token);

    const projectResponse = await Project.findOne({
      _id: req.params.projectId,
      projectManager: user_id,
    })
      .populate("texts")
      .lean();

    // Get ids of associated documents
    const textIds = projectResponse.texts.map((text) => text._id);

    // Get ids of annotators and create update objects to remove project from project array
    const userUpdateObj = projectResponse.annotators.map((a) => ({
      updateOne: {
        filter: {
          _id: a.user,
        },
        update: {
          $pull: {
            projects: { project: req.params.projectId },
          },
        },
      },
    }));

    console.log(userUpdateObj);

    // Delete documents in collections
    const userRes = await User.bulkWrite(userUpdateObj);
    console.log("user res", userRes);
    await Project.deleteOne({ _id: req.params.projectId });
    await Text.deleteMany({ _id: textIds });
    res.json("Successfully deleted project.");
  } catch (err) {
    res.json({ message: err });
    logger.error("Failed to delete project", { route: "/api/project/" });
  }
});

router.post("/annotator", authUtils.cookieJwtAuth, async (req, res) => {
  // Add a single annonymous or real user to a project
  // TODO: Add process for adding real user to project
  try {
    console.log(req.body);

    const response = await Project.findById({
      _id: req.body.project_id,
    }).lean();

    let updatedAnnotators;
    if (response.annotators) {
      updatedAnnotators = [
        ...response.annotators,
        {
          name: req.body.name,
          role: req.body.role,
          accessId: crypto.randomBytes(8).toString("hex"),
        },
      ];
    } else {
      updatedAnnotators = [
        {
          name: req.body.name,
          role: req.body.role,
          accessId: crypto.randomBytes(8).toString("hex"),
        },
      ];
    }

    console.log(updatedAnnotators);

    const updateResponse = await Project.updateOne(
      { _id: req.body.project_id },
      { $set: { annotators: updatedAnnotators } },
      { upsert: true, new: true }
    );

    res.json(updateResponse);
  } catch (err) {
    res.json({ message: err });
  }
});

router.patch("/annotator", authUtils.cookieJwtAuth, async (req, res) => {
  // Deletes a single annonymous or real user to a project
  // TODO: add process for deleting real user from project
  try {
    console.log(req.body);

    if (req.body.action === "remove") {
      const response = await Project.updateOne(
        { _id: req.body.project_id },
        {
          $pull: {
            annotators: { _id: req.body.annotator_id },
          },
        },
        { multi: true, upsert: true, new: true }
      );

      res.json(response);
    } else {
      res.json("please try again!");
    }
  } catch (err) {
    res.json({ message: err });
  }
});

router.get("/metrics/:projectId", authUtils.cookieJwtAuth, async (req, res) => {
  /* Metrics for a single project */
  try {
    logger.info("Fetching project metrics for user", {
      route: "/metrics/:projectId",
    });
    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    const aggQuery = [
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.projectId),
        },
      },
      {
        $lookup: {
          from: "texts",
          localField: "texts",
          foreignField: "_id",
          as: "textInfo",
        },
      },
      {
        $addFields: {
          totalTexts: {
            $size: "$texts",
          },
          savedTexts: {
            $size: {
              $filter: {
                input: "$textInfo",
                as: "texts",
                cond: {
                  $eq: [
                    {
                      $size: {
                        $filter: {
                          input: "$$texts.saved",
                          as: "savedTexts",
                          cond: {
                            $eq: [
                              "$$savedTexts.createdBy",
                              mongoose.Types.ObjectId(userId),
                            ],
                          },
                        },
                      },
                    },
                    1,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          totalTexts: 1,
          savedTexts: 1,
        },
      },
      {
        $addFields: {
          description: "Texts Saved",
          value: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: ["$savedTexts", "$totalTexts"],
                  },
                  100,
                ],
              },
            ],
          },
        },
      },
    ];

    const textAggregation = await Project.aggregate(aggQuery)
      .allowDiskUse(true)
      .exec();
    res.json(textAggregation);
  } catch (err) {
    logger.error("Failed to fetch project metrics");
    res.json({ message: err });
  }
});

router.get(
  "/metrics/clusters/:projectId",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      // Get clusters
      const project = await Project.findById(
        { _id: req.params.projectId },
        "cluster"
      ).lean();
      const clusters = project.cluster;

      // Get annotation state of texts on clusters
      const texts = await Text.find({
        project_id: req.params.projectId,
        annotated: true,
      }).lean();
      console.log(texts.length);

      const annotatedTextClusters = texts
        .map((text) => text.cluster)
        .reduce((obj, e) => {
          obj[e] = (obj[e] || 0) + 1;
          return obj;
        }, {});

      // console.log(annotatedTextClusters);

      // Calculate completion for each cluster
      const clusterCompletion = Object.fromEntries(
        Object.keys(clusters).map((clusterIndex) =>
          clusterIndex in annotatedTextClusters
            ? [
                clusterIndex,
                Math.round(
                  (annotatedTextClusters[clusterIndex] /
                    clusters[clusterIndex]) *
                    100,
                  2
                ),
              ]
            : [clusterIndex, 0]
        )
      );

      res.json(clusterCompletion);
    } catch (err) {
      res.json({ message: err });
    }
  }
);

module.exports = router;
