export const getRandomColor = (seed) => {
  // https://stackoverflow.com/questions/31243892/random-fill-colours-in-chart-js
  var letters = "0123456789ABCDEF".split("");
  var colour = "#";
  for (var i = 0; i < 6; i++) {
    colour += letters[Math.floor(Math.random(seed) * 16)];
  }
  return colour;
};

// All but two MUI colours sampled from 500 on this palette: https://www.muicss.com/docs/v1/getting-started/colours
// These are used for determinstic colours, mainly presets where children share the same colour.
export const muiColorPalette500 = [
  "#E91E63",
  "#9C27B0",
  "#FFC107",
  "#03A9F4",
  "#673AB7",
  "#F44336",
  "#795548",
  "#3F51B5",
  "#00BCD4",
  "#4CAF50",
  "#FFEB3B",
  "#FF9800",
  "#009688",
  "#2196F3",
  "#8BC34A",
  "#CDDC39",
  "#FF5722",
];
