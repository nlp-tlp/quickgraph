const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const dotenv = require("dotenv");
const User = require("../../models/User");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const authUtils = require("./utils");
dotenv.config();

const generateJWT = (user_id) => {
  return jwt.sign({ user_id: user_id }, process.env.TOKEN_SECRET, {
    expiresIn: "72h",
  });
};

// Create user
router.post("/signup", async (req, res) => {
  // Expects body of username, email and password
  logger.info("Signing up user", { route: "/signup" });
  try {
    const { username, password, email } = req.body;
    const userExists = await User.exists({ username: username });

    if (userExists) {
      res.status(409).send({ message: "User already exists" });
      logger.error("User already exists", { route: "/signup" });
    } else {
      logger.info("Creating new user", { route: "/signup" });
      const salt = bcrypt.genSaltSync(saltRounds);
      const hash = bcrypt.hashSync(password, salt);

      const newUser = new User({
        username: username,
        email: email,
        password: hash,
      });

      const savedUser = await newUser.save();
      res.cookie("token", generateJWT(savedUser._id));
      res.json({
        username: newUser.username,
        _id: newUser._id,
        colour: newUser.colour,
      });
      logger.info("User created successfully", { route: "/signup" });
    }
  } catch (err) {
    res.json({ message: err });
  }
});

router.post("/login", async (req, res) => {
  logger.info("Logging in user", { route: "/login" });
  try {
    const { username, password } = req.body;
    const userExists = await User.exists({ username: username });

    if (!userExists) {
      res.status(404).send({ message: "User does not exist" });
      logger.error("User does not exist", { route: "/login" });
    } else {
      const user = await User.findOne({ username: username })
        .populate({ path: "projects.project", select: { name: 1 } })
        .lean();
      const invitations = user.projects.filter((project) => !project.accepted);

      if (bcrypt.compareSync(password, user.password)) {
        delete user.password;
        res.cookie("token", generateJWT(user._id), { httpOnly: true });
        res.json({
          username: user.username,
          _id: user._id,
          colour: user.colour,
          invitations: invitations,
        });
        logger.info("Login successful", { route: "/login" });
      } else {
        res.status(409).send({ message: "Password incorrect" });
        logger.warn("Incorrect password", { route: "/login" });
      }
    }
  } catch (err) {
    res.json({ message: err });
  }
});

router.post("/logout", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Logging user out", { route: "/api/auth/logout" });
    res.clearCookie("token", { path: "/" });
    res.json({ message: "Logged out succesfully" });
  } catch (err) {
    logger.error("Failed to log user out");
    res
      .status(500)
      .send("Our server experienced an issue 😞 - please try again!");
  }
});

module.exports = router;
