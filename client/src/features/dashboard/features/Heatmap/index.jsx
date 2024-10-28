import { useState } from "react";
import { Renderer } from "./Renderer";
import { Tooltip } from "./Tooltip";
import { COLOR_LEGEND_HEIGHT } from "./constants";
import { ColorLegend } from "./ColorLegend";
import * as d3 from "d3";
import { useTheme } from "@mui/material/styles";

export const Heatmap = ({ width, height, data, xLabelSuffix = "" }) => {
  const theme = useTheme();
  const [hoveredCell, setHoveredCell] = useState(null);

  // Color scale is computed here bc it must be passed to both the renderer and the legend
  const values = data.map((d) => d.value).filter((d) => d !== null);
  const max = d3.max(values) || 0;

  const colorScale = d3
    .scaleLinear()
    .domain([0, max])
    .range([theme.palette.neutral.main, theme.palette.primary.main]);

  return (
    <div style={{ position: "relative" }}>
      <Renderer
        width={width}
        height={height - COLOR_LEGEND_HEIGHT}
        data={data}
        setHoveredCell={setHoveredCell}
        colorScale={colorScale}
        xlabelSuffix={xLabelSuffix}
      />
      <Tooltip
        interactionData={hoveredCell}
        width={width}
        height={height - COLOR_LEGEND_HEIGHT}
      />
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <ColorLegend
          height={COLOR_LEGEND_HEIGHT}
          width={200}
          colorScale={colorScale}
          interactionData={hoveredCell}
        />
      </div>
    </div>
  );
};
