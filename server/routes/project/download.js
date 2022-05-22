const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const _ = require("lodash");
const authUtils = require("../auth/utils");
const Project = require("../../models/Project");
const Text = require("../../models/Text");

router.post("/download/result", authUtils.cookieJwtAuth, async (req, res) => {
  // Download IE results.
  // TODO: Allow user to specify NER/ET/POS; NER/POS will be CoNLL03 format
  // ET will be mention format.
  try {
    logger.info("Downloading project results", {
      route: "/api/project/download/result",
    });

    const annotationState = req.body.annotation_state;
    console.log("annotationState", annotationState);

    const includeWeakLabels = req.body.include_weak_labels;
    console.log("includeWeakLabels", includeWeakLabels);

    const filter = ["annotated", "unannotated"].includes(
      req.body.annotation_state
    ) && {
      annotated: req.body.annotation_state === "annotated",
    };

    let texts;
    if (req.body.preview) {
      // https://stackoverflow.com/questions/34198682/javascript-limit-number-of-items/34198785
      // TODO: review limit implementation
      texts = await Text.find({
        project_id: req.body.project_id,
        ...filter,
      })
        .limit(10)
        .lean();
    } else {
      texts = await Text.find({
        project_id: req.body.project_id,
        ...filter,
      }).lean();
    }

    const count = await Text.count({
      project_id: req.body.project_id,
      ...filter,
    });
    console.log("text count", count);

    const results = texts.map((text) => ({
      doc_id: text._id,
      doc: text.tokens.map((token) => token.value),
      mentions: [
        ...text.markup.map((span) => ({
          start: span.start,
          end: span.end,
          labels: span.labels,
          type: "silver",
        })),
        ...(includeWeakLabels
          ? text.suggested_markup.map((span) => ({
              start: span.start,
              end: span.end,
              labels: span.labels,
              type: "weak",
            }))
          : []),
      ].sort((a, b) => a.start - b.start), // Ensures that markup is ordered,
      annotated: text.annotated,
    }));

    res.json({ results: results, count: count });
  } catch (err) {
    logger.error("Failed to download project results", {
      route: "/api/project/download/result",
    });
    res.status(500).send({ detail: "Failed to download" });
  }
});

router.post(
  "/download/labels/:labelName",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    try {
      const labelName = req.params.labelName.toLowerCase();
      logger.info(`Downloading results for ${labelName}`, {
        route: "/api/project/download/labels",
      });

      // Get project label details
      // TOOD: Make this based on index rather than name...
      const project = await Project.findById({
        _id: req.body.project_id,
      }).lean();
      const label = project.labels.filter(
        (label) => label.name.toLowerCase() === labelName
      )[0];

      const filter = ["annotated", "unannotated"].includes(
        req.body.annotation_state
      ) && {
        annotated: req.body.annotation_state === "annotated",
      };

      // Note: Preview limiting here will change the output of the preview from
      // the real results... However if the results are limited after processing,
      // for huge datasets this will be slow.
      // https://stackoverflow.com/questions/34198682/javascript-limit-number-of-items/34198785
      // TODO: review limit implementation
      let texts;
      if (req.body.preview) {
        texts = await Text.find({
          project_id: req.body.project_id,
          ...filter,
        })
          .limit(10)
          .lean();
      } else {
        texts = await Text.find({
          project_id: req.body.project_id,
          ...filter,
        }).lean();
      }

      const includeWeakLabels = req.body.include_weak_labels;
      console.log("includeWeakLabels", includeWeakLabels);

      try {
        const spanTextUnits = texts
          .flatMap((text) => {
            const tokens = text.original.split(" ");

            // Filter spans for those that have the specified label
            const spans = [
              ...text.markup,
              ...(includeWeakLabels ? text.suggested_markup : []),
            ].filter((span) =>
              span.labels
                .map((label) => label.toLowerCase())
                .includes(labelName)
            );

            console.log(spans);

            // Match spans on tokens and create text units
            const textUnit = spans.map((span) =>
              tokens.slice(span.start, span.end + 1).join(" ")
            ); // End is NOT included hence need for + 1
            return textUnit;
          })
          .flat();

        // Return frequency of matched text units
        const spanTextUnitFreqs = _.countBy(
          spanTextUnits.map((entry) => entry)
        );
        console.log(spanTextUnitFreqs);

        res.json(spanTextUnitFreqs);
      } catch (err) {
        res
          .status(400)
          .send("Error occurred while searching spans for your label");
      }
    } catch (err) {
      res.json({ message: err });
      logger.error(`Failed to download ${req.body.mapName} mapping`, {
        route: "/api/map/download",
      });
    }
  }
);

router.post(
  "/download/cluster/results",
  authUtils.cookieJwtAuth,
  async (req, res) => {
    // Returns annotations for a specific cluster; NOTE: weak and silver labels are returned.
    try {
      const texts = await Text.find({
        project_id: req.body.project_id,
        cluster: req.body.cluster,
      }).lean();

      const payload = texts.map((text) => ({
        doc_id: text._id,
        doc: text.tokens.map((token) => token.value),
        mentions: [
          ...text.markup.map((span) => ({
            start: span.start,
            end: span.end,
            labels: span.labels,
            type: "silver",
          })),
          text.suggested_markup.map((span) => ({
            start: span.start,
            end: span.end,
            labels: span.labels,
            type: "weak",
          })),
        ].sort((a, b) => a.start - b.start), // Ensures that markup is ordered,
        annotated: text.annotated,
      }));

      res.json(payload);
    } catch (err) {
      res.json({ message: err });
    }
  }
);

module.exports = router;
