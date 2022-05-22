import {
  MdContentPaste,
  MdDelete,
  MdDeleteSweep,
  MdDone,
  MdDoneAll,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import {
  acceptAnnotation,
  applyAnnotation,
  deleteAnnotation,
  selectTexts,
} from "../../../app/dataSlice";
import { selectProject, selectFlatOntology } from "../projectSlice";

export const EntityTooltipContent = ({ tooltipFocusSpan, text }) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const flatOntology = useSelector(selectFlatOntology);
  const flatEntityOntology = flatOntology.filter((i) => i.isEntity);
  const texts = useSelector(selectTexts);

  const labelFullName =
    flatEntityOntology.filter((e) => e._id == tooltipFocusSpan.labelId).length >
      0 &&
    flatEntityOntology.filter((e) => e._id == tooltipFocusSpan.labelId)[0]
      .fullName;

  const handleMarkupAllClick = () => {
    const textId = text._id;
    const tokens = Object.values(text.tokens).filter(
      (token) =>
        tooltipFocusSpan.start <= token.index &&
        token.index <= tooltipFocusSpan.end
    );

    // console.log("handling apply all", tooltipFocusSpan);

    dispatch(
      applyAnnotation({
        entitySpanStart: tokens[0].index,
        entitySpanEnd:
          tokens.length === 1
            ? tokens[0].index
            : tokens[tokens.length - 1].index,
        entityLabelId: tooltipFocusSpan.labelId,
        textId: textId,
        projectId: project._id,
        applyAll: true,
        suggested: false,
        annotationType: "entity",
        textIds: Object.keys(texts),//.map((t) => t._id),
        entityText: tokens.map((t) => t.value).join(" "),
      })
    );
  };

  return (
    <div style={{ cursor: "pointer" }} className="icon-container">
      {tooltipFocusSpan && tooltipFocusSpan.type === "accepted" ? (
        <>
          <span
            id="accept-all"
            onClick={handleMarkupAllClick}
            title={`Click to apply across entire corpus (${labelFullName})`}
          >
            <MdContentPaste />
          </span>
          <span
            id="delete-one"
            onClick={() => {
              dispatch(
                deleteAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  applyAll: false,
                  suggested: false,
                  annotationType: "entity",
                  textIds: Object.keys(texts),//.map((t) => t._id),
                  entityText: tooltipFocusSpan.entityText,
                })
              );
            }}
            title={`Click to delete this label (${labelFullName})`}
          >
            <MdDelete />
          </span>
          <span
            id="delete-all"
            onClick={() => {
              dispatch(
                deleteAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  applyAll: true,
                  suggested: false,
                  annotationType: "entity",
                  textIds: Object.keys(texts),//.map((t) => t._id),
                  entityText: tooltipFocusSpan.entityText,
                })
              );
            }}
            title={`Click to delete all matching labels (${labelFullName})`}
          >
            <MdDeleteSweep />
          </span>
        </>
      ) : (
        <>
          <span
            id="accept-one"
            onClick={() => {
              dispatch(
                acceptAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  entityLabelId: tooltipFocusSpan.labelId,
                  applyAll: false,
                  annotationType: "entity",
                  suggested: false,
                  textIds: Object.keys(texts),//.map((t) => t._id),
                  entityText: tooltipFocusSpan.entityText,
                })
              );
            }}
            title={`Click to accept this suggestion (${labelFullName})`}
          >
            <MdDone />
          </span>
          <span
            id="accept-all"
            onClick={() => {
              dispatch(
                acceptAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  entityLabelId: tooltipFocusSpan.labelId,
                  applyAll: true,
                  annotationType: "entity",
                  suggested: false,
                  textIds: Object.keys(texts),//.map((t) => t._id),
                  entityText: tooltipFocusSpan.entityText,
                })
              );
            }}
            title={`Click to accept all suggestions (${labelFullName})`}
          >
            <MdDoneAll />
          </span>
          <span
            id="delete-one"
            onClick={() => {
              dispatch(
                deleteAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  relationId: null,
                  applyAll: false,
                  suggested: true,
                  annotationType: "entity",
                  textIds: Object.keys(texts),//.map((t) => t._id),
                  entityText: tooltipFocusSpan.entityText,
                })
              );
            }}
            title={`Click to decline this suggestion (${labelFullName})`}
          >
            <MdDelete />
          </span>
          <span
            id="delete-all"
            onClick={() => {
              dispatch(
                deleteAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  relationId: null,
                  applyAll: true,
                  suggested: true,
                  annotationType: "entity",
                  textIds: Object.keys(texts),//.map((t) => t._id),
                  entityText: tooltipFocusSpan.entityText,
                })
              );
            }}
            title={`Click to decline all suggestions (${labelFullName})`}
          >
            <MdDeleteSweep />
          </span>
        </>
      )}
    </div>
  );
};
