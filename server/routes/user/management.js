const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const Project = require("../../models/Project");
const User = require("../../models/User");
const authUtils = require("../auth/utils");

router.get("/management/users", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Fetching list of users", {
      route: "/management/users",
    });

    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    const response = await User.find(
      { _id: { $ne: userId }, public: true },
      { _id: 1, public: 1, username: 1 }
    ).lean();
    res.json(response);
  } catch (err) {
    logger.error("Failed to fetch users");
    res.json({ message: err });
  }
});

router.post("/management/invite/:projectId", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Inviting annotators to project", {
      route: "/management/invite",
    });
    console.log(req.body);

    const userIds = req.body.user_ids;
    const projectId = req.params.projectId;
    const docDistributionMethod = req.body.doc_distribution_method;

    const textIds = await Project.findById(
      { _id: projectId },
      { texts: 1 }
    ).lean();

    // console.log(textIds);

    const distributeDocs = (textIds, noAnnotators, distributionMethod) => {
      switch (distributionMethod) {
        case "all":
          return textIds;
        default:
          res
            .status(500)
            .send("Failed to assign documents - please try again.");
      }
    };

    // Add users to project
    // Note: No accessId is created yet.
    // TODO: Implement
    const annotators = userIds.map((id) => ({
      user: id,
      accessId: "",
      role: "annotator",
      assignment: distributeDocs(
        textIds,
        userIds.length,
        docDistributionMethod
      ),
    }));

    const response = await Project.findByIdAndUpdate(
      { _id: projectId },
      {
        $push: {
          annotators: annotators,
        },
      },
      { upsert: true, new: true }
    )
      .populate({ path: "annotators.user", select: { _id: 1, username: 1 } })
      .lean();

    // Add project to user accounts
    const userProjectsUpdate = userIds.map((id) => ({
      updateOne: {
        filter: { _id: id },
        update: {
          $push: {
            projects: {
              project: projectId,
            },
          },
        },
      },
    }));

    await User.bulkWrite(userProjectsUpdate);

    res.json(response);
  } catch (err) {
    logger.error("Failed to invite annotators to project");
    res.json({ message: err });
  }
});

router.post("/management/user", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Modifying user state", { route: "/management/user" });

    const expectedKeys = ["action", "user_id", "project_id"];
    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("One or more required fields not supplied");
    } else {
      const action = req.body.action;
      const userId = req.body.user_id;
      const projectId = req.body.project_id;

      if (!["disable", "activate", "remove"].includes(action)) {
        res
          .status(400)
          .send(
            "Invalid action supplied - valid options (disable, activate, remove)"
          );
      }

      let response;
      switch (action) {
        case "disable":
          response = await Project.findOneAndUpdate(
            { _id: projectId, annotators: { $elemMatch: { user: userId } } },
            {
              $set: {
                "annotators.$.disabled": true,
              },
            },
            { upsert: true, new: true }
          )
            .populate({
              path: "annotators.user",
              select: { _id: 1, username: 1 },
            })
            .lean();

          break;
        case "activate":
          response = await Project.findOneAndUpdate(
            { _id: projectId, annotators: { $elemMatch: { user: userId } } },
            {
              $set: {
                "annotators.$.disabled": false,
              },
            },
            { upsert: true, new: true }
          )
            .populate({
              path: "annotators.user",
              select: { _id: 1, username: 1 },
            })
            .lean();
          break;
        case "remove":
          // Remove project from user.
          await User.findByIdAndUpdate(
            {
              _id: userId,
            },
            {
              $pull: { projects: { project: projectId } },
            }
          );
          // Remove user from project.
          response = await Project.findByIdAndUpdate(
            { _id: projectId },
            {
              $pull: { annotators: { user: userId } },
            },
            { new: true }
          )
            .populate({
              path: "annotators.user",
              select: { _id: 1, username: 1 },
            })
            .lean();
          break;
        default:
          res.status(500).send("Oops. Something went wrong.");
          break;
      }

      res.json(response);
    }
  } catch (err) {
    logger.error("Failed to modify user state");
    res.json({ message: err });
  }
});

router.post("/management/user/assign-docs", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Assigning documents to user", {
      route: "/management/user/assign-docs",
    });

    const expectedKeys = ["action", "user_id", "project_id"];
    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("One or more required fields not supplied");
    } else {
      // Do something
    }
  } catch (err) {
    logger.error("Failed to assign document");
    res.json({ message: err });
  }
});

module.exports = router;
