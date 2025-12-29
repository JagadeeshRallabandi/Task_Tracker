import React, { useEffect, useState } from 'react';

const DependencyGraph = ({ tasks, refreshTrigger }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Simple layout algorithm: Assign levels based on dependency depth
  const calculateLayout = () => {
    if (!tasks.length) return;

    const levels = {};
    const processed = new Set();
    
    // Initialize
    tasks.forEach(t => levels[t.id] = 0);

    // Naive level calculation (repeat to propagate)
    for(let i=0; i<tasks.length; i++) {
        tasks.forEach(task => {
            task.dependencies.forEach(depId => {
                if (levels[depId] >= levels[task.id]) {
                    levels[task.id] = levels[depId] + 1;
                }
            });
        });
    }

    // Group by level
    const levelGroups = {};
    Object.entries(levels).forEach(([id, level]) => {
        if(!levelGroups[level]) levelGroups[level] = [];
        levelGroups[level].push(tasks.find(t => t.id === parseInt(id)));
    });

    // Calculate Coordinates
    const newNodes = [];
    const width = 800;
    const rowHeight = 100;

    Object.entries(levelGroups).forEach(([level, group]) => {
        const y = parseInt(level) * rowHeight + 50;
        const segment = width / (group.length + 1);
        group.forEach((task, index) => {
            newNodes.push({
                ...task,
                x: segment * (index + 1),
                y: y
            });
        });
    });

    setNodes(newNodes);
  };

  useEffect(() => {
    calculateLayout();
  }, [tasks, refreshTrigger]);

  const getStatusColor = (status) => {
    const colors = {
        pending: '#9CA3AF', // Gray
        in_progress: '#3B82F6', // Blue
        completed: '#10B981', // Green
        blocked: '#EF4444' // Red
    };
    return colors[status] || '#9CA3AF';
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 overflow-auto">
      <h2 className="text-lg font-bold mb-4">Dependency Graph</h2>
      <svg width="800" height="500" className="bg-white border shadow-sm">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
        </defs>
        
        {/* Edges */}
        {nodes.map(node => (
            node.dependencies.map(depId => {
                const target = nodes.find(n => n.id === depId);
                if (!target) return null;
                return (
                    <line 
                        key={`${node.id}-${depId}`}
                        x1={node.x} y1={node.y}
                        x2={target.x} y2={target.y}
                        stroke="#6B7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                    />
                );
            })
        ))}

        {/* Nodes */}
        {nodes.map(node => (
            <g key={node.id}>
                <circle 
                    cx={node.x} cy={node.y} r="20" 
                    fill={getStatusColor(node.status)} 
                    stroke="white" strokeWidth="2"
                />
                <text x={node.x} y={node.y + 35} textAnchor="middle" className="text-xs font-semibold">
                    {node.title}
                </text>
                 <text x={node.x} y={node.y + 5} textAnchor="middle" fill="white" className="text-xs">
                    {node.id}
                </text>
            </g>
        ))}
      </svg>
    </div>
  );
};

export default DependencyGraph;