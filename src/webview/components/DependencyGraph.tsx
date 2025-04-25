import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Position,
  useNodesState,
  useEdgesState,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { validateDependencies, ValidationError } from '../../utils/validateDependencies';

interface DependencyData {
  importsDeclarations: string[];
  reverseImports: string[];
}

interface GraphProps {
  data: Record<string, DependencyData>;
}

const DependencyGraphComponent: React.FC<GraphProps> = ({ data }) => {
  try {
    // Валидируем данные
    validateDependencies(data);

    // Создаем узлы и связи
    const initialNodes: Node[] = Object.keys(data).map((filePath, index) => {
      const endName = filePath.split('/');
      const name = endName.at(-1)?.split('.')[0] === 'index' ? endName.at(-2) : endName.at(-1);
      return {
        id: filePath,
        data: { label: name || filePath },
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        style: {
          background: '#69b3a2',
          color: '#fff',
          border: '2px solid #fff',
          borderRadius: '5px',
          padding: '10px',
          width: 'auto',
          height: 'auto',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      };
    });

    const initialEdges: Edge[] = Object.entries(data).flatMap(([source, deps]) => [
      ...deps.importsDeclarations.map(target => ({
        id: `${source}-${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#999' }
      })),
      ...deps.reverseImports.map(target => ({
        id: `${target}-${source}`,
        source: target,
        target: source,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#999' }
      }))
    ]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onLayout = useCallback(() => {
      // Здесь можно добавить логику для автоматического размещения узлов
      // Например, использовать force-directed layout
    }, []);

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-right"
        >
          <Background />
          <Controls />
          <Panel position="top-right">
            <button onClick={onLayout}>Пересчитать расположение</button>
          </Panel>
        </ReactFlow>
      </div>
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Ошибка при отображении графа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
};

export const DependencyGraph: React.FC<GraphProps> = (props) => {
  return (
    <DependencyGraphComponent {...props} />
  );
};
