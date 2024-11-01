import { useState, useCallback, useContext, useRef } from "react";
import { ForceGraph2D } from "react-force-graph";
import * as d3 from "d3";
import { NODE_SIZE } from "../../../../shared/constants/graph";
import { GraphContext } from "../../../../shared/context/graph-context";
import {
  renderLinkWithLabel,
  renderNode,
  formatNodeLabel,
  formatLinkLabel,
  renderLinkColor,
} from "./utils";

const ForceGraph = ({ data, width = 800, height = 800 }) => {
  const { state } = useContext(GraphContext);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [initialCenter, setInitialCenter] = useState(false);

  const graphRef = useCallback(
    (node) => {
      // https://stackoverflow.com/questions/54346040/react-hooks-ref-is-not-avaiable-inside-useeffect
      if (node !== null) {
        node.d3Force("link").distance(500); //.strength(0.9);
        node.d3Force("charge").strength(-250);
        node.d3Force("charge").distanceMax(2500);
        node.d3Force("collide", d3.forceCollide(50));
      }
    },
    [initialCenter]
  );

  const handleNodeDrag = (node) => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (node) {
      highlightNodes.add(node.id);
      data.relationships[node.id].nodes.forEach((neighbour) =>
        highlightNodes.add(neighbour)
      );
      data.relationships[node.id].links.forEach((link) =>
        highlightLinks.add(link)
      );
    }

    setHighlightNodes(highlightNodes);
    setHighlightLinks(highlightLinks);
  };

  const handleNodeDragEnd = () => {
    setHighlightLinks(new Set());
    setHighlightNodes(new Set());
  };

  const linkIsHighlighted = (linkId) =>
    (highlightLinks.size > 0 && highlightLinks.has(linkId)) ||
    (highlightLinks.size === 0 && highlightNodes.size === 0);

  const nodeIsHighlighted = (nodeId) =>
    (highlightNodes.size > 0 && highlightNodes.has(nodeId)) ||
    highlightNodes.size === 0;

  if (state.loading) {
    return null;
  } else if (data && data.nodes && data.links) {
    return (
      <ForceGraph2D
        ref={graphRef}
        graphData={{
          ...data,
          nodes: Object.values(data.nodes),
          links: Object.values(data.links),
        }}
        width={width}
        height={height}
        warmUpTicks={100}
        cooldownTicks={100}
        onEngineStop={() => {
          setInitialCenter(false);
          // if (graphLoaded && initialCenter) {
          // }
        }}
        onNodeDrag={(node) => handleNodeDrag(node)}
        onNodeDragEnd={() => handleNodeDragEnd()}
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.2}
        d3AlphaMin={0.05}
        d3AlphaTarget={0.9}
        // nodeVisibility={(node) => nodeIsHighlighted(node.id)}
        nodeRelSize={NODE_SIZE}
        nodeVal={(node) => node.value}
        nodeLabel={(node) => formatNodeLabel(node)}
        // linkVisibility={(link) => linkIsHighlighted(link.id)}
        linkLabel={(link) => formatLinkLabel(link)}
        linkWidth={(link) => link.value}
        linkColor={(link) => renderLinkColor(link, linkIsHighlighted)}
        linkDirectionalArrowColor={(link) =>
          renderLinkColor(link, linkIsHighlighted)
        }
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowLength={(link) =>
          (link.value * 15) / (link.value > 1 ? 2 : 1)
        }
        linkLineDash={(link) => {
          return link.suggested ? [4, 3] : null;
        }}
        enableNodeDrag={true}
        nodeCanvasObject={(node, ctx, globalScale) => {
          renderNode(node, ctx, globalScale, nodeIsHighlighted, NODE_SIZE);
        }}
        linkCanvasObjectMode={() => "after"}
        linkCanvasObject={(link, ctx, globalScale) => {
          renderLinkWithLabel(link, ctx, globalScale, linkIsHighlighted);
        }}
      />
    );
  } else if (
    data &&
    data.nodes &&
    Object.keys(data.nodes).length === 0 &&
    !state.loading
  ) {
    return <p>No graph data</p>;
  } else {
    return <p>Unexpected error occurred</p>;
  }
};

export default ForceGraph;
