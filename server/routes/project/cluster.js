const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const dotenv = require("dotenv");
const authUtils = require("../auth/utils");
const User = require("../../models/User");
const Project = require("../../models/Project");
const Text = require("../../models/Text");
const mongoose = require("mongoose");

router.get(
  "/clusters/metrics/:projectId",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      const userId = authUtils.getUserIdFromToken(req.cookies.token);

      const aggQuery = [
        {
          $match: {
            projectId: mongoose.Types.ObjectId(req.params.projectId),
          },
        },
        {
          $project: {
            cluster: 1,
            saved: 1,
          },
        },
        {
          $addFields: {
            userSaved: {
              $eq: [
                {
                  $size: {
                    $filter: {
                      input: "$saved",
                      as: "saveStates",
                      cond: {
                        $eq: [
                          "$$saveStates.createdBy",
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
        {
          $group: {
            _id: "$cluster",
            saved: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$userSaved", true],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $addFields: {
            cluster: "$_id",
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
        {
          $sort: {
            saved: -1,
          },
        },
      ];

      const textAggregation = await Text.aggregate(aggQuery)
        .allowDiskUse(true)
        .exec();
      // Aggregation response from db is [{"cluser": #, "saved": #}]; transform into object {cluster: saved, etc.}
      // TODO: Figure out how to get mongodb to do this in the aggregation call.
      const response = Object.assign(
        {},
        ...textAggregation.map((e) => ({ [e.cluster]: e.saved }))
      );
      res.json(response);
    } catch (err) {
      res.json({ message: err });
    }
  }
);

module.exports = router;
