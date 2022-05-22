import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../../utils/api-interceptor";
import { v4 as uuidv4 } from "uuid";

const initialState = {
  status: "idle",
  error: null,
  filters: {
    searchTerm: "",
    labelIds: [],
    showWeak: false,
  },
  options: {
    interaction: {
      tooltipDelay: 200,
      selectConnectedEdges: false,
    },
    physics: { stablization: { enabled: true, fit: true } },
    layout: {
      randomSeed: 1337,
      improvedLayout: false, //https://github.com/almende/vis/issues/2906
      hierarchical: false,
    },
    edges: {
      smooth: true,
      length: 250,
      font: {
        size: 16,
      },
      scaling: {
        // customScalingFunction: function (min, max, total, value) {
        //   if (min === max) {
        //     return 0.1;
        //   } else {
        //     var scale = 0.5 / (max - min);
        //     return Math.max(0, (value - min) * scale);
        //   }
        // },
      },
    },
    nodes: {
      shape: "box",
      margin: 5,
      scaling: {
        label: {
          enabled: true,
          min: 12,
          max: 30,
        },
        // customScalingFunction: function (min, max, total, value) {
        //   if (max === min) {
        //     return 0.5;
        //   } else {
        //     var scale = 1 / (max - min);
        //     return Math.max(0, (value - min) * scale);
        //   }
        // },
      },
    },
  },
  data: {},
  metrics: null,
  filteredOntology: null, // Project ontology limited to items that have annotations
  selectedNode: null,
  text: null,
  textId: null,
  highlighted: false,
  aggregate: true, // Lets the graph load faster by defaulting
  graphKey: null,
};

export const fetchGraph = createAsyncThunk(
  "/graph/fetchGraph",
  async ({ projectId }, { getState }) => {
    const state = getState();
    const response = await axios.post(`/api/project/graph/${projectId}`, {
      aggregate: state.graph.aggregate,
      filters: state.graph.filters,
    });
    return response.data;
  }
);

export const graphSlice = createSlice({
  name: "graph",
  initialState: initialState,
  reducers: {
    setAggregate: (state, action) => {
      state.aggregate = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    resetFilters: (state, action) => {
      // Reset filters to initial state except clusters as they are data driven.
      state.filters = initialState.filters;
    },
    resetGraph: (state, action) => {
      state.graphKey = uuidv4();

      state.text = initialState.text;
      state.textId = null;
      state.selectedNode = null;
      if (state.aggregate) {
        state.data = {
          nodes: state.data.nodes.map((node) => ({
            ...node,
            hidden: false,
            label:
              node.hiddenLabel !== node.label ? node.hiddenLabel : node.label,
            color:
              node.color !== node.hiddenColor ? node.hiddenColor : node.color,
          })),
          edges: state.data.edges.map((edge) => ({
            ...edge,
            font: { color: "black" },
            color: "black",
            hidden: false,
            label: edge.label === "" ? edge.hiddenLabel : edge.label,
          })),
        };
      } else {
        state.data = {
          ...state.data,
          nodes: state.data.nodes.map((n) => ({
            ...n,
            label: n.hiddenLabel !== n.label ? n.hiddenLabel : n.label,
            hiddenLabel: n.hiddenLabel,
            hidden: false,
            physics: true,
          })),
          edges: state.data.edges.map((e) => ({
            ...e,
            hidden: false,
            physics: true,
            label: e.hiddenLabel !== undefined ? e.hiddenLabel : e.label,
          })),
        };
      }
    },
    setSelectedNode: (state, action) => {
      const params = action.payload.params;

      if (!state.aggregate && state.selectedNode === null) {
        const focusNode = state.data.nodes.filter(
          (node) => node.id.toString() === params.nodes.toString()
        );
        const focusNodeTextId = focusNode.map((node) => node.textId);
        const focusNodeText = focusNode.map((node) => node.text);
        state.selectedNode = focusNode.map((node) => node.id)[0];
        state.textId = focusNodeTextId[0];
        state.text = focusNodeText[0];

        // Hide all other nodes and edges
        const newGraphData = {
          nodes: state.data.nodes.map((node) =>
            node.textId.toString() === focusNodeTextId.toString()
              ? {
                  ...node,
                  hidden: false,
                  label: `${node.label}\n\n(${node.class})`,
                  hiddenLabel: node.label,
                }
              : { ...node, hidden: true, physics: false }
          ),
          edges: state.data.edges.map((edge) =>
            edge.textId.toString() === focusNodeTextId.toString()
              ? { ...edge, hidden: false }
              : { ...edge, hidden: true, physics: false }
          ),
        };
        // console.log("new graph data", newGraphData);
        state.graphKey = uuidv4(); // Trigger physics
        state.data = newGraphData;
      } else if (state.aggregate) {
        // Graph is aggregated; want to highlight selected neighbourhood.
        // Source:  https://codepen.io/pen/?editors=0010

        let allNodes;
        let allEdges;
        if (state.highlighted) {
          // User selected node on already highlighted graph - reset it before
          // computing first degrees
          allNodes = state.data.nodes.map((n) => ({
            ...n,
            label: n.label === undefined ? n.hiddenLabel : n.label,
            hiddenLabel: undefined,
            color: n.hiddenColor,
          }));

          allEdges = state.data.edges.map((e) => ({
            ...e,
            font: { color: "black" },
            color: "black",
            label: e.hiddenLabel,
          }));
        } else {
          allNodes = state.data.nodes;
          allEdges = state.data.edges;
        }

        const hiddenColor = "rgba(200,200,200,0.1)";

        if (params.nodes.length > 0) {
          state.highlighted = true;
          var selectedNode = params.nodes[0];
          // let allNodes = graphData.nodes;
          // let allEdges = graphData.edges;

          // mark all nodes as hard to read;
          for (var nodeId in allNodes) {
            allNodes[nodeId].hiddenColor = allNodes[nodeId].color;
            allNodes[nodeId].color = hiddenColor;
            if (allNodes[nodeId].hiddenLabel === undefined) {
              allNodes[nodeId].hiddenLabel = allNodes[nodeId].label;
              allNodes[nodeId].label = undefined;
            }
          }

          // mark all edges as hard to read;
          allEdges = allEdges.map((e) => ({
            ...e,
            color: hiddenColor,
            hiddenLabel: e.label,
            label: "",
            font: {
              color: hiddenColor,
            },
          }));

          // Get first degree connections to the selected node
          // Node Ids of first degree connections
          const connectedNodeIds = [
            ...new Set(
              allEdges
                .filter((e) => e.from === selectedNode || e.to === selectedNode)
                .flatMap((e) => [e.from, e.to])
            ),
          ];
          const connectedEdgeIds = [
            ...new Set(
              allEdges
                .filter((e) => e.from === selectedNode || e.to === selectedNode)
                .map((e) => e.id)
            ),
          ];
          // Give colour back to first degree connected nodes
          allNodes = allNodes.map((n) =>
            connectedNodeIds.includes(n.id)
              ? {
                  ...n,
                  label: n.hiddenLabel,
                  hiddenLabel: undefined,
                  color: n.hiddenColor,
                }
              : n
          );

          // Check if node is isolated, if so, add properties back.
          allNodes =
            allNodes.filter((n) => n.label !== undefined).length === 0
              ? allNodes.map((n) => {
                  if (n.id === selectedNode) {
                    return {
                      ...n,
                      color: n.hiddenColor,
                      label: n.hiddenLabel,
                    };
                  } else {
                    return n;
                  }
                })
              : allNodes;

          // Give colour back to all first degree edges
          allEdges = allEdges.map((e) =>
            connectedEdgeIds.includes(e.id)
              ? {
                  ...e,
                  label: e.hiddenLabel,
                  color: "black",
                  font: { color: "black" },
                }
              : e
          );

          // console.log("aggregate node select data", {
          //   nodes: allNodes,
          //   edges: allEdges,
          // });

          state.data = { nodes: allNodes, edges: allEdges };
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGraph.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchGraph.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.graphKey = uuidv4();

        state.data = action.payload.data;
        state.metrics = action.payload.metrics;
        state.filters.labelIds = action.payload.labelIds;

        // Active labels (+ parents) only
        state.filteredOntology = action.payload.ontology;
      })
      .addCase(fetchGraph.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
        //   Reset graph state
        // Handle node select
        //  Handle graph reset
      });
  },
});

export const {
  setAggregate,
  setFilters,
  resetFilters,
  resetGraph,
  setSelectedNode,
} = graphSlice.actions;

export const selectGraphData = (state) => state.graph.data;
export const selectGraphStatus = (state) => state.graph.status;
export const selectGraphMetrics = (state) => state.graph.metrics;
export const selectNodeClasses = (state) => state.graph.nodeClasses;
export const selectGraphOptions = (state) => state.graph.options;
export const selectSelectedNode = (state) => state.graph.selectedNode;
export const selectHighlighted = (state) => state.graph.highlighted;
export const selectAggregate = (state) => state.graph.aggregate;
export const selectGraphKey = (state) => state.graph.graphKey;
export const selectGraphFilters = (state) => state.graph.filters;
export const selectFilteredOntology = (state) => state.graph.filteredOntology;

export const selectText = (state) => state.graph.text;
export const selectTextId = (state) => state.graph.textId;

export default graphSlice.reducer;
