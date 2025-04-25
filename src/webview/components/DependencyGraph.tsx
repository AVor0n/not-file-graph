import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { validateDependencies, ValidationError } from '../../utils/validateDependencies';

interface DependencyData {
  importsDeclarations: string[];
  reverseImports: string[];
}

interface GraphProps {
  data: Record<string, DependencyData>;
}

interface Node {
  id: string;
  name: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
}

const DependencyGraphComponent: React.FC<GraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    try {
      // Валидируем данные
      validateDependencies(data);

      // Очищаем предыдущий граф
      d3.select(svgRef.current).selectAll('*').remove();

      // Создаем узлы и связи
      const nodes: Node[] = Object.keys(data).map(filePath => {
        const endName = filePath.split('/');
        const name = endName.at(-1)?.split('.')[0] === 'index' ? endName.at(-2) : endName.at(-1);
        return ({
          id: filePath,
          name: name || filePath
        });
      });

      const links: Link[] = Object.entries(data).flatMap(([source, deps]) => [
        ...deps.importsDeclarations.map(target => ({ source, target })),
        ...deps.reverseImports.map(target => ({ source: target, target: source }))
      ]);

      // Создаем симуляцию
      const simulation = d3.forceSimulation<Node>(nodes)
        .force('link', d3.forceLink<Node, Link>(links).id((d: Node) => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
        .force('collision', d3.forceCollide().radius(50));

      // Создаем SVG
      const svg = d3.select(svgRef.current)
        .attr('width', '100%')
        .attr('height', '100%');

      // Создаем связи
      const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1);

      // Создаем узлы
      const node = svg.append('g')
        .selectAll<SVGGElement, Node>('g')
        .data(nodes)
        .join('g')
        .call(d3.drag<SVGGElement, Node>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      // Добавляем прямоугольники для узлов
      node.append('rect')
        .attr('width', (d: Node) => d.name.length * 8 + 20)
        .attr('height', 30)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', '#69b3a2')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // Добавляем текст
      node.append('text')
        .attr('x', (d: Node) => (d.name.length * 8 + 20) / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .text((d: Node) => d.name);

      // Обновляем позиции при каждом тике симуляции
      simulation.on('tick', () => {
        link
          .attr('x1', (d: Link) => (d.source as Node).x || 0)
          .attr('y1', (d: Link) => (d.source as Node).y || 0)
          .attr('x2', (d: Link) => (d.target as Node).x || 0)
          .attr('y2', (d: Link) => (d.target as Node).y || 0);

        node.attr('transform', (d: Node) => `translate(${d.x || 0},${d.y || 0})`);
      });

      // Функции для перетаскивания
      function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return () => {
        simulation.stop();
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Ошибка при отображении графа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }, [data]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </div>
  );
};

export const DependencyGraph: React.FC<GraphProps> = (props) => {
  return (
    <DependencyGraphComponent {...props} />
  );
};
