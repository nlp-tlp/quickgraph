module.exports = {
  getRandomColor: (seed = 1337) => {
    // https://stackoverflow.com/questions/31243892/random-fill-colours-in-chart-js
    var letters = "0123456789ABCDEF".split("");
    var colour = "#";
    for (var i = 0; i < 6; i++) {
      colour += letters[Math.floor(Math.random(seed) * 16)];
    }
    return colour;
  },
  addAlpha: (color, opacity) => {
    // Colour is HEX
    // source: https://stackoverflow.com/a/68398236
    // coerce values so ti is between 0 and 1.
    // used for silver and weak labels.
    var _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
    return color + _opacity.toString(16).toUpperCase();
  },
  getFontColour: (colour) => {
    const hexToRgb = (hex) =>
      hex
        .replace(
          /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
          (m, r, g, b) => "#" + r + r + g + g + b + b
        )
        .substring(1)
        .match(/.{2}/g)
        .map((x) => parseInt(x, 16));

    const luminance = (r, g, b) => {
      let a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const contrast = (rgb1, rgb2) => {
      let lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
      let lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
      let brightest = Math.max(lum1, lum2);
      let darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    };

    const ratioWhite = contrast(hexToRgb(colour), [255, 255, 255]);
    const ratioBlack = contrast(hexToRgb(colour), [0, 0, 0]);

    return ratioWhite > ratioBlack ? "white" : "black";
  },
  getSurfaceTextMarkup: (source, target, tokens) => {
    // Provided the token indexes for source and target spans and the token set for a given text
    // this function highlights their realisations at the surface level
    // e.g. source: {start: 0, end: 1}, target: {start, 5, end: 5}, surfaceTextTokens: [hello, world, my name, is, tyler], the resulting surfaceText is: "[[hello world]] my name is [[tyler]]".
    // Note: This borrows from the conceptnet format: https://github.com/commonsense/conceptnet5/wiki/API#surfacetext

    console.log("source", source, "target", target, "tokens", tokens);

    const surfaceTokens = [...tokens]; // Stops array from accumulating
    surfaceTokens[source.start] = "[[" + surfaceTokens[source.start];
    surfaceTokens[target.start] = "[[" + surfaceTokens[target.start];
    surfaceTokens[target.end] = surfaceTokens[target.end] + "]]";
    surfaceTokens[source.end] = surfaceTokens[source.end] + "]]";
    return surfaceTokens.join(" ");
  },
  getFlatOntology: (a) => {
    return flattenOntology(a);
    function flattenOntology(a) {
      return a.reduce(function (
        flattened,
        {
          _id,
          name,
          fullName,
          colour = null,
          children,
          domain,
          range,
          isEntity,
        }
      ) {
        return flattened
          .concat([{ _id, name, fullName, colour, domain, range, isEntity }])
          .concat(children ? flattenOntology(children) : []);
      },
      []);
    }
  },
  filterOntology: (a, labelFullNames) => {
    /*
      Filters ontology to find parents of labels
      Given name1 as `person/president` it finds any nameX that is a subset of
      name1 broken into an array ['person', 'president']
    */
    const filterData = (data, labelFullNames) =>
      data.filter((o) => {
        const isRelated =
          labelFullNames.filter((name) =>
            o.fullName.split("/").every((val) => name.split("/").includes(val))
          ).length > 0;
        if (o.children) o.children = filterData(o.children, labelFullNames);
        return isRelated;
      });

    return filterData(a, labelFullNames);
  },
};
