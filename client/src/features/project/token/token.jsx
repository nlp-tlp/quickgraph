import "./Token.css";
import { useRef } from "react";
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
} from "../../../app/dataSlice";
import { hasMarkup, markupPosition } from "../utils"; // project/utils
import { selectProject } from "../projectSlice";
import { OverlayTrigger, Tooltip, Button } from "react-bootstrap";

export const Token = ({ text, textIndex, token, tokenIndex }) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const selectMode = useSelector(selectSelectMode);
  const annotationMode = useSelector(selectAnnotationMode);
  const allowSelect =
    annotationMode === "concept" ||
    project.tasks.relationAnnotationType === "open";
  const sourceSpan = useSelector(selectSourceSpan);
  const targetSpan = useSelector(selectTargetSpan);
  const ref = useRef(null);

  const handleMouseOver = () => {
    if (allowSelect) {
      // console.log("selecting token", token._id);
      dispatch(setSelectedTokens(token._id));
    }
  };

  const handleMouseDown = () => {
    if (allowSelect) {
      dispatch(setSelectMode({ active: true, textId: text._id }));
      dispatch(setSelectedTokens(token._id));
    }
  };

  const handleMouseUp = () => {
    if (allowSelect) {
      dispatch(setSelectMode({ active: false, textId: text._id }));
    }
  };

  const handleApplySingleOpenRelation = () => {
    const relationTokens = text.tokens.filter((t) =>
      selectMode.tokenIds.includes(t._id.toString())
    );

    const relationLabel = relationTokens.map((t) => t.value).join(" ");
    const relationLabelStartIndex = relationTokens[0].index;
    const relationLabelEndIndex =
      relationTokens[relationTokens.length - 1].index;

    // Get ID of tokens on target span
    const targetTokenIndexes = text.markup
      .filter((s) => s._id === targetSpan._id)
      .flatMap((s) => [...new Set([s.start, s.end])]);
    // console.log("targetTokenIndexes", targetTokenIndexes);

    const targetTokenIds = text.tokens
      .filter((_, index) => targetTokenIndexes.includes(index))
      .map((token) => token._id);
    // console.log("targetTokenIds", targetTokenIds);

    dispatch(
      applyAnnotation({
        textId: text._id,
        projectId: project._id,
        applyAll: false,
        suggested: false,
        annotationType: "openRelation",
        sourceEntityId: sourceSpan._id,
        sourceEntityLabel: sourceSpan.label,
        targetEntityId: targetSpan._id,
        targetEntityLabel: targetSpan.label,
        relationTokenIds: selectMode.tokenIds,
        relationLabel: relationLabel,
        relationStart: relationLabelStartIndex,
        relationEnd: relationLabelEndIndex,
        targetTokenIds: targetTokenIds,
      })
    );
  };

  return (
    <div
      // ref={ref}
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
        show={
          sourceSpan &&
          targetSpan &&
          text._id === sourceSpan.textId &&
          allowSelect &&
          selectMode &&
          selectMode.tokenIds[selectMode.tokenIds.length - 1] === token._id
        }
        overlay={
          <Tooltip>
            <Button
              size="sm"
              variant="success"
              onClick={handleApplySingleOpenRelation}
            >
              +
            </Button>
            <Button size="sm" variant="danger">
              -
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
          annotated={hasMarkup(text, tokenIndex)}
          pos={markupPosition(text, tokenIndex)}
          onMouseOver={handleMouseOver}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {token.value}
        </span>
      </OverlayTrigger>

      {project.tasks.relationAnnotationType === "open" ? (
        <OpenSpans
          text={text}
          textIndex={textIndex}
          token={token}
          tokenIndex={tokenIndex}
        />
      ) : (
        <Spans
          text={text}
          textIndex={textIndex}
          token={token}
          tokenIndex={tokenIndex}
        />
      )}
    </div>
  );
};
