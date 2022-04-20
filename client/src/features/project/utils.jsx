/*
    Function for getting token contrast ratio (tests white against colour).
    If ratio < 4.5 -> sets font to black, otherwise sets to white.
*/
export const getFontColour = (colour) => {
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
};

/*
    Function for checking whether a token has markup.
    Checks whether span(s) exist and whether the current token
    is marked up (accepted or suggested)
*/
export const hasMarkup = (entities, tokenIndex) => {
  if (entities === undefined) {
    return false;
  } // Text doesn't have entities

  const markupSpans = entities.filter(
    (span) => span.start <= tokenIndex && tokenIndex <= span.end
  );
  const suggestedMarkupSpans = entities.filter(
    (span) =>
      span.suggested && span.start <= tokenIndex && tokenIndex <= span.end
  );
  const inMarkupSpan = markupSpans.length > 0;
  const inSuggestedMarkupSpan = suggestedMarkupSpans.length > 0;

  return inMarkupSpan || inSuggestedMarkupSpan ? "true" : "false";
};

/*
    Function for calculating positional information for tokens
    that have span(s). Also determines position of selected spans prior
    to a markup event. If the current token is marked up (accepted or suggested),
    determines whether position is 'start', 'single-start', 'middle' or 'end'.
*/
export const markupPosition = (entities, tokenIndex) => {
  if (entities === undefined) {
    return false;
  } // Text doesn't have entities
  const markupSpans = entities.filter(
    (span) => span.start <= tokenIndex && tokenIndex <= span.end
  );
  const suggestedMarkupSpans = entities.filter(
    (span) =>
      span.suggested && span.start <= tokenIndex && tokenIndex <= span.end
  );
  const inMarkupSpan = markupSpans.length > 0;
  const inSuggestedMarkupSpan = suggestedMarkupSpans.length > 0;
  if (inMarkupSpan || inSuggestedMarkupSpan) {
    // Token intersects with span; find it's position
    // Note: there can be multiple spans on markup;
    // Find all candidate positions and then select correct one
    const position = [...markupSpans, ...suggestedMarkupSpans].map((span) => {
      if (span.start === tokenIndex && span.end - span.start > 0) {
        return "start";
      } else if (span.start === tokenIndex && span.end - span.start === 0) {
        return "start-single";
      } else if (span.end === tokenIndex) {
        return "end";
      } else {
        return "middle";
      }
    })[0];
    // TODO: See what
    return position;
  } else {
    return;
  }
};

export const getFlatOntology = (a) => {
  return flattenOntology(a);
  function flattenOntology(a) {
    return a.reduce(function (
      flattened,
      { _id, name, fullName, colour = null, children, domain, range, isEntity }
    ) {
      return flattened
        .concat([
          { _id, name, fullName, colour, domain, range, isEntity, children }, // Adds children back in for use elsewhere
        ])
        .concat(children ? flattenOntology(children) : []);
    },
    []);
  }
};
