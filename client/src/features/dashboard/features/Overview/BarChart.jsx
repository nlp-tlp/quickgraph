import { PureComponent } from "react";
import { alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";

class CustomizedAxisTick extends PureComponent {
  render() {
    const { x, y, stroke, payload } = this.props;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          // textAnchor="end"
          fill="#666"
          // transform="rotate(-45)"
          fontSize={10}
        >
          {payload.value}
        </text>
      </g>
    );
  }
}

const DashboardBarChart = ({
  data,
  index,
  metadata,
  hasBrush = false,
  stacked = false,
  hasLabel = true,
}) => {
  // TODO: add colors based on ontology item customisation.
  const theme = useTheme();
  const uniqueUsernames = [
    ...new Set(
      Object.values(data).flatMap((item) =>
        Object.keys(item).filter((i) => i !== "x")
      )
    ),
  ];

  const hasLabelColors = metadata?.label_colors ?? false;
  // console.log("hasLabelColors", hasLabelColors);

  const bars = uniqueUsernames.map((username, index) => {
    const alphaValue = 1 - index / uniqueUsernames.length;

    const color = alpha(theme.palette.primary.main, alphaValue);
    return <Bar key={username} dataKey={username} fill={color} />;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 25,
          right: 30,
          left: 20,
          bottom: 100,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" tick={hasLabel ? <CustomizedAxisTick /> : false} />
        <YAxis tick={{ fontSize: 14 }} type="number" allowDecimals={false} />
        <Tooltip />
        <Legend
          verticalAlign="top"
          wrapperStyle={{
            paddingBottom: "15px",
          }}
          layout="horizontal"
        />
        {hasBrush && (
          <Brush dataKey="x" height={30} stroke={theme.palette.primary.main} />
        )}
        {bars}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DashboardBarChart;
