import { lighten } from "@mui/material";
import { grey } from "@mui/material/colors";

const LIGHTNESS_THRESHOLD = 0.9;
const BASE_TEXT_COLOR = grey[900];
const BASE_LINK_COLOR = grey[500];

/**
 * Renders the link and its label for a given link on the canvas context.
 *
 * @param {Object} link - The link object to render.
 * @param {CanvasRenderingContext2D} ctx - The canvas context to render on.
 * @param {number} globalScale - The current zoom scale of the graph.
 * @param {function} linkIsHighlighted - Function to check if the link is highlighted.
 * @param {number} lightnessThreshold - The lightness threshold value for non-highlighted links.
 * @param {string} BaseTextColor - The base color for the text.
 */
export function renderLinkWithLabel(
  link,
  ctx,
  globalScale,
  linkIsHighlighted,
  lightnessThreshold = LIGHTNESS_THRESHOLD,
  baseTextColor = BASE_TEXT_COLOR
) {
  const linkHighlighted = linkIsHighlighted(link.id);
  const label = link.label;
  const fontSize = 14 / globalScale ** 0.6;

  const x1 = link.source.x;
  const x2 = link.target.x;
  const y1 = link.source.y;
  const y2 = link.target.y;

  const x = (x1 + x2) / 2;
  const y = (y1 + y2) / 2;

  ctx.font = `${fontSize}px Sans-Serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = baseTextColor.startsWith("#")
    ? lighten(baseTextColor, linkHighlighted ? 0 : lightnessThreshold)
    : baseTextColor;
  ctx.fillText(label, x, y);
}

/**
 * Renders a node on the canvas context.
 *
 * @param {Object} node - The node object to render.
 * @param {CanvasRenderingContext2D} ctx - The canvas context to render on.
 * @param {number} globalScale - The current zoom scale of the graph.
 * @param {function} nodeIsHighlighted - Function to check if the node is highlighted.
 * @param {number} NODE_SIZE - The base node size.
 * @param {number} maxNodeWordLen - The maximum length of a node label word.
 * @param {number} maxLines - The maximum number of lines for node label.
 * @param {number} lightnessThreshold - The lightness threshold value for non-highlighted links.
 */
export function renderNode(
  node,
  ctx,
  globalScale,
  nodeIsHighlighted,
  NODE_SIZE,
  maxNodeWordLen = 12,
  maxLines = 4,
  lightnessThreshold = LIGHTNESS_THRESHOLD
) {
  const nodeHighlighted = nodeIsHighlighted(node.id);
  const fontSize = (14 * Math.cbrt(node.value)) / globalScale ** 0.6;

  const bgColor = node.color.background.startsWith("#")
    ? lighten(
        node.color.background,
        nodeHighlighted ? 0.25 : lightnessThreshold
      )
    : node.color.background;
  const borderColor = node.color.border.startsWith("#")
    ? lighten(node.color.border, nodeHighlighted ? 0 : lightnessThreshold)
    : node.color.border;
  const fontColor = node.font.color.startsWith("#")
    ? lighten(node.font.color, nodeHighlighted ? 0 : lightnessThreshold)
    : node.font.color;

  const nodeSize = NODE_SIZE * Math.cbrt(node.value);

  if (node.suggested) {
    // Create squares for suggested nodes
    ctx.beginPath();
    ctx.rect(node.x - nodeSize, node.y - nodeSize, nodeSize * 2, nodeSize * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    const dashLength = nodeSize / 8; // Scale dash length based on node size
    ctx.setLineDash([dashLength, dashLength]); // Set dashed border
    ctx.stroke();
    ctx.setLineDash([]); // Reset to solid line
  } else {
    // Create outer node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = bgColor;
    ctx.fill();

    // Create inner node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize - 0.5, 0, 2 * Math.PI, false);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Text
  ctx.font = `${fontSize}px Sans-Serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = fontColor;

  const nodeWords = node.label.split(" ").slice(0, maxLines);
  const yStart = -(fontSize / 2) * (nodeWords.length - 1);

  nodeWords.forEach((word, index) => {
    const truncatedWord =
      word.length > maxNodeWordLen
        ? word.slice(0, maxNodeWordLen) + "..."
        : word;
    ctx.fillText(
      truncatedWord,
      node.x,
      yStart + node.y + (fontSize + 2) * index
    );
  });
}

/**
 * Formats a node label as an HTML string.
 *
 * @param {Object} node - The node object containing label, title, value, and suggested properties.
 * @returns {string} - The formatted node label as an HTML string.
 */
export function formatNodeLabel(node) {
  const { label, title, value, suggested } = node;
  const suggestedText = suggested ? "<br>(suggested)" : "";

  return `
    <span style="display: flex; justify-content: center; text-align: center;">
      ${label}<br>
      [${title}]<br>
      ${value}
      ${suggestedText}
    </span>
  `;
}

/**
 * Formats a link label as an HTML string.
 *
 * @param {Object} link - The link object containing title and value properties.
 * @returns {string} - The formatted link label as an HTML string.
 */
export function formatLinkLabel(link) {
  const { title, value } = link;

  return `
    <span style="display: flex; justify-content: center; text-align: center;">
      ${title}<br>
      ${value}
    </span>
  `;
}

/**
 * Determines the color to render a link or arrow based on its highlight status and its color property.
 *
 * @param {Object} link - The link object to render.
 * @param {function} linkIsHighlighted - Function to check if the link is highlighted.
 * @param {string} baseLinkColor - The base color for the link.
 * @param {number} lightnessTthreshold - The lightness threshold value for non-highlighted links.
 * @param {string} colorType - The type of color to render ("link" or "arrow").
 * @returns {string} The color to render the link or arrow.
 */
export function renderLinkColor(
  link,
  linkIsHighlighted,
  baseLinkColor = BASE_LINK_COLOR,
  lightnessThreshold = LIGHTNESS_THRESHOLD,
  colorType
) {
  const linkHighlighted = linkIsHighlighted(link.id);
  const color = colorType === "arrow" ? link.color : link.color;

  if (!color.startsWith("#")) {
    return baseLinkColor;
  }

  return linkHighlighted ? color : lighten(link.color, lightnessThreshold);
}
