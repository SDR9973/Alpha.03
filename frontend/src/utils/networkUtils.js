// src/utils/networkUtils.js

/**
 * Standardize graph data to ensure consistent format
 * @param {object} graphData - Network graph data
 * @returns {object} Standardized graph data
 */
export const standardizeGraphData = (graphData) => {
  if (!graphData || !graphData.nodes || !graphData.links) {
    return graphData;
  }

  // Create a map of nodes for quick lookups
  const nodeMap = {};
  graphData.nodes.forEach((node) => {
    nodeMap[node.id] = node;
  });

  // Process links to use string IDs consistently
  const standardizedLinks = graphData.links.map((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    // Ensure source and target nodes exist
    if (!nodeMap[sourceId] || !nodeMap[targetId]) {
      console.warn(`Invalid link: source=${sourceId}, target=${targetId}`);
    }

    return {
      source: String(sourceId),
      target: String(targetId),
      weight: link.weight || 1,
    };
  });

  // Process nodes to ensure consistent format
  const standardizedNodes = graphData.nodes.map(node => ({
    ...node,
    id: String(node.id),
  }));

  return {
    nodes: standardizedNodes,
    links: standardizedLinks,
  };
};

/**
 * Calculate node degree for all nodes in a graph
 * @param {Array} nodes - Array of network nodes
 * @param {Array} links - Array of network links
 * @returns {Array} Nodes with degree property added
 */
export const calculateNodeDegree = (nodes, links) => {
  const degreeMap = {};

  // Initialize all nodes with degree 0
  nodes.forEach((node) => {
    degreeMap[node.id] = 0;
  });

  // Count links for each node
  links.forEach((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    degreeMap[sourceId] = (degreeMap[sourceId] || 0) + 1;
    degreeMap[targetId] = (degreeMap[targetId] || 0) + 1;
  });

  // Add degree property to nodes
  return nodes.map((node) => ({
    ...node,
    degree: degreeMap[node.id] || 0,
  }));
};

/**
 * Calculate network density
 * @param {Array} nodes - Array of network nodes
 * @param {Array} links - Array of network links
 * @returns {number} Network density (0-1)
 */
export const calculateDensity = (nodes, links) => {
  const n = nodes.length;
  const m = links.length;

  if (n < 2) return 0;
  return (2 * m) / (n * (n - 1));
};

/**
 * Filter network data based on various criteria
 * @param {object} networkData - Original network data
 * @param {object} filters - Filter criteria
 * @returns {object} Filtered network data
 */
export const filterNetworkData = (networkData, filters = {}) => {
  if (!networkData || !networkData.nodes || !networkData.links) {
    return networkData;
  }

  let filteredNodes = [...networkData.nodes];

  // Filter nodes based on text search
  if (filters.textFilter) {
    const searchTerm = filters.textFilter.toLowerCase();
    filteredNodes = filteredNodes.filter((node) =>
      String(node.id).toLowerCase().includes(searchTerm)
    );
  }

  // Filter nodes by community
  if (filters.community !== undefined && filters.community !== null) {
    filteredNodes = filteredNodes.filter((node) =>
      node.community === filters.community
    );
  }

  // Filter nodes by minimum degree
  if (filters.minDegree !== undefined && filters.minDegree !== null) {
    filteredNodes = filteredNodes.filter((node) =>
      (node.degree || 0) >= filters.minDegree
    );
  }

  // Filter nodes by betweenness centrality threshold
  if (filters.betweennessThreshold !== undefined && filters.betweennessThreshold !== null) {
    filteredNodes = filteredNodes.filter((node) =>
      (node.betweenness || 0) >= filters.betweennessThreshold
    );
  }

  // Create a set of filtered node IDs for quick lookups
  const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

  // Filter links to only include those between filtered nodes
  const filteredLinks = networkData.links.filter((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    return filteredNodeIds.has(String(sourceId)) && filteredNodeIds.has(String(targetId));
  });

  // Filter links by minimum weight if specified
  if (filters.minWeight !== undefined && filters.minWeight !== null) {
    filteredLinks = filteredLinks.filter((link) =>
      (link.weight || 1) >= filters.minWeight
    );
  }

  return {
    nodes: filteredNodes,
    links: filteredLinks,
  };
};

/**
 * Merge multiple network graphs into a single graph
 * @param {Array} graphDataArray - Array of network graph data objects
 * @returns {object} Merged network graph
 */
export const mergeNetworkGraphs = (graphDataArray) => {
  if (!graphDataArray || graphDataArray.length === 0) {
    return { nodes: [], links: [] };
  }

  const mergedNodes = new Map();
  const mergedLinks = new Map();

  // Process each graph
  graphDataArray.forEach((graph, graphIndex) => {
    if (!graph || !graph.nodes || !graph.links) return;

    // Add nodes with graph source information
    graph.nodes.forEach(node => {
      const nodeId = String(node.id);
      if (!mergedNodes.has(nodeId)) {
        mergedNodes.set(nodeId, {
          ...node,
          id: nodeId,
          sourcedFrom: [graphIndex],
        });
      } else {
        const existingNode = mergedNodes.get(nodeId);
        existingNode.sourcedFrom.push(graphIndex);
        // Merge other properties if needed
        if (node.degree && (!existingNode.degree || node.degree > existingNode.degree)) {
          existingNode.degree = node.degree;
        }
        if (node.betweenness && (!existingNode.betweenness || node.betweenness > existingNode.betweenness)) {
          existingNode.betweenness = node.betweenness;
        }
        mergedNodes.set(nodeId, existingNode);
      }
    });

    // Add links with graph source information
    graph.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? String(link.source.id) : String(link.source);
      const targetId = typeof link.target === 'object' ? String(link.target.id) : String(link.target);
      const linkKey = [sourceId, targetId].sort().join('_');

      if (!mergedLinks.has(linkKey)) {
        mergedLinks.set(linkKey, {
          source: sourceId,
          target: targetId,
          weight: link.weight || 1,
          sourcedFrom: [graphIndex],
        });
      } else {
        const existingLink = mergedLinks.get(linkKey);
        existingLink.sourcedFrom.push(graphIndex);

        // Sum weights when merging links
        existingLink.weight = (existingLink.weight || 1) + (link.weight || 1);
        mergedLinks.set(linkKey, existingLink);
      }
    });
  });

  return {
    nodes: Array.from(mergedNodes.values()),
    links: Array.from(mergedLinks.values()),
  };
};

/**
 * Generate a color scale for visualizing metrics
 * @param {string} colorScheme - Name of color scheme to use
 * @returns {Array} Array of hex color codes
 */
export const getColorScheme = (colorScheme = 'default') => {
  const colorSchemes = {
    default: ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#0099C6'],
    pastel: ['#FFB6C1', '#AFEEEE', '#FFFACD', '#98FB98', '#D8BFD8', '#DDA0DD'],
    vivid: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
    monochrome: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF'],
    colorful: ['#E41A1C', '#377EB8', '#4DAF4A', '#984EA3', '#FF7F00', '#FFFF33'],
    sequential: ['#FEF0D9', '#FDD49E', '#FDBB84', '#FC8D59', '#E34A33', '#B30000'],
    netxplore: ['#313659', '#5f6289', '#324b4a', '#158582', '#9092bc', '#c4c6f1'],
  };

  return colorSchemes[colorScheme] || colorSchemes.default;
};

/**
 * Interpolate between two colors
 * @param {string} color1 - Start color in hex format
 * @param {string} color2 - End color in hex format
 * @param {number} ratio - Interpolation ratio (0-1)
 * @returns {string} Interpolated color in hex format
 */
export const interpolateColor = (color1, color2, ratio) => {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

/**
 * Apply visualization settings to network data
 * @param {object} networkData - Network graph data
 * @param {object} settings - Visualization settings
 * @returns {object} Network data with visualization attributes
 */
export const applyVisualizationSettings = (networkData, settings) => {
  if (!networkData || !networkData.nodes || !networkData.links) {
    return networkData;
  }

  const customizedNodes = JSON.parse(JSON.stringify(networkData.nodes));
  const customizedLinks = JSON.parse(JSON.stringify(networkData.links));

  // Apply node size and color settings
  for (const node of customizedNodes) {
    let nodeSize = settings.nodeSizes.min;
    let nodeColor = settings.customColors.defaultNodeColor;

    // Size nodes based on selected metric
    const sizeByValue = (metric) => {
      const maxVal = Math.max(...customizedNodes.map((n) => n[metric] || 0));
      const ratio = maxVal > 0 ? (node[metric] || 0) / maxVal : 0;
      return settings.nodeSizes.min + ratio * (settings.nodeSizes.max - settings.nodeSizes.min);
    };

    if (settings.sizeBy === 'messages') nodeSize = sizeByValue('messages');
    else if (settings.sizeBy === 'degree') nodeSize = sizeByValue('degree');
    else if (settings.sizeBy === 'betweenness') nodeSize = sizeByValue('betweenness');
    else if (settings.sizeBy === 'pagerank') nodeSize = sizeByValue('pagerank');

    // Color nodes based on selected metric or community
    if (settings.colorBy === 'community' && node.community !== undefined) {
      const communityId = parseInt(node.community, 10);
      nodeColor = settings.communityColors?.[communityId] ??
        settings.customColors.communityColors[communityId % settings.customColors.communityColors.length];
    } else if (settings.colorBy === 'degree') {
      const maxDegree = Math.max(...customizedNodes.map((n) => n.degree || 0));
      const ratio = maxDegree > 0 ? (node.degree || 0) / maxDegree : 0;
      nodeColor = interpolateColor('#ffefca', settings.customColors.defaultNodeColor, ratio);
    } else if (settings.colorBy === 'betweenness') {
      const maxBtw = Math.max(...customizedNodes.map((n) => n.betweenness || 0));
      const ratio = maxBtw > 0 ? (node.betweenness || 0) / maxBtw : 0;
      nodeColor = interpolateColor('#ffefca', '#FF5733', ratio);
    } else if (settings.colorBy === 'pagerank') {
      const maxPR = Math.max(...customizedNodes.map((n) => n.pagerank || 0));
      const ratio = maxPR > 0 ? (node.pagerank || 0) / maxPR : 0;
      nodeColor = interpolateColor('#ffefca', '#3366CC', ratio);
    } else if (settings.colorBy === 'custom' && settings.highlightUsers.includes(node.id)) {
      nodeColor = settings.customColors.highlightNodeColor;
    }

    // Highlight nodes from specific communities if requested
    if (settings.highlightCommunities?.includes(parseInt(node.community, 10))) {
      node.isHighlightedCommunity = true;
    } else {
      node.isHighlightedCommunity = false;
    }

    // Highlight important nodes based on centrality metrics
    if (settings.showImportantNodes) {
      const threshold = settings.importantNodesThreshold || 0.5;
      const maxBetweenness = Math.max(...customizedNodes.map((n) => n.betweenness || 0));
      const maxPageRank = Math.max(...customizedNodes.map((n) => n.pagerank || 0));

      const isImportant = (node.betweenness / maxBetweenness > threshold) ||
                          (node.pagerank / maxPageRank > threshold);

      if (isImportant) {
        nodeColor = settings.customColors.highlightNodeColor;
        nodeSize = Math.max(nodeSize, settings.nodeSizes.max * 0.8);
      }
    }

    // Apply calculated size and color
    node.size = nodeSize;
    node.color = nodeColor;
  }

  return {
    nodes: customizedNodes,
    links: customizedLinks,
  };
};