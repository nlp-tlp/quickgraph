/*
    Function for determining span label position e.g.
    'start', 'start-single', 'middle' or 'end'
*/
export const getSpanLabelPosition = (span, tokenIndex) => {
  const spanLabelPos =
    span.start === tokenIndex && span.end - span.start > 0 // if unigram is applied, we want to show the accept button...
      ? "start"
      : span.start === tokenIndex && span.end - span.start === 0
      ? "start-single" // Start single is for unigrams
      : span.end === tokenIndex
      ? "end"
      : "middle";

  return spanLabelPos;
};
