import React, { useState, useRef, useCallback } from 'react';
import { Plus, Download, Upload, Trash2, Edit3, Save, X } from 'lucide-react';

const SkillTreeEditor = () => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [editingConnection, setEditingConnection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showCheckboxes, setShowCheckboxes] = useState(true);
  const svgRef = useRef(null);

  // Helper function to calculate text width (approximate)
  const getTextWidth = (text, fontSize = 10) => {
    return text.length * fontSize * 0.6;
  };

  // Helper function to calculate node radius based on text
  const getNodeRadius = (title) => {
    const textWidth = getTextWidth(title, 10);
    const minRadius = 25;
    const maxRadius = 60;
    const calculatedRadius = Math.max(minRadius, (textWidth / 2) + 10);
    return Math.min(maxRadius, calculatedRadius);
  };

  // Helper function to get mouse position relative to SVG
  const getSVGMousePosition = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Helper function to wrap text for descriptions
  const wrapText = (text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = getTextWidth(testLine, 9);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const addNode = (x, y) => {
    const newNode = {
      id: Date.now(),
      x: x || 400,
      y: y || 300,
      title: 'New Skill',
      description: 'Skill description',
      color: '#4f46e5',
      tier: 1,
      completed: false
    };
    setNodes([...nodes, newNode]);
    setEditingNode(newNode.id);
  };

  const updateNode = (id, updates) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter(node => node.id !== id));
    setConnections(connections.filter(conn => 
      conn.from !== id && conn.to !== id
    ));
    setSelectedNode(null);
  };

  const startConnection = (nodeId) => {
    setConnecting(nodeId);
  };

  const completeConnection = (nodeId) => {
    if (connecting && connecting !== nodeId) {
      // Check if connection already exists
      const existingConnection = connections.find(conn => 
        (conn.from === connecting && conn.to === nodeId) ||
        (conn.from === nodeId && conn.to === connecting)
      );
      
      if (!existingConnection) {
        const newConnection = {
          id: Date.now(),
          from: connecting,
          to: nodeId,
          color: '#6b7280',
          bidirectional: false,
          strokeWidth: 2,
          style: 'solid' // solid, dashed, dotted
        };
        setConnections([...connections, newConnection]);
      }
    }
    setConnecting(null);
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const mousePos = getSVGMousePosition(e);
    const node = nodes.find(n => n.id === nodeId);
    
    setDraggedNode(nodeId);
    setDragOffset({
      x: mousePos.x - node.x,
      y: mousePos.y - node.y
    });
    setSelectedNode(nodeId);
  };

  const handleMouseMove = (e) => {
    if (draggedNode) {
      const mousePos = getSVGMousePosition(e);
      updateNode(draggedNode, {
        x: mousePos.x - dragOffset.x,
        y: mousePos.y - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleSVGDoubleClick = (e) => {
    if (e.target === svgRef.current) {
      const mousePos = getSVGMousePosition(e);
      addNode(mousePos.x, mousePos.y);
    }
  };

  const toggleNodeCompletion = (nodeId) => {
    updateNode(nodeId, { completed: !nodes.find(n => n.id === nodeId).completed });
  };

  const updateConnection = (id, updates) => {
    setConnections(connections.map(conn => 
      conn.id === id ? { ...conn, ...updates } : conn
    ));
  };

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    
    if (connecting) {
      completeConnection(nodeId);
    } else {
      setSelectedNode(nodeId);
    }
  };

  const exportSVG = () => {
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElement);
      
      // Add XML declaration and make it standalone
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
      
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'skill-tree.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const saveTree = () => {
    try {
      const treeData = { nodes, connections };
      const dataStr = JSON.stringify(treeData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'skill-tree.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed. Please try again.');
    }
  };

  const loadTree = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const treeData = JSON.parse(e.target.result);
          setNodes(treeData.nodes || []);
          setConnections(treeData.connections || []);
          setSelectedNode(null);
          setConnecting(null);
          setEditingNode(null);
        } catch (error) {
          console.error('Load failed:', error);
          alert('Error loading file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
  };

  const getConnectionPath = (connection) => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);
    if (!fromNode || !toNode) return '';
    
    const fromRadius = getNodeRadius(fromNode.title);
    const toRadius = getNodeRadius(toNode.title);
    
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate start and end points on the edge of circles
    const startX = fromNode.x + (dx / distance) * fromRadius;
    const startY = fromNode.y + (dy / distance) * fromRadius;
    const endX = toNode.x - (dx / distance) * toRadius;
    const endY = toNode.y - (dy / distance) * toRadius;
    
    // Control point for curved line
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 - distance * 0.1;
    
    return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  };

  const getConnectionStyle = (connection) => {
    const style = connection.style || 'solid';
    switch (style) {
      case 'dashed':
        return '8,4';
      case 'dotted':
        return '2,2';
      default:
        return 'none';
    }
  };

  const deleteConnection = (connId) => {
    setConnections(connections.filter(conn => conn.id !== connId));
  };

  const renderNodeDescription = (node) => {
    if (!showDescriptions) return null;
    
    const radius = getNodeRadius(node.title);
    const boxWidth = 200;
    const boxHeight = 120;
    const padding = 10;
    const lineHeight = 12;
    
    // Position the description box to the right of the node
    const boxX = node.x + radius + 20;
    const boxY = node.y - boxHeight / 2;
    
    // Wrap the description text
    const descriptionLines = wrapText(node.description, boxWidth - padding * 2);
    
    // Get prerequisites and unlocks
    const prerequisites = connections.filter(conn => conn.to === node.id);
    const unlocks = connections.filter(conn => conn.from === node.id);
    
    return (
      <g key={`desc-${node.id}`}>
        {/* Background box */}
        <rect
          x={boxX}
          y={boxY}
          width={boxWidth}
          height={boxHeight}
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="1"
          rx="6"
          filter="url(#dropShadow)"
        />
        
        {/* Header */}
        <rect
          x={boxX}
          y={boxY}
          width={boxWidth}
          height={25}
          fill={node.color}
          rx="6"
        />
        <rect
          x={boxX}
          y={boxY + 19}
          width={boxWidth}
          height={6}
          fill={node.color}
        />
        
        {/* Title */}
        <text
          x={boxX + padding}
          y={boxY + 16}
          fill="white"
          fontSize="11"
          fontWeight="bold"
        >
          {node.title} (Tier {node.tier})
        </text>
        
        {/* Description */}
        <text
          x={boxX + padding}
          y={boxY + 40}
          fill="#374151"
          fontSize="9"
          fontWeight="bold"
        >
          Description:
        </text>
        
        {descriptionLines.map((line, index) => (
          <text
            key={index}
            x={boxX + padding}
            y={boxY + 52 + index * lineHeight}
            fill="#6b7280"
            fontSize="9"
          >
            {line}
          </text>
        ))}
        
        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <>
            <text
              x={boxX + padding}
              y={boxY + 85}
              fill="#374151"
              fontSize="9"
              fontWeight="bold"
            >
              Prerequisites:
            </text>
            {prerequisites.slice(0, 2).map((conn, index) => {
              const prereqNode = nodes.find(n => n.id === conn.from);
              if (!prereqNode) return null;
              return (
                <text
                  key={conn.id}
                  x={boxX + padding}
                  y={boxY + 97 + index * 10}
                  fill="#6b7280"
                  fontSize="8"
                >
                  • {prereqNode.title}
                </text>
              );
            })}
            {prerequisites.length > 2 && (
              <text
                x={boxX + padding}
                y={boxY + 97 + 2 * 10}
                fill="#6b7280"
                fontSize="8"
              >
                • +{prerequisites.length - 2} more...
              </text>
            )}
          </>
        )}
        
        {/* Unlocks */}
        {unlocks.length > 0 && prerequisites.length === 0 && (
          <>
            <text
              x={boxX + padding}
              y={boxY + 85}
              fill="#374151"
              fontSize="9"
              fontWeight="bold"
            >
              Unlocks:
            </text>
            {unlocks.slice(0, 2).map((conn, index) => {
              const unlockNode = nodes.find(n => n.id === conn.to);
              if (!unlockNode) return null;
              return (
                <text
                  key={conn.id}
                  x={boxX + padding}
                  y={boxY + 97 + index * 10}
                  fill="#6b7280"
                  fontSize="8"
                >
                  • {unlockNode.title}
                </text>
              );
            })}
            {unlocks.length > 2 && (
              <text
                x={boxX + padding}
                y={boxY + 97 + 2 * 10}
                fill="#6b7280"
                fontSize="8"
              >
                • +{unlocks.length - 2} more...
              </text>
            )}
          </>
        )}
        
        {/* Connecting line from node to description */}
        <line
          x1={node.x + radius}
          y1={node.y}
          x2={boxX}
          y2={boxY + boxHeight / 2}
          stroke="#d1d5db"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      </g>
    );
  };

  const EditNodeModal = ({ node, onClose, onSave }) => {
    const [title, setTitle] = useState(node.title);
    const [description, setDescription] = useState(node.description);
    const [color, setColor] = useState(node.color);
    const [tier, setTier] = useState(node.tier);
    const [completed, setCompleted] = useState(node.completed);

    const handleSave = () => {
      onSave(node.id, { title, description, color, tier: parseInt(tier), completed });
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Edit Skill</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 border rounded-md cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tier</label>
              <input
                type="number"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                min="1"
                max="10"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium">Completed</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditConnectionModal = ({ connection, onClose, onSave }) => {
    const [color, setColor] = useState(connection.color);
    const [bidirectional, setBidirectional] = useState(connection.bidirectional);
    const [strokeWidth, setStrokeWidth] = useState(connection.strokeWidth);
    const [style, setStyle] = useState(connection.style);

    const handleSave = () => {
      onSave(connection.id, { color, bidirectional, strokeWidth: parseInt(strokeWidth), style });
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Edit Connection</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 border rounded-md cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Stroke Width</label>
              <input
                type="number"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(e.target.value)}
                min="1"
                max="10"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={bidirectional}
                  onChange={(e) => setBidirectional(e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium">Bidirectional (no arrows)</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center space-x-4">
        <button
          onClick={() => addNode()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Add Skill</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={loadTree}
            className="hidden"
            id="load-file"
          />
          <label
            htmlFor="load-file"
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 cursor-pointer"
          >
            <Upload size={16} />
            <span>Load</span>
          </label>
          
          <button
            onClick={saveTree}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Save size={16} />
            <span>Save</span>
          </button>
          
          <button
            onClick={exportSVG}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Download size={16} />
            <span>Export SVG</span>
          </button>
        </div>
        
        <button
          onClick={() => setShowCheckboxes(!showCheckboxes)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          {showCheckboxes ? 'Hide' : 'Show'} Checkboxes
        </button>
        
        <button
          onClick={() => setShowDescriptions(!showDescriptions)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          {showDescriptions ? 'Hide' : 'Show'} Descriptions
        </button>
        
        {selectedNode && (
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={() => setEditingNode(selectedNode)}
              className="flex items-center space-x-2 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => startConnection(selectedNode)}
              className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {connecting ? 'Cancel' : 'Connect'}
            </button>
            <button
              onClick={() => deleteNode(selectedNode)}
              className="flex items-center space-x-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
        
        {connecting && (
          <div className="ml-auto bg-blue-100 px-4 py-2 rounded-md">
            <span className="text-blue-800 font-medium">Click another skill to connect</span>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800">
        Double-click empty space to add a skill • Click to select • Drag to move • Right-click connections to delete • Double-click connections to edit
      </div>
      
      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="bg-gray-50"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleSVGDoubleClick}
          onClick={() => {
            setSelectedNode(null);
            setConnecting(null);
          }}
        >
          {/* Definitions */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
            </marker>
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#00000020"/>
            </filter>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Connections */}
          {connections.map(conn => (
            <path
              key={conn.id}
              d={getConnectionPath(conn)}
              stroke={conn.color || '#6b7280'}
              strokeWidth={conn.strokeWidth || 2}
              strokeDasharray={getConnectionStyle(conn)}
              fill="none"
              markerEnd={conn.bidirectional ? 'none' : 'url(#arrowhead)'}
              className="cursor-pointer hover:opacity-70"
              onContextMenu={(e) => {
                e.preventDefault();
                deleteConnection(conn.id);
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingConnection(conn.id);
              }}
            />
          ))}
          
          {/* Node descriptions (render first so they appear behind nodes) */}
          {selectedNode && showDescriptions && (
            (() => {
              const node = nodes.find(n => n.id === selectedNode);
              return node ? renderNodeDescription(node) : null;
            })()
          )}
          
          {/* Nodes */}
          {nodes.map(node => {
            const radius = getNodeRadius(node.title);
            const fontSize = Math.min(10, radius / 3);
            const isCompleted = node.completed || false;
            
            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={isCompleted ? node.color : node.color + '80'}
                  stroke={selectedNode === node.id ? '#fbbf24' : connecting === node.id ? '#ef4444' : '#374151'}
                  strokeWidth={selectedNode === node.id ? 3 : 2}
                  className="cursor-move hover:opacity-80"
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => handleNodeClick(e, node.id)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingNode(node.id);
                  }}
                />
                
                {/* Checkmark for completed skills */}
                {isCompleted && (
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={fontSize + 2}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    ✓
                  </text>
                )}
                
                {/* Skill title (only show if not completed or if title is short) */}
                {(!isCompleted || node.title.length <= 8) && (
                  <text
                    x={node.x}
                    y={isCompleted ? node.y + 12 : node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={isCompleted ? fontSize - 1 : fontSize}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {node.title}
                  </text>
                )}
                
                <text
                  x={node.x}
                  y={node.y + radius + 15}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="8"
                  className="pointer-events-none select-none"
                >
                  Tier {node.tier}
                </text>
                
                {/* Completion checkbox */}
                {showCheckboxes && (
                  <g>
                    <rect
                      x={node.x + radius - 8}
                      y={node.y - radius + 4}
                      width="12"
                      height="12"
                      fill="white"
                      stroke="#374151"
                      strokeWidth="1"
                      rx="2"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNodeCompletion(node.id);
                      }}
                    />
                    {isCompleted && (
                      <text
                        x={node.x + radius - 2}
                        y={node.y - radius + 12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#22c55e"
                        fontSize="10"
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                      >
                        ✓
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Edit Node Modal */}
      {editingNode && (
        <EditNodeModal
          node={nodes.find(n => n.id === editingNode)}
          onClose={() => setEditingNode(null)}
          onSave={updateNode}
        />
      )}
      
      {/* Edit Connection Modal */}
      {editingConnection && (
        <EditConnectionModal
          connection={connections.find(c => c.id === editingConnection)}
          onClose={() => setEditingConnection(null)}
          onSave={updateConnection}
        />
      )}
    </div>
  );
};

export default SkillTreeEditor;