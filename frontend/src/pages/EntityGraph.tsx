import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Move,
  Info,
  Settings,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw
} from 'lucide-react';
import { getEntityRelationships, getDateRange } from '../services/api';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  data: any;
  size: number;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    incidentNodes: number;
    entityNodes: number;
  };
}

interface FilterState {
  startDate: string;
  endDate: string;
  severity: string[];
  category: string[];
  source: string[];
  nodeTypes: string[];
}

const EntityGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dateRange, setDateRange] = useState({ min: '', max: '', suggested_start: '', suggested_end: '' });

  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    severity: [],
    category: [],
    source: [],
    nodeTypes: []
  });

  const [visualization, setVisualization] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    showLabels: true,
    physics: true,
    linkDistance: 100,
    charge: -300
  });

  const [simulation, setSimulation] = useState<any>(null);

  useEffect(() => {
    fetchDateRange();
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [filters]);

  useEffect(() => {
    if (graphData && canvasRef.current) {
      initializeVisualization();
    }
  }, [graphData, visualization.physics]);

  const fetchDateRange = async () => {
    try {
      const response = await getDateRange();
      const range = response.data;
      setDateRange(range);

      if (!filters.startDate && !filters.endDate) {
        setFilters(prev => ({
          ...prev,
          startDate: range.suggested_start || range.min,
          endDate: range.suggested_end || range.max
        }));
      }
    } catch (error) {
      console.error('Failed to fetch date range:', error);
    }
  };

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        severity: filters.severity.length ? filters.severity.join(',') : undefined,
        category: filters.category.length ? filters.category.join(',') : undefined,
        source: filters.source.length ? filters.source.join(',') : undefined
      };

      // Get real data from API
      const response = await getEntityRelationships(params);
      let data = response.data;

      // Filter nodes by type if specified
      if (filters.nodeTypes.length > 0) {
        const filteredNodes = data.nodes.filter(node =>
          filters.nodeTypes.includes(node.type)
        );
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredEdges = data.edges.filter(edge =>
          nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );

        data = {
          ...data,
          nodes: filteredNodes,
          edges: filteredEdges
        };
      }

      setGraphData(data);
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
      setError('Failed to load graph data. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const initializeVisualization = () => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Simple force-directed layout simulation
    const nodes = graphData.nodes.map(node => ({
      ...node,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: 0,
      vy: 0
    }));

    const edges = graphData.edges;

    // Physics simulation
    let animationId: number;
    const animate = () => {
      if (!visualization.physics) {
        drawGraph(ctx, nodes, edges, rect.width, rect.height);
        return;
      }

      // Apply forces
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        // Repulsion between nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x! - nodeB.x!;
          const dy = nodeA.y! - nodeB.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = visualization.charge / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          nodeA.vx! += fx;
          nodeA.vy! += fy;
          nodeB.vx! -= fx;
          nodeB.vy! -= fy;
        }

        // Center force
        nodeA.vx! += (rect.width / 2 - nodeA.x!) * 0.001;
        nodeA.vy! += (rect.height / 2 - nodeA.y!) * 0.001;
      }

      // Apply edge forces
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDistance = visualization.linkDistance * edge.weight;
        const force = (distance - targetDistance) * 0.1;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        source.vx! += fx;
        source.vy! += fy;
        target.vx! -= fx;
        target.vy! -= fy;
      });

      // Update positions
      nodes.forEach(node => {
        node.vx! *= 0.9; // Damping
        node.vy! *= 0.9;
        node.x! += node.vx!;
        node.y! += node.vy!;

        // Boundary constraints
        node.x! = Math.max(node.size, Math.min(rect.width - node.size, node.x!));
        node.y! = Math.max(node.size, Math.min(rect.height - node.size, node.y!));
      });

      drawGraph(ctx, nodes, edges, rect.width, rect.height);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  };

  const drawGraph = (ctx: CanvasRenderingContext2D, nodes: GraphNode[], edges: GraphEdge[], width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(visualization.panX, visualization.panY);
    ctx.scale(visualization.zoom, visualization.zoom);

    // Draw edges
    ctx.globalAlpha = 0.6;
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x!, source.y!);
      ctx.lineTo(target.x!, target.y!);
      ctx.strokeStyle = edge.type === 'contains' ? '#8B5CF6' : '#64748B';
      ctx.lineWidth = edge.weight * 2;
      ctx.stroke();
    });

    // Draw nodes
    ctx.globalAlpha = 1;
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, node.size, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw labels
      if (visualization.showLabels && visualization.zoom > 0.5) {
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(10, node.size / 2)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(
          node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label,
          node.x!,
          node.y! + node.size + 15
        );
      }
    });

    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!graphData || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - visualization.panX) / visualization.zoom;
    const y = (event.clientY - rect.top - visualization.panY) / visualization.zoom;

    // Find clicked node
    const clickedNode = graphData.nodes.find(node => {
      if (!node.x || !node.y) return false;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'severity' | 'category' | 'source' | 'nodeTypes', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const getUniqueValues = (field: string) => {
    if (!graphData) return [];

    if (field === 'nodeTypes') {
      return [...new Set(graphData.nodes.map(node => node.type))];
    }

    return [...new Set(graphData.nodes
      .filter(node => node.type === 'incident')
      .map(node => {
        if (field === 'severity') return node.data.severity;
        if (field === 'category') return node.data.category;
        if (field === 'source') return node.data.source;
        return '';
      })
      .filter(Boolean)
    )];
  };

  const resetView = () => {
    setVisualization(prev => ({
      ...prev,
      zoom: 1,
      panX: 0,
      panY: 0
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Entity Relationship Graph</h1>
              <p className="text-slate-400">Interactive network visualization of entities and their relationships</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-700/50 hover:text-purple-400 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-700/50 hover:text-purple-400 transition-colors"
              >
                <Settings className="w-4 h-4" />
                View
                {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={fetchGraphData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500 text-purple-400 rounded-lg hover:bg-purple-600/30 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-900/30 border border-purple-800/30 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date From</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date To</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Node Types */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Node Types</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getUniqueValues('nodeTypes').map(type => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.nodeTypes.includes(type)}
                          onChange={() => toggleArrayFilter('nodeTypes', type)}
                          className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-400 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Severity Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
                  <div className="space-y-2">
                    {['low', 'medium', 'high', 'critical'].map(severity => (
                      <label key={severity} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.severity.includes(severity)}
                          onChange={() => toggleArrayFilter('severity', severity)}
                          className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-400 capitalize">{severity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getUniqueValues('category').map(category => (
                      <label key={category} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.category.includes(category)}
                          onChange={() => toggleArrayFilter('category', category)}
                          className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-400">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Source Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Source</label>
                  <div className="space-y-2">
                    {getUniqueValues('source').map(source => (
                      <label key={source} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.source.includes(source)}
                          onChange={() => toggleArrayFilter('source', source)}
                          className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-400">{source}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-6 p-4 bg-gray-900/30 border border-purple-800/30 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visualization.showLabels}
                    onChange={(e) => setVisualization(prev => ({ ...prev, showLabels: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
                  />
                  <label className="text-sm text-slate-300">Show Labels</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visualization.physics}
                    onChange={(e) => setVisualization(prev => ({ ...prev, physics: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
                  />
                  <label className="text-sm text-slate-300">Physics Simulation</label>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Link Distance</label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={visualization.linkDistance}
                    onChange={(e) => setVisualization(prev => ({ ...prev, linkDistance: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Node Repulsion</label>
                  <input
                    type="range"
                    min="-500"
                    max="-100"
                    value={visualization.charge}
                    onChange={(e) => setVisualization(prev => ({ ...prev, charge: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Graph Container */}
        <div className="flex-1 flex">
          {/* Main Graph */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : !graphData || graphData.nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Info className="w-12 h-12 mb-4" />
                <p>No data available for the selected filters</p>
                <p className="text-sm mt-2">Try adjusting your filter criteria</p>
              </div>
            ) : (
              <>
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-pointer"
                  onClick={handleCanvasClick}
                />

                {/* Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={() => setVisualization(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }))}
                    className="p-2 bg-gray-900/80 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-800/80 hover:text-purple-400 transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setVisualization(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }))}
                    className="p-2 bg-gray-900/80 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-800/80 hover:text-purple-400 transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetView}
                    className="p-2 bg-gray-900/80 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-800/80 hover:text-purple-400 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats */}
                <div className="absolute bottom-4 left-4 p-3 bg-gray-900/80 border border-gray-700/50 rounded-lg">
                  <div className="text-sm text-slate-300">
                    <div>{graphData.stats.totalNodes} nodes, {graphData.stats.totalEdges} edges</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {graphData.stats.incidentNodes} incidents, {graphData.stats.entityNodes} entities
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Side Panel */}
          {selectedNode && (
            <div className="w-80 bg-gray-900/30 border-l border-gray-800/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Node Details</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400">Type</div>
                  <div className="text-white capitalize">{selectedNode.type}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">Label</div>
                  <div className="text-white">{selectedNode.label}</div>
                </div>

                {selectedNode.type === 'incident' && (
                  <>
                    <div>
                      <div className="text-sm text-slate-400">Severity</div>
                      <div className={`inline-block px-2 py-1 rounded text-xs ${
                        selectedNode.data.severity === 'critical' ? 'bg-red-900/20 text-red-400' :
                        selectedNode.data.severity === 'high' ? 'bg-orange-900/20 text-orange-400' :
                        selectedNode.data.severity === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                        'bg-green-900/20 text-green-400'
                      }`}>
                        {selectedNode.data.severity.toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-slate-400">Category</div>
                      <div className="text-white">{selectedNode.data.category}</div>
                    </div>

                    <div>
                      <div className="text-sm text-slate-400">Date</div>
                      <div className="text-white">
                        {new Date(selectedNode.data.date).toLocaleDateString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-slate-400">Source</div>
                      <div className="text-white">{selectedNode.data.source}</div>
                    </div>
                  </>
                )}

                {selectedNode.type !== 'incident' && (
                  <>
                    <div>
                      <div className="text-sm text-slate-400">Name</div>
                      <div className="text-white">{selectedNode.data.name}</div>
                    </div>

                    <div>
                      <div className="text-sm text-slate-400">Entity Type</div>
                      <div className="text-white capitalize">{selectedNode.data.type}</div>
                    </div>
                  </>
                )}

                <div>
                  <div className="text-sm text-slate-400">ID</div>
                  <div className="text-xs text-slate-500 font-mono">{selectedNode.data.id}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntityGraph;
