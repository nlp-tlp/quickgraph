const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const User = require("../../models/User");
const authUtils = require("../auth/utils");

router.get("/profile", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    const response = await User.findById(
      { _id: userId },
      { username: 1, email: 1, public: 1, _id: 1, updatedAt: 1, colour: 1 }
    ).lean();
    res.json(response);
  } catch (err) {
    logger.error("Failed to fetch user profile");
    res.json({ message: err });
  }
});

router.post("/validation/exists", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("validating whether field exists", {
      route: "/validation/exists",
    });

    const expectedKeys = ["field", "value"];
    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("One or more required fields not supplied");
    } else {
      const field = req.body.field;
      const value = req.body.value;
      const userId = authUtils.getUserIdFromToken(req.cookies.token);

      const userDetails = await User.findById({ _id: userId }).lean();

      let isValid;
      switch (field) {
        case "username":
          isValid =
            (await User.findOne({ username: value })) === null ||
            value === userDetails.username;
          break;
        case "email":
          isValid =
            (await User.findOne({ email: value })) === null ||
            value === userDetails.email;
          break;
        default:
          res.status(400).send("Invalid field supplied");
          break;
      }

      res.json({ valid: isValid });
    }
  } catch (err) {
    logger.error("Failed to check existence of supplied field");
    res.json({ message: err });
  }
});

router.patch("/profile", authUtils.cookieJwtAuth, async (req, res) => {
  // TODO: Enable user to reset password
  try {
    logger.info("Updating user profile");

    const expectedKeys = ["username", "email", "public", "colour"];
    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("One or more required fields not supplied");
    } else {
      const userId = authUtils.getUserIdFromToken(req.cookies.token);

      const response = await User.findByIdAndUpdate(
        { _id: userId },
        {
          username: req.body.username,
          email: req.body.email,
          public: req.body.public,
          colour: req.body.colour,
        },
        {
          fields: { password: 0, projects: 0, createdAt: 0, __v: 0 },
          upsert: true,
          new: true,
        }
      ).lean();
      res.json(response);
    }
  } catch (err) {
    logger.error("Failed to update user profile");
    res.json({ message: err });
  }
});

module.exports = router;
