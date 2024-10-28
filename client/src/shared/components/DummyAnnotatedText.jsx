/**
 * Component that is like annotated entity text but has no functionality apart from rendering spans.
 */

import { getSpanLabelPosition } from "../utils/text";
import { Stack, Box } from "@mui/material";
import { TokenComponent } from "../../features/project/TextContainer";
import { SpanComponent } from "../../features/project/spans/Span";

const DummyAnnotatedText = ({ tokens, entities = [] }) => {
  return (
    <Box
      component="div"
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
      p={2}
    >
      {tokens.length > 0 &&
        tokens.map((token, index) => {
          const tokenId = `token-${index}`;
          return (
            <Token
              token={token}
              tokenIndex={index}
              tokenId={tokenId}
              hasEntitySpans={entities.length > 0}
              entitySpans={entities}
              key={tokenId}
            />
          );
        })}
    </Box>
  );
};

const Token = ({ token, tokenIndex, tokenId, hasEntitySpans, entitySpans }) => {
  return (
    <Stack
      key={tokenId}
      direction="column"
      id="token-container"
      tokenindex={token.index}
    >
      <TokenComponent tokenindex={token.index} key={tokenId} disabled={true}>
        {token}
      </TokenComponent>
      {hasEntitySpans && (
        <SpanStack tokenIndex={tokenIndex} entitySpans={entitySpans} />
      )}
    </Stack>
  );
};

const SpanStack = ({ tokenIndex, entitySpans }) => {
  const spanComponentsMarkup = entitySpans
    .slice()
    .sort((a, b) => b.end - b.start - (a.end - a.start)) // Sorting pushes longer spans to the top
    .filter((span) => span.start <= tokenIndex && tokenIndex <= span.end)
    .map((span, index) => {
      return (
        <Span
          tokenIndex={tokenIndex}
          span={span}
          suggested={span.suggested}
          key={`token-span-${index}`}
        />
      );
    });

  return spanComponentsMarkup;
};

const Span = ({ tokenIndex, span, suggested }) => {
  const spanLabelPos = getSpanLabelPosition(span, tokenIndex);
  const labelColor = span.ontology_item_color;

  return (
    <SpanComponent
      key={tokenIndex}
      suggested={suggested ? 1 : 0}
      position={spanLabelPos}
      labelcolor={labelColor}
      title={span.ontology_item_fullname}
      disabled={true}
    >
      {span.ontology_item_name}
    </SpanComponent>
  );
};

export default DummyAnnotatedText;
