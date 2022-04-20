const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const authUtils = require("../auth/utils");
const { createProject } = require("./services");

router.post("/create", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    logger.info("Creating project", { route: "/api/project/create" });
    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    const response = await createProject(req.body, userId);
    res.status(response.status).send(response.data);
  } catch (err) {
    res.json({ message: err });
    logger.error("Failed to create project", { route: "/api/project/create" });
  }
});

module.exports = router;
