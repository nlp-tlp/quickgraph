const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const authUtils = require("../auth/utils");

const {
  filterTexts,
  applySingleAnnotation,
  applyAllAnnotations,
  acceptSingleAnnotation,
  acceptAllAnnotations,
  deleteSingleAnnotation,
  deleteAllAnnotations,
  saveSingleText,
  saveManyTexts,
} = require("./services");

router.post("/filter", authUtils.cookieJwtAuth, async (req, res) => {
  try {
    const expectedKeys = ["projectId", "getPages", "filters"];
    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("One or more required fields not supplied");
    } else {
      const userId = authUtils.getUserIdFromToken(req.cookies.token);
      let { page, limit } = req.query;
      limit = parseInt(limit);
      const skip = parseInt((page - 1) * limit); // eqv. to page
      response = await filterTexts(req.body, skip, limit, userId);
      res.status(response.status).send(response.data);
    }
  } catch (err) {
    logger.error("Failed to get text pagination results", {
      route: `/api/text/filter/${req.body.projectId}`,
    });
    res.status(500).send({
      detail: "Server error - failed to fetch text(s). Please try again.",
    });
  }
});

router.post("/annotation/apply", authUtils.cookieJwtAuth, async (req, res) => {
  /* 
  End point for apply markup to an entiy span or relation
*/
  try {
    const expectedKeys = [
      "textId",
      "projectId",
      "applyAll",
      "suggested",
      "annotationType",
    ];

    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("One or more required fields not supplied");
    } else {
      const userId = authUtils.getUserIdFromToken(req.cookies.token);
      let response;
      switch (req.body.applyAll) {
        case true:
          logger.info("Applying annotation to all");
          response = await applyAllAnnotations(req.body, userId);
          res.status(response.status).send(response.data);
          break;
        case false:
          logger.info("Applying single annotation");
          response = await applySingleAnnotation(req.body, userId);
          res.status(response.status).send(response.data);
          break;
        default:
          res.status(400).send("Invalid value supplied for applyAll");
      }
    }
  } catch (err) {
    res.status(500).send({
      detail: "Server error - unable to apply annotation(s). Please try again.",
    });
  }
});

router.patch(
  "/annotation/accept",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      const expectedKeys = [
        "projectId",
        "textId",
        "applyAll",
        "suggested",
        "annotationType",
      ];

      if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
        res.status(400).send("One or more required fields not supplied");
      } else {
        switch (req.body.applyAll) {
          case true:
            response = await acceptAllAnnotations(req.body);
            res.status(response.status).send(response.data);
            break;
          case false:
            response = await acceptSingleAnnotation(req.body);
            res.status(response.status).send(response.data);
            break;
          default:
            res.status(500).send("Something went wrong :(");
            break;
        }
      }
    } catch (err) {
      logger.error("Failed to accept annotation(s)");
      res.status(500).send({
        detail:
          "Server error - unable to accept annotation(s). Please try again.",
      });
    }
  }
);

router.patch(
  "/annotation/delete",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    /* 
      Endpoint for deleting entity spans; also removes (breaks) any relations that are attached
      to the entity.
    */
    try {
      const expectedKeys = [
        "projectId",
        "textId",
        "applyAll",
        "suggested",
        "annotationType",
      ];

      if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
        res.status(400).send("One or more required fields not supplied");
      } else {
        const userId = authUtils.getUserIdFromToken(req.cookies.token);

        switch (req.body.applyAll) {
          case true:
            response = await deleteAllAnnotations(req.body, userId);
            res.status(response.status).send(response.data);
            break;
          case false:
            response = await deleteSingleAnnotation(req.body);
            res.status(response.status).send(response.data);
            break;
          default:
            res.status(500).send("Something went wrong :(");
            break;
        }
      }
    } catch (err) {
      logger.error("Failed to delete annotations");
      res.status(500).send({
        detail:
          "Server error - unable to delete annotation(s). Please try again.",
      });
    }
  }
);

router.patch("/annotation/save", authUtils.cookieJwtAuth, async (req, res) => {
  // Updates the annotation state of a single, or set of, text(s).
  // Calculates tiered IAA at save time.
  try {
    logger.info("Saving annotation states on a single text", {
      route: "/api/text/annotation/save",
    });
    const expectedKeys = ["textIds"];

    if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
      res.status(400).send("textIds not supplied - please try again.");
    } else {
      const userId = authUtils.getUserIdFromToken(req.cookies.token);
      switch (req.body.textIds.length > 1) {
        case true:
          logger.info("Updating save state of multiple documents");
          response = await saveManyTexts(req.body, userId);
          res.status(response.status).send(response.data);
          break;
        case false:
          logger.info("Updating save state of a single document");
          response = await saveSingleText(req.body, userId);
          res.status(response.status).send(response.data);
          break;
        default:
          res
            .status(500)
            .send("Something went wrong 😞 - Give it another crack!");
          break;
      }
    }
  } catch (err) {
    logger.error("Failed to save text(s)");
    res.status(500).send({
      detail: "Server error - failed to save text(s). Please try again.",
    });
  }
});

module.exports = router;
