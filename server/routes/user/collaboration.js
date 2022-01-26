const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const Project = require("../../models/Project");
const User = require("../../models/User");
const authUtils = require("../auth/utils");

router.get("/invitations", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Fetching user invitations", {
      route: "/api/user/invitations",
    });

    const userId = authUtils.getUserIdFromToken(req.cookies.token);

    const response = await User.findOne(
      {
        _id: userId,
      },
      { projects: 1, _id: 0 }
    )
      .populate({ path: "projects.project", select: { name: 1 } })
      .lean();

    //   TODO: do this step in the database call
    const projects = response.projects.filter((project) => !project.accepted);
    if (projects === null) {
      res.json({ projects: [] });
    } else {
      res.json(projects);
    }
  } catch (err) {
    logger.error("Failed to fetch invitations");
    res.json({ message: err });
  }
});

router.patch("/invitation/accept", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    const projectId = req.body.project_id;

    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    // Update user and project with accept state

    console.log(projectId, userId);

    const userResponse = await User.findOneAndUpdate(
      {
        _id: userId,
        projects: {
          $elemMatch: {
            project: projectId,
          },
        },
      },
      {
        $set: {
          "projects.$.accepted": true,
        },
      },
      { upsert: true, new: true }
    );

    console.log("user", userResponse);

    const projectResponse = await Project.findOneAndUpdate(
      { _id: projectId, annotators: { $elemMatch: { user: userId } } },
      {
        $set: {
          "annotators.$.state": "accepted",
        },
      },
      { upsert: true, new: true }
    )
      .populate({ path: "annotators.user", select: { _id: 1, username: 1 } })
      .lean();

    res.json({
      user_response: userResponse,
      project_response: projectResponse,
    });
  } catch (err) {
    logger.error("Failed to accept invitation");
    res.json({ message: err });
  }
});

router.patch("/invitation/decline", authUtils.cookieJwtAuth, async (req, res) => {
  // Decline invitation
  try {
    logger.info("User declined invitation", { route: "/invitation/decline" });
    const projectId = req.body.project_id;

    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    // remove project from users invitations and set project annotator state as declined

    console.log(projectId, userId);

    const userResponse = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $pull: {
          projects: { project: projectId },
        },
      },
      { new: true }
    );

    console.log("user", userResponse);

    const projectResponse = await Project.findOneAndUpdate(
      { _id: projectId, annotators: { $elemMatch: { user: userId } } },
      {
        $set: {
          "annotators.$.state": "declined",
        },
      },
      { upsert: true, new: true }
    )
      .populate({ path: "annotators.user", select: { _id: 1, username: 1 } })
      .lean();

    res.json({
      user_response: userResponse,
      project_response: projectResponse,
    });
  } catch (err) {
    logger.error("Failed to accept invitation");
    res.json({ message: err });
  }
});

router.get("/meta/annotator/colours/:projectId", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Fetching annotator meta-data");

    const project = await Project.findById(
      { _id: req.params.projectId },
      { annotators: 1 }
    ).lean();
    // console.log(project);
    const annotatorIds = project.annotators.map((a) => a.user); // user is User._id
    // console.log(annotatorIds);

    const annotatorColours = await User.find(
      { _id: { $in: annotatorIds } },
      { _id: 1, colour: 1, username: 1 }
    ).lean();
    // console.log('annotatorColours', annotatorColours);

    res.json(annotatorColours);
  } catch (err) {
    logger.error("Failed to fetch annotator meta-data");
    res.json({ message: err });
  }
});

module.exports = router;
