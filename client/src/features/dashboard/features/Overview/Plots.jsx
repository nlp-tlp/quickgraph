import { PureComponent } from "react";
import { Grid, Alert, AlertTitle } from "@mui/material";
import { HeatmapProjectProgress } from "./HeatmapProjectProgress";
import { HeatmapEntityProgress } from "./HeatmapEntityProgress";
import { HeatmapRelationProgress } from "./HeatmapRelationProgress";
import { HeatmapTripleProgress } from "./HeatmapTripleProgress";
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
          textAnchor="end"
          fill="#666"
          transform="rotate(-45)"
        >
          {payload.value}
        </text>
      </g>
    );
  }
}

const Plots = ({ data, index }) => {
  const theme = useTheme();
  const hasData = data && data.length !== 0;

  const uniqueUsernames = [
    ...new Set(
      Object.values(data).flatMap((item) =>
        Object.keys(item).filter((i) => i !== "x")
      )
    ),
  ];

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
        <XAxis dataKey="x" tick={<CustomizedAxisTick />} />
        <YAxis tick={{ fontSize: 14 }} type="number" allowDecimals={false} />
        <Tooltip />
        <Legend verticalAlign="top" />
        {bars}
      </BarChart>
    </ResponsiveContainer>
  );

  // let Component;
  // switch (index) {
  //   case 0:
  //     Component = (
  //       <ResponsiveContainer width="100%" height={400}>
  //         <BarChart
  //           width={500}
  //           height={300}
  //           data={groupedData}
  //           margin={{
  //             top: 5,
  //             right: 30,
  //             left: 20,
  //             bottom: 5,
  //           }}
  //         >
  //           <CartesianGrid strokeDasharray="3 3" />
  //           <XAxis dataKey="x" />
  //           <YAxis />
  //           <Tooltip />
  //           <Legend />
  //           {bars}
  //         </BarChart>
  //       </ResponsiveContainer>
  //     );
  //     break;
  //   case 1:
  //     Component = <HeatmapEntityProgress data={data} />;
  //     break;
  //   case 2:
  //     Component = <HeatmapRelationProgress data={data} />;
  //     break;
  //   case 3:
  //     Component = <HeatmapTripleProgress data={data} />;
  //     break;
  //   default:
  //     return null;
  // }

  // return (
  //   <Grid
  //     container
  //     item
  //     xs={12}
  //     justifyContent="center"
  //     alignItems="center"
  //     p={2}
  //   >
  //     {hasData ? (
  //       Component
  //     ) : (
  // <Alert severity="info">
  //   <AlertTitle>No data available</AlertTitle>No annotations have been
  //   saved by project annotators yet.
  // </Alert>
  //     )}
  //   </Grid>
  // );
};

export default Plots;
