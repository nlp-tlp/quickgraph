import "./Token.css";
import { useDispatch, useSelector } from "react-redux";
import { Spans } from "../spans/spans";
import { OpenSpans } from "../spans/openspans";
import {
  selectSelectMode,
  selectAnnotationMode,
  setSelectedTokens,
  setSelectMode,
  applyAnnotation,
  selectSourceSpan,
  selectTargetSpan,
  selectEntities,
  selectTexts,
} from "../../../app/dataSlice";
import { hasMarkup, markupPosition } from "../utils";
import { selectProject } from "../projectSlice";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Button } from "@mui/material";

export const Token = ({ tokenId, textId, tokenIndex }) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const selectMode = useSelector(selectSelectMode);
  const annotationMode = useSelector(selectAnnotationMode);
  const allowSelect =
    annotationMode === "entity" ||
    project.tasks.relationAnnotationType === "open";
  const sourceSpan = useSelector(selectSourceSpan);
  const targetSpan = useSelector(selectTargetSpan);
  const texts = useSelector(selectTexts);
  const entities = useSelector(selectEntities);

  const token = texts[textId].tokens[tokenId];

  const handleMouseOver = () => {
    if (allowSelect) {
      dispatch(setSelectedTokens(token));
    }
  };

  const handleMouseDown = () => {
    if (allowSelect) {
      dispatch(setSelectMode(true));
      dispatch(setSelectedTokens(token));
    }
  };

  const handleMouseUp = () => {
    if (allowSelect) {
      dispatch(setSelectedTokens(token));
      dispatch(setSelectMode(false));
    }
  };

  const handleApplySingleOpenRelation = () => {
    const relationTokens = Object.values(texts[textId].tokens).filter((t) =>
      selectMode.tokenIds.includes(t._id.toString())
    );
    const relationText = relationTokens.map((t) => t.value).join(" ");
    const relationLabelStartIndex = relationTokens[0].index;
    const relationLabelEndIndex =
      relationTokens[relationTokens.length - 1].index;

    dispatch(
      applyAnnotation({
        textId: textId,
        projectId: project._id,
        applyAll: false,
        suggested: false,
        annotationType: "openRelation",
        sourceEntityId: sourceSpan._id,
        targetEntityId: targetSpan._id,
        relationStart: relationLabelStartIndex,
        relationEnd: relationLabelEndIndex,
        relationText: relationText,
        textIds: Object.keys(texts),
      })
    );
  };

  const showPopOver =
    sourceSpan &&
    targetSpan &&
    textId === sourceSpan.textId &&
    allowSelect &&
    selectMode &&
    selectMode.tokenIds[selectMode.tokenIds.length - 1] === token._id;

  return (
    <div
      key={tokenIndex}
      id="token-container"
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <OverlayTrigger
        trigger="click"
        placement="top"
        show={showPopOver}
        overlay={
          <Tooltip className="open-relation-tooltip">
            <Button size="small" color="error">
              Remove
            </Button>
            <Button size="small" onClick={handleApplySingleOpenRelation}>
              Add
            </Button>
          </Tooltip>
        }
        rootClose
      >
        <span
          id="token"
          style={{
            opacity: token.state && token.state === "unrelated" && "0.25",
          }}
          currentlyselected={
            allowSelect && selectMode && selectMode.tokenIds.includes(token._id)
              ? "true"
              : "false"
          }
          annotated={hasMarkup(entities[textId], tokenIndex)}
          pos={markupPosition(entities[textId], tokenIndex)}
          onMouseOver={handleMouseOver}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {token.value}
        </span>
      </OverlayTrigger>

      {project.tasks.relationAnnotationType === "open" ? (
        <OpenSpans text={texts[textId]} token={token} tokenIndex={tokenIndex} />
      ) : (
        <Spans text={texts[textId]} token={token} tokenIndex={tokenIndex} />
      )}
    </div>
  );
};
