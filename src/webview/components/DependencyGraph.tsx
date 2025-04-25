import React, { useEffect, useRef } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { validateDependencies, ValidationError } from '../../utils/validateDependencies';

// Регистрируем плагин dagre для автоматического размещения узлов
cytoscape.use(dagre);

interface DependencyData {
  importsDeclarations: string[];
  reverseImports: string[];
}

interface GraphProps {
  data: Record<string, DependencyData>;
}

const DependencyGraphComponent: React.FC<GraphProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    try {
      // Валидируем данные
      validateDependencies(data);

      // Создаем узлы и связи
      const nodes = Object.keys(data).map(filePath => {
        const endName = filePath.split('/');
        const name = endName.at(-1)?.split('.')[0] === 'index' ? endName.at(-2) : endName.at(-1);
        return {
          data: {
            id: filePath,
            name: name || filePath
          }
        };
      });

      const edges = Object.entries(data).flatMap(([source, deps]) => [
        ...deps.importsDeclarations.map(target => ({
          data: {
            id: `${source}-${target}`,
            source,
            target
          }
        })),
        ...deps.reverseImports.map(target => ({
          data: {
            id: `${target}-${source}`,
            source: target,
            target: source
          }
        }))
      ]);

      // Создаем экземпляр Cytoscape
      const cy = cytoscape({
        container: containerRef.current,
        elements: {
          nodes,
          edges
        },
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#69b3a2',
              'label': 'data(name)',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#fff',
              'text-wrap': 'wrap',
              'text-max-width': '100px',
              'font-size': '14px',
              'font-weight': 'bold',
              'padding': '10px',
              'shape': 'roundrectangle',
              'width': 'label',
              'height': 'label',
              'border-width': 2,
              'border-color': '#fff'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 1,
              'line-color': '#999',
              'target-arrow-color': '#999',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier'
            }
          }
        ],
        layout: {
          name: 'dagre',
          rankDir: 'LR',
          padding: 50,
          spacingFactor: 1.5
        } as any // Временно используем any для обхода проблемы с типами
      });

      // Сохраняем ссылку на экземпляр
      cyRef.current = cy;

      // Добавляем обработчики событий
      cy.on('dragfree', 'node', (evt: { target: NodeSingular }) => {
        const node = evt.target;
        node.style('background-color', '#69b3a2');
      });

      cy.on('dragstart', 'node', (evt: { target: NodeSingular }) => {
        const node = evt.target;
        node.style('background-color', '#4a8a7a');
      });

      return () => {
        cy.destroy();
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Ошибка при отображении графа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }, [data]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5'
      }}
    />
  );
};

export const DependencyGraph: React.FC<GraphProps> = (props) => {
  return (
    <DependencyGraphComponent {...props} />
  );
};
