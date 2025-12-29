import React, { useEffect, useState } from 'react';

const DependencyGraph = ({ tasks, refreshTrigger }) => {
  const [nodes, setNodes] = useState([]);

  const calculateLayout = () => {
    if (!tasks.length) {
        setNodes([]);
        return;
    }

    const levels = {};
    
    // Initialize
    tasks.forEach(t => levels[t.id] = 0);

    // Calculate levels (simple)
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
        // Clean undefined items in group just in case
        const validGroup = group.filter(item => item !== undefined);
        const segment = width / (validGroup.length + 1);
        
        validGroup.forEach((task, index) => {
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
    <div className="border border-gray-200 rounded-lg p-4 bg-white overflow-auto shadow-sm">
      <h2 className="text-lg font-bold mb-4 text-black">Dependency Graph</h2>
      {nodes.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center text-gray-400 border border-gray-100 rounded bg-gray-50">
              Graph will appear here when tasks are added
          </div>
      ) : (
          <svg width="800" height="500" className="bg-gray-50 border border-gray-200 rounded">
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
                        className="cursor-pointer hover:stroke-gray-600"
                    />
                    <text x={node.x} y={node.y + 35} textAnchor="middle" className="text-xs font-bold fill-black" style={{fill: 'black', fontWeight: 'bold'}}>
                        {node.title}
                    </text>
                     <text x={node.x} y={node.y + 5} textAnchor="middle" fill="white" className="text-xs pointer-events-none">
                        {node.id}
                    </text>
                </g>
            ))}
          </svg>
      )}
    </div>
  );
};

export default DependencyGraph;