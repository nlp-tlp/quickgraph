const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const authUtils = require("../auth/utils");
const Project = require("../../models/Project");

const {
  getDashboardOverview,
  getDashboardOverviewPlot,
  getDashboardAdjudication,
  getAnnotatorEffort,
  getAnnotationDownload,
} = require("./services");

router.get(
  "/dashboard/overview/:projectId",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      logger.info("Fetching dashboard overview information", {
        route: "/dashboard/overview",
      });
      const response = await getDashboardOverview(req.params.projectId);
      res.status(response.status).send(response.data);
    } catch (err) {
      logger.error("Error fetching dashboard overview information");
      res.json({ message: err });
    }
  }
);

router.post(
  "/dashboard/overview/plot/:projectId",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    /**
     * Returns all (including not save) data for entities, relations and triples.
     */
    try {
      logger.info("Fetching plot data", {
        route: "/dashboard/overview/plot/:projectId",
      });

      if (!req.body.type) {
        res
          .status(400)
          .send(
            "Distribution type not supplied or incorrect. Please try again with either 'entity' or 'relation'."
          );
      } else {
        const response = await getDashboardOverviewPlot(
          req.body,
          req.params.projectId
        );
        res.status(response.status).send(response.data);
      }
    } catch (err) {
      res.json({ message: err });
    }
  }
);

router.post(
  "/dashboard/adjudication",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      logger.info("Fetching data for adjudication page", {
        route: "/dashboard/adjudication",
      });

      const expectedKeys = ["projectId", "filters"];

      if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
        res.status(400).send("One or more required fields not supplied");
      } else {
        // Check if user is on project
        const userId = authUtils.getUserIdFromToken(req.cookies.token);
        const userAuthed = await Project.exists({
          _id: req.body.projectId,
          "annotators.user": userId,
        });
        if (!userAuthed) {
          res.status(401).send({ message: "Not authorized" });
        } else {
          const skip = parseInt((req.query.page - 1) * req.query.limit);
          const limit = parseInt(req.query.limit);
          const sort = parseInt(req.query.sort);

          const response = await getDashboardAdjudication(
            req.body,
            limit,
            skip,
            sort
          );
          res.status(response.status).send(response.data);
        }
      }
    } catch (err) {
      logger.error("Failed to fetch adjudication data");
      res.status(500).send({ message: "Failed to fetch adjudication data" });
    }
  }
);

router.post(
  "/dashboard/effort/:projectId",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      logger.info("Fetching annotator effort overview", {
        route: "/api/project/dashboard/download",
      });
      const response = await getAnnotatorEffort(req.body, req.params.projectId);
      res.status(response.status).send(response.data);
    } catch (err) {
      logger.error("Failed to get dashboard download overview");
      res.json({ message: err });
    }
  }
);

router.post(
  "/dashboard/download",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      logger.info("Fetching download", {
        route: "/api/project/dashboard/download",
      });
      const expectedKeys = ["projectId", "filters"];

      if (!authUtils.checkBodyValid(req.body, expectedKeys)) {
        res
          .status(400)
          .send({ message: "One or more required fields not supplied" });
      } else {
        const response = await getAnnotationDownload(req.body);
        res.status(response.status).send(response.data);
      }
    } catch (err) {
      logger.error("Failed to download results");
      res.status(500).send({ detail: "Failed to download annotations" });
    }
  }
);

module.exports = router;
