import { useState, useCallback, useRef } from 'react';
import type {
  Connection,
  EdgeChange,
  NodeChange,
  ReactFlowInstance,
  Node,
  Edge
} from '@xyflow/react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  Controls,
  addEdge,
  MiniMap,
  Background
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast, Toaster } from 'sonner';

export default function App() {
  // This keeps track of all the nodes data in the flow
  const [nodes, setNodes] = useState<Node[]>([]);
  // this holds all the edges in the flow
  const [edges, setEdges] = useState<Edge[]>([]);
  // state to change the node data by capturing the node id here when it is clicked.
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Ref to keep track of the react flow instance
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  // Reference to the React Flow wrapper element (used to get the position with reference to the canvas instead of from viewport(clientX or clientY))
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);

  // function for generating unique node IDs
  let id = 0;
  const getId = () => `node_${id++}`;

  // other node types can be added in future according to the requirements and log this nodes array to drag and drop respective node types.

  const NODE_TYPES = [
    {
      type: "default",
      label: "Message Node",
    },
  ];

  // capture the node id when it is clicked and open settings panel to change data.
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setSelectedNodeId(node.id);
  }, []);

  // updating the node label using the selected node id
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
  };

  // Get the currently selected node object from the list
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  // React Flow event handlers
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  // Handle drop to add a new node from external panel
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // If no type is present, exit (invalid drop)
      if (!type) return;

      // Get the position of the drop relative to canvas
      const position =
        reactFlowBounds &&
        reactFlowInstance?.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top
        });

      if (position) {
        const newNode: Node = {
          id: getId(),
          type,
          position,
          data: { label: `${id} Node` }
        };
        setNodes((prev) => [...prev, newNode]);
      }
    },
    [reactFlowInstance]
  );

  // Drag function
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // handle save Logic
  const handleSave = () => {
    // nodes without an incoming edge
    const nodesWithNoIncoming = nodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id)
    );

    // if mode than 1 node has an empty taget handle, throw an error toast or else successfully saved toast.
    if (nodes.length > 1 && nodesWithNoIncoming.length > 1) {
      toast('Failed to save the flow', {
        description: 'More than one node has an empty target handle!'
      });
    } else {
      toast('Flow saved successfully', {
        description: 'Continue working!!'
      });
    }
  };

  return (
    <div className="text-white">
      {/* Toast notification provider*/}
      <Toaster />
      <h1 className="text-2xl md:text-3xl font-bold text-gray-50 bg-slate-800 py-5 text-center">
        Flow builder for Chatbots
      </h1>

      <div className="flex w-[100vw] h-[100vh]">
        {/* react flow canvas */}
        <div
          className="flex w-[75vw]"
          ref={reactFlowWrapper}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            colorMode="dark"
            className="text-black"
            onInit={setReactFlowInstance}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Controls />
            <Background gap={20} size={2} />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Side Panel or settings panel */}
        <div className="flex flex-col items-center w-[25vw] bg-neutral-800 p-5 gap-4">
          {/* Settings Panel (you can see it when a node is selected/clicked) */}
          {selectedNode ? (
            <>
              <h2 className="text-gray-300 font-bold text-xl">Settings Panel</h2>
              <hr className="border-[1] mt-2 border-gray-500 w-full opacity-50" />
              <label className="text-gray-200 mb-2">Edit Node Text:</label>
              <input
                type="text"
                value={selectedNode?.data?.label as string}
                onChange={handleLabelChange}
                className="px-2 py-1 rounded bg-gray-700 text-white"
              />
              <button
                className="mt-4 px-4 py-2 bg-slate-900 shadow-slate-500 shadow-2xl hover:cursor-pointer transition-all duration-200 rounded text-white hover:bg-slate-800"
                onClick={() => setSelectedNodeId(null)}
              >
                Save name
              </button>
            </>
          ) : (
            <>
              {/* Nodes Panel */}
              <h2 className="text-gray-300 font-bold text-xl">Nodes Panel</h2>
              <hr className="border-[1] mt-2 border-gray-500 w-full opacity-50" />

              {/* Save */}
              <button
                className="mb-4 hover:cursor-pointer transition-all duration-200 px-4 py-2 bg-green-700 rounded text-white hover:bg-green-600 w-full"
                onClick={handleSave}
              >
                Save Flow
              </button>

              {/* Drag-and-drop button */}
              {NODE_TYPES.map((node) => (
  <button
    key={node.type}
    onDragStart={(event) => {
      event.dataTransfer.setData('application/reactflow', node.type);
      event.dataTransfer.effectAllowed = 'move';
    }}
    draggable
    className="mt-4 px-4 py-2 bg-gray-700 rounded text-white hover:bg-gray-600 cursor-grab flex items-center gap-2"
  >
    {`+ Drag ${node.label} from here`}
  </button>
))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
