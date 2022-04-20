const express = require("express");
const router = express.Router();
const authUtils = require("../auth/utils");
const { getGraphData } = require("./services");

router.post("/graph/:projectId", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    const userId = authUtils.getUserIdFromToken(req.cookies.token);
    const response = await getGraphData(
      req.body,
      req.query,
      req.params.projectId,
      userId
    );
    res.status(response.status).send(response.data);
  } catch (err) {
    res.json({ message: err });
  }
});

module.exports = router;
