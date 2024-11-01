const _ = require("lodash");

/**
 * Returns the neighbors of nodes in a given graph.
 *
 * @param {Object} nodes - An object containing the nodes of the graph.
 * @param {Object} links - An object containing the links of the graph.
 * @returns {Object} An object containing the neighbors of each node in the format:
 *                   {'nodeId': {'nodes': [neighbour node ids, ...], 'links': [link ids linking neighbour nodes, ...]}, ...}
 */
function getNodeNeighbors(nodes, links) {
  // Check if nodes and links are defined
  if (!nodes || !links) {
    return {};
  }

  const neighbors = {};

  // Initialize the neighbors object with empty arrays for each node
  for (const nodeId in nodes) {
    neighbors[nodeId] = {
      nodes: [],
      links: [],
    };
  }

  // Iterate through links and populate the neighbors object with neighboring node ids and corresponding link ids
  for (const linkId in links) {
    const link = links[linkId];
    const source = link.source?.id ?? link.source;
    const target = link.target?.id ?? link.target;

    if (neighbors[source] && neighbors[target]) {
      neighbors[source].nodes.push(target);
      neighbors[source].links.push(linkId);
      neighbors[target].nodes.push(source);
      neighbors[target].links.push(linkId);
    }
  }

  return neighbors;
}

/**
 * Filters a given graph data object based on a case-insensitive substring match on
 * the "label" of the nodes. Returns an object containing the filtered nodes and links.
 *
 * @param {Object} data - The graph data object containing nodes and links.
 * @param {string} searchText - The text to search within the node labels.
 * @returns {Object} An object containing the filtered nodes and links.
 */

function filterGraphByLabel(data, searchText) {
  const { nodes, links } = data;

  // Filter nodes based on case-insensitive substring match on the "label"
  const filteredNodes = Object.values(nodes).reduce((filtered, node) => {
    if (node.label.toLowerCase().includes(searchText.toLowerCase())) {
      filtered[node.id] = node;
    }
    return filtered;
  }, {});

  // Add nodes that are one link away from the filtered nodes
  const filteredLinks = Object.values(links).reduce((filtered, link) => {
    const linkSourceId = link.source?.id ?? link.source;
    const linkTargetId = link.target?.id ?? link.target;

    if (filteredNodes[linkSourceId] && !filteredNodes[linkTargetId]) {
      filtered[linkTargetId] = nodes[linkTargetId];
    } else if (filteredNodes[linkTargetId] && !filteredNodes[linkSourceId]) {
      filtered[linkSourceId] = nodes[linkSourceId];
    }
    return filtered;
  }, filteredNodes);

  // Filter links based on the filtered nodes
  const filteredLinks2 = Object.values(links).reduce((filtered, link) => {
    const linkSourceId = link.source?.id ?? link.source;
    const linkTargetId = link.target?.id ?? link.target;

    if (filteredLinks[linkSourceId] && filteredLinks[linkTargetId]) {
      filtered[link.id] = link;
    }
    return filtered;
  }, {});

  return {
    nodes: filteredLinks,
    links: filteredLinks2,
    relationships: getNodeNeighbors(filteredLinks, filteredLinks2),
  };
}

function filterGraphByQuality(data, quality) {
  const { nodes, links } = data;

  // Filter nodes based on their quality
  const filteredNodes = Object.values(nodes).reduce((filtered, node) => {
    if (
      (!node.suggested && quality === 0) ||
      (node.suggested && quality === 1)
    ) {
      filtered[node.id] = node;
    }
    return filtered;
  }, {});

  // Filter links based on the filtered nodes and their quality
  const filteredLinks = Object.values(links).reduce((filtered, link) => {
    if (
      (!link.suggested && quality === 0) ||
      (link.suggested && quality === 1)
    ) {
      const linkSourceId = link.source?.id ?? link.source;
      const linkTargetId = link.target?.id ?? link.target;

      if (
        filteredNodes.hasOwnProperty(linkSourceId) &&
        filteredNodes.hasOwnProperty(linkTargetId)
      ) {
        filtered[link.id] = link;
      }
    }
    return filtered;
  }, {});

  return {
    nodes: filteredNodes,
    links: filteredLinks,
    relationships: getNodeNeighbors(filteredNodes, filteredLinks),
  };
}
/**
 * Aggregates a given graph data object based on the unique combination of node label,
 * ontology_item_id, and link properties. Returns an object containing the
 * aggregated nodes and links.
 *
 * @param {Object} data - The graph data object containing nodes and links.
 * @returns {Object} An object containing the aggregated nodes and links.
 */
function aggregateGraph(data) {
  const { nodes, links } = data;

  // Return an object with empty nodes, links, and relationships if nodes is empty
  if (Object.keys(nodes).length === 0) {
    return {
      nodes: {},
      links: {},
      relationships: {},
    };
  }

  // Aggregate nodes
  const aggregatedNodes = _(Object.values(nodes))
    .groupBy(
      (node) => `${node.label}-${node.ontology_item_id}-${node.suggested}`
    )
    .map((group, index) => {
      const newNode = { ...group[0] };
      newNode.id = `node_${index}`;
      newNode.value = group.length;
      return newNode;
    })
    .keyBy("id")
    .value();

  // Create a node map for mapping (label, ontology_item_id) to the aggregated node ID
  const nodeMap = Object.values(aggregatedNodes).reduce((map, node) => {
    const key = `${node.label}-${node.ontology_item_id}-${node.suggested}`;
    map[key] = node.id;
    return map;
  }, {});

  // Populate links with src/tgt information
  const enrichedLinks = Object.keys(links).map((id) => ({
    ...links[id],
    source: nodes[links[id].source?.id ?? links[id].source],
    target: nodes[links[id].target?.id ?? links[id].target],
  }));

  // Aggregate links
  const aggregatedLinks = _(enrichedLinks)
    .groupBy((link) => {
      return `${link.source.label}-${link.source.ontology_item_id}-${link.target.label}-${link.target.ontology_item_id}-${link.ontology_item_id}-${link.suggested}`;
    })
    .map((group, index) => {
      const newLink = { ...group[0] };
      newLink.id = `link_${index}`;
      newLink.value = group.length;
      newLink.source =
        nodeMap[
          `${newLink.source.label}-${newLink.source.ontology_item_id}-${newLink.source.suggested}`
        ];
      newLink.target =
        nodeMap[
          `${newLink.target.label}-${newLink.target.ontology_item_id}-${newLink.target.suggested}`
        ];
      return newLink;
    })
    .keyBy("id")
    .value();

  return {
    nodes: aggregatedNodes,
    links: aggregatedLinks,
    relationships: getNodeNeighbors(aggregatedNodes, aggregatedLinks),
  };
}

/**
 * Removes orphan nodes (nodes not connected to any links) from the graph data.
 *
 * @param {Object} data - An object containing the nodes and links of the graph.
 * @returns {Object} An object containing the filtered nodes (excluding orphan nodes) and the original links.
 */
function removeOrphanNodes(data) {
  const { nodes, links } = data;

  // Check if there are no links, return empty nodes and links
  if (!links || Object.keys(links).length === 0) {
    return {
      nodes: {},
      links: {},
    };
  }

  // Create a set of node ids that are part of a link
  const linkedNodeIds = new Set();
  for (const linkId in links) {
    const link = links[linkId];
    linkedNodeIds.add(link.source?.id ?? link.source);
    linkedNodeIds.add(link.target?.id ?? link.target);
  }

  // Create a new object containing only the nodes that are part of a link
  const filteredNodes = Object.values(nodes).reduce((filtered, node) => {
    if (linkedNodeIds.has(node.id)) {
      filtered[node.id] = node;
    }
    return filtered;
  }, {});

  // Remove orphan links (links without valid source and target nodes)
  const filteredLinks = Object.values(links).reduce((filtered, link) => {
    const sourceId = link.source?.id ?? link.source;
    const targetId = link.target?.id ?? link.target;

    if (linkedNodeIds.has(sourceId) && linkedNodeIds.has(targetId)) {
      filtered[link.id] = link;
    }
    return filtered;
  }, {});

  return {
    nodes: filteredNodes,
    links: filteredLinks,
    relationships: getNodeNeighbors(filteredNodes, filteredLinks),
  };
}

/**
 * Filters out nodes and links based on whether their "ontology_item_id" is in a list of ids to exclude.
 * If nodes are filtered out, respective links on them are also removed.
 *
 * @param {Object} data - An object containing the nodes and links of the graph.
 * @param {Array} excludeOntologyItemIds - An array of ontology item ids to exclude from nodes and links.
 * @returns {Object} An object containing the filtered nodes and links.
 */
function excludeNodesAndLinksByOntologyItemIds(data, excludeOntologyItemIds) {
  const { nodes, links } = data;

  // Create a set of ontology item ids for faster lookups
  const excludeOntologyItemIdSet = new Set(excludeOntologyItemIds);

  // Filter nodes based on ontology_item_id
  const filteredNodes = Object.values(nodes).reduce((filtered, node) => {
    if (!excludeOntologyItemIdSet.has(node.ontology_item_id)) {
      filtered[node.id] = node;
    }
    return filtered;
  }, {});

  // Filter links based on ontology_item_id and whether source and target nodes are in filteredNodes
  const filteredLinks = {};
  for (const linkId in links) {
    const link = links[linkId];
    if (
      !excludeOntologyItemIdSet.has(link.ontology_item_id) &&
      filteredNodes[link.source?.id ?? link.source] &&
      filteredNodes[link.target?.id ?? link.target]
    ) {
      filteredLinks[linkId] = link;
    }
  }
  return {
    nodes: filteredNodes,
    links: filteredLinks,
    relationships: getNodeNeighbors(filteredNodes, filteredLinks),
  };
}

// Main function to filter data
export function filterData(data, options = {}) {
  const {
    searchTerm = "",
    quality = 2,
    show_orphans = true,
    exclude_ontology_item_ids = [],
    aggregate = false,
  } = options;

  let filteredData = { ...data };

  if (searchTerm) {
    filteredData = filterGraphByLabel(filteredData, searchTerm);
  }

  if (exclude_ontology_item_ids.length > 0) {
    filteredData = excludeNodesAndLinksByOntologyItemIds(
      filteredData,
      exclude_ontology_item_ids
    );
  }

  if ([0, 1].includes(quality)) {
    filteredData = filterGraphByQuality(filteredData, quality);
  }

  if (!show_orphans) {
    filteredData = removeOrphanNodes(filteredData);
  }

  if (aggregate) {
    filteredData = aggregateGraph(filteredData);
  }
  return filteredData;
}
