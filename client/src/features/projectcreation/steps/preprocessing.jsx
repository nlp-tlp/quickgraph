/* 
  Add option to split plurals; e.g. Tyler's car -> Tyler 's car. This enables open RE to use 's as the relation.
*/

import { useEffect, useState } from "react";
import { Card, Col, Form, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  IoDocuments,
  IoArrowForward,
  IoArrowDown,
  IoArrowUp,
} from "react-icons/io5";
import {
  selectCorpus,
  selectPreprocessingActions,
  setStepData,
} from "../createStepSlice";
import "../Create.css";

export const Preprocessing = () => {
  const dispatch = useDispatch();
  const actions = useSelector(selectPreprocessingActions);
  const corpus = useSelector(selectCorpus);
  const [originalCorpusDetails, setOriginalCorpusDetails] = useState({});
  const [previewContent, setPreviewContent] = useState(
    "Upload texts to preview"
  );
  const [corpusDetails, setCorpusDetails] = useState({});

  useEffect(() => {
    // Update preview data whenever a text file is uploaded and the pre-processing
    // actions are changed
    if (Object.keys(originalCorpusDetails).length === 0) {
      // Add original corpus details for user
      // Remove multiple white space and trim
      const originalCorpus = corpus.map((text) =>
        text.replace(/\s+/g, " ").trim()
      );
      setOriginalCorpusDetails({
        corpusSize: originalCorpus.length,
        vocabSize: new Set(originalCorpus.map((text) => text.split(" ")).flat())
          .size,
        tokenSize: originalCorpus.map((text) => text.split(" ")).flat().length,
      });
    }

    if (corpus) {
      // Remove multiple white space and trim
      let preCorpus = corpus.map((text) => text.replace(/\s+/g, " ").trim());

      if (actions.lowercase) {
        preCorpus = preCorpus.map((text) => text.toLowerCase());
      }
      if (actions.removeDuplicates) {
        preCorpus = [...new Set(preCorpus)];
      }
      if (actions.removeChars) {
        const escapedChars = [
          "[",
          "]",
          "{",
          "}",
          "(",
          ")",
          "*",
          "+",
          "?",
          "|",
          "^",
          "$",
          ".",
          "\\",
        ];

        const regexCharsEscaped = actions.removeCharSet
          .split("")
          .map((char) => (escapedChars.includes(char) ? `\\${char}` : char));
        const regex = new RegExp("[" + regexCharsEscaped + "]", "g");
        preCorpus = preCorpus.map((text) => text.replace(regex, " "));
        // Remove multiple white space and trim
        preCorpus = preCorpus.map((text) => text.replace(/\s+/g, " ").trim());
      }

      // Add data uploaded to preview content
      setPreviewContent(preCorpus.slice(0, 1000).join("\n"));

      setCorpusDetails({
        corpusSize: preCorpus.length,
        vocabSize: new Set(preCorpus.map((text) => text.split(" ")).flat())
          .size,
        tokenSize: preCorpus.map((text) => text.split(" ")).flat().length,
      });
    }
  }, [corpus, actions]);

  useEffect(() => {
    if (corpus && corpus[0] === "") {
      // console.log("erased corpus paste bin");
      // Reset preview content
      setPreviewContent("Upload texts to preview");
    }
  }, [corpus]);

  return (
    <Form.Group as={Row} style={{ margin: "0rem 0.25rem 0rem 0.25rem" }}>
      <Col sm={12} md={3}>
        <Card>
          <Card.Header id="section-subtitle">Actions</Card.Header>
          <Card.Body>
            <Form.Check
              id="check-lowercase"
              type="checkbox"
              label="Lower case"
              name="lowerCaseCheck"
              title="Removes casing from characters. This can reduce annotation effort."
              style={{ fontSize: "14px", marginBottom: "0.5rem" }}
              checked={actions.lowercase}
              onChange={(e) => {
                dispatch(setStepData({ lowercase: e.target.checked }));
              }}
            />
            <Form.Check
              id="check-remove-chars"
              type="checkbox"
              label="Remove characters"
              name="removeCharactersCheck"
              title="Removes special characters from corpus. This can reduce annotation effort."
              style={{ fontSize: "14px", marginBottom: "0.5rem" }}
              checked={actions.removeChars}
              onChange={(e) => {
                dispatch(setStepData({ removeChars: e.target.checked }));
              }}
            />
            <Form.Control
              type="text"
              disabled={!actions.removeChars}
              placeholder={actions.removeCharSet}
              name="charsRemove"
              value={actions.removeCharSet}
              onChange={(e) => {
                dispatch(setStepData({ removeCharSet: e.target.value }));
              }}
              autoComplete="off"
              style={{ fontSize: "14px", marginBottom: "0.5rem" }}
            />
            <Form.Check
              id="check-remove-duplicates"
              type="checkbox"
              label="Remove duplicates"
              title="Removes duplicate documents from your corpus. This can reduce annotation effort."
              name="removeDuplicatesCheck"
              style={{ fontSize: "14px", marginBottom: "0.5rem" }}
              checked={actions.removeDuplicates}
              onChange={(e) => {
                dispatch(setStepData({ removeDuplicates: e.target.checked }));
              }}
            />
          </Card.Body>
        </Card>
        <Card style={{ marginTop: "1rem" }}>
          <Card.Header id="section-subtitle">Corpus Statistics</Card.Header>
          <Card.Body>
            <div>
              {Object.keys(corpusDetails).map((key) => {
                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <p
                      id="section-subtitle"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        textTransform: "capitalize",
                      }}
                    >
                      <IoDocuments style={{ marginRight: "0.25rem" }} />
                      {key.replace("Size", "")} Size
                    </p>
                    {actions.lowercase ||
                    actions.removeDuplicates ||
                    actions.removeChars ? (
                      <div
                        style={{
                          margin: "0.5rem 0rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-evenly",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: "#90a4ae" }}>
                          {originalCorpusDetails[key].toLocaleString()}
                        </span>
                        <IoArrowForward style={{ margin: "0rem 0.25rem" }} />
                        <span style={{}}>
                          {corpusDetails[key].toLocaleString()}
                        </span>
                        {/* This operator doesnt seem to avoid showing up/down when original equals processed... TODO */}
                        {originalCorpusDetails[key] !== corpusDetails[key] && (
                          <span
                            style={{
                              marginLeft: "0.5rem",
                              fontSize: "0.75rem",
                              color:
                                originalCorpusDetails[key] > corpusDetails[key]
                                  ? "#2e7d32"
                                  : "#c62828",
                            }}
                          >
                            {originalCorpusDetails[key] > corpusDetails[key] ? (
                              <IoArrowDown />
                            ) : (
                              <IoArrowUp />
                            )}
                            {Math.round(
                              Math.abs(
                                ((originalCorpusDetails[key] -
                                  corpusDetails[key]) *
                                  100) /
                                  originalCorpusDetails[key]
                              )
                            )}
                            %
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{}}>{corpusDetails[key]}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col sm={12} md={9}>
        <Card>
          <Card.Header id="section-subtitle">Preview</Card.Header>
          <Card.Body
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div className="preview-container" style={{ width: "100%" }}>
              <pre>{previewContent}</pre>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Form.Group>
  );
};
