import styles from "./tooltip.module.css";

export const Tooltip = ({ interactionData, width, height }) => {
  if (!interactionData) {
    return null;
  }
  return (
    // Wrapper div: a rect on top of the viz area
    <div
      style={{
        width,
        height,
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      {/* The actual box with white background */}
      <div
        className={styles.tooltip}
        style={{
          position: "absolute",
          left: interactionData.xPos,
          top: interactionData.yPos,
        }}
      >
        <span>{interactionData.yLabel}</span>
        <br />
        <span>{interactionData.xLabel}</span>
        <span>: </span>
        <b>{interactionData.value}</b>
      </div>
    </div>
  );
};
