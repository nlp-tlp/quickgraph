import "../Create.css";
import { useState, useEffect } from "react";
import {
  Card,
  Col,
  OverlayTrigger,
  Popover,
  Row,
  Spinner,
  Alert,
} from "react-bootstrap";
import { IoInformationCircleSharp } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveStep,
  selectCorpus,
  selectSteps,
  setStepData,
  setStepValid,
} from "../createStepSlice";
import { setAlertContent, setAlertActive } from "../../alerts/alertSlice";

const information = {
  raw_text: {
    title: "Corpus",
    content: "Corpus of newline separated texts.",
    format: ".txt\nhelo world\nhello there\n...",
  },
};

export const Upload = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);
  const corpus = useSelector(selectCorpus);
  const [loading, setLoading] = useState(false);

  const readFile = (fileMeta) => {
    let reader = new FileReader();
    reader.readAsText(fileMeta);
    reader.onload = () => {
      const fileExt = fileMeta.name.split(".").slice(-1)[0];

      if (fileExt === "txt") {
        dispatch(
          setStepData({
            corpus: reader.result.split("\n").filter((line) => line !== ""),
            corpusFileName: fileMeta.name,
          })
        );
        setLoading(false);
      } else {
        console.log("incorrect format");
        setLoading(false);
        dispatch(
          setAlertContent({
            title: "Oops",
            body: "Incorrect file format. Please upload a corpus in .txt. format",
            level: 'danger'
          })
        );
        dispatch(setAlertActive(true));
      }
    };
    reader.onloadend = () => {
      reader = new FileReader();
    };
  };

  useEffect(() => {
    if (corpus && corpus === "") {
      // console.log("erased corpus paste bin");

      // Reset corpus and remove file meta data if user erases all contents of corpus paste bin
      dispatch(
        setStepData({
          corpus: [],
          corpusFileName: null,
        })
      );
    }
  }, [corpus]);

  useEffect(() => {
    const valid = steps[activeStep].valid;

    if (!valid && corpus.length !== 0 && corpus[0] !== "") {
      dispatch(setStepValid(true));
    }
    if (valid && (corpus.length < 1 || corpus[0] === "")) {
      dispatch(setStepValid(false));
    }
  }, [steps]);

  const infoPopover = (content, format) => {
    return (
      <Popover id="popover-info">
        <Popover.Title>Information</Popover.Title>
        <Popover.Content>
          <p>{content}</p>
          <code style={{ whiteSpace: "pre-wrap" }}>{format}</code>
        </Popover.Content>
      </Popover>
    );
  };

  const infoOverlay = (info) => {
    return (
      <OverlayTrigger
        trigger="click"
        placement="right"
        overlay={infoPopover(info.content, info.format)}
        rootClose
      >
        <IoInformationCircleSharp
          // id="info-label"
          style={{ marginRight: "0.25rem", cursor: "pointer" }}
        />
      </OverlayTrigger>
    );
  };

  return (
    <Row>
      <Col>
        <Card style={{ display: "flex" }}>
          <Card.Header id="section-subtitle">
            <div style={{ display: "flex", alignItems: "center" }}>
              {infoOverlay(information["raw_text"])}
              <p style={{ margin: "0", padding: "0" }}>
                Corpus ({corpus.length})
              </p>
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col
                style={{
                  display: "flex",
                  justifyContent: "right",
                }}
              >
                <div style={{ display: "flex", justifyContent: "right" }}>
                  <label id="upload-btn" style={{ alignItems: "center" }}>
                    {loading && (
                      <Spinner
                        animation="border"
                        size="sm"
                        style={{ marginRight: "0.25rem" }}
                      />
                    )}
                    <input
                      id="corpus"
                      type="file"
                      onChange={(e) => readFile(e.target.files[0])}
                    />
                    {steps[activeStep].data.corpusFileName === null
                      ? "Upload File (.txt)"
                      : steps[activeStep].data.corpusFileName}
                  </label>
                </div>
              </Col>
            </Row>
            <Row>
              <Col>
                <textarea
                  className="preview-container-editable"
                  placeholder="Paste or upload corpus (.txt format)"
                  onChange={(e) =>
                    dispatch(
                      setStepData({
                        corpus: e.target.value.split("\n"),
                        corpusFileName: null,
                      })
                    )
                  }
                  value={corpus && corpus.join("\n")}
                  key="corpus-input"
                  wrap="off"
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};
