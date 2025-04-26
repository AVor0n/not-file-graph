import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, NodeSingular } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { ValidationError } from '../../utils/validateDependencies';

// Регистрируем плагин dagre для автоматического размещения узлов
cytoscape.use(dagre);

export interface DependencyData {
    importsDeclarations: string[];
    reverseImports: string[];
}

export interface GraphData {
    [key: string]: DependencyData;
}

export interface GraphProps {
  data: GraphData;
  selectedFile: string | null;
}

export const DependencyGraph = ({ data, selectedFile }: GraphProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);

    useEffect(() => {
        if (!containerRef.current || !data) return;

        try {
            // Создаем узлы и связи
            const nodes = Object.keys(data).map(filePath => {
                const endName = filePath.split('/');
                const name =
                    endName.at(-1)?.split('.')[0] === 'index' ? endName.at(-2) : endName.at(-1);
                return {
                    data: {
                        id: filePath,
                        name: name || filePath,
                    },
                };
            });

            const edges = Object.entries(data).flatMap(([source, deps]) => [
                ...deps.reverseImports.map(target => ({
                    data: {
                        id: `${target}-${source}`,
                        source: target,
                        target: source,
                    },
                })),
            ]);

            // Создаем экземпляр Cytoscape
            const cy = cytoscape({
                container: containerRef.current,
                elements: {
                    nodes,
                    edges,
                },
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#69b3a2',
                            label: 'data(name)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            color: '#fff',
                            'text-wrap': 'wrap',
                            'text-max-width': '100px',
                            'font-size': '14px',
                            'font-weight': 'bold',
                            padding: '10px',
                            shape: 'roundrectangle',
                            width: 'label',
                            height: 'label',
                            'border-width': 2,
                            'border-color': '#fff',
                        },
                    },
                    {
                        selector: 'node[?isSelected]',
                        style: {
                            'background-color': '#4a8a7a',
                            'border-width': 3,
                            'border-color': '#fff',
                        },
                    },
                    {
                        selector: 'node.root',
                        style: {
                            'background-color': '#4a90e2',
                            'border-width': 3,
                            'border-color': '#fff',
                        },
                    },
                    {
                        selector: 'node.root.selected',
                        style: {
                            'background-color': '#ff4444',
                            'border-width': 3,
                            'border-color': '#fff',
                        },
                    },
                    {
                        selector: 'node.selected',
                        style: {
                            'background-color': '#ff4444',
                            'border-width': 3,
                            'border-color': '#fff',
                        },
                    },
                    {
                        selector: 'edge',
                        style: {
                            width: 1,
                            'line-color': '#999',
                            'target-arrow-color': '#999',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                        },
                    },
                ],
                layout: {
                    name: 'dagre',
                    rankDir: 'TB',
                    padding: 10,
                    spacingFactor: 1,
                } as any,
            });

            // Сохраняем ссылку на экземпляр
            cyRef.current = cy;

            // Добавляем обработчики событий
            cy.on('dragfree', 'node', (evt: { target: NodeSingular }) => {
                const node = evt.target;
                const isSelected = node.data('isSelected');
                node.style('background-color', isSelected ? '#4a8a7a' : '#69b3a2');
            });

            cy.on('dragstart', 'node', (evt: { target: NodeSingular }) => {
                const node = evt.target;
                node.style('background-color', '#4a8a7a');
            });

            // Добавляем обработчик клика по узлу
            cy.on('tap', 'node', (evt: { target: NodeSingular }) => {
                const node = evt.target;
                const filePath = node.id();
                // Отправляем сообщение в VS Code для открытия файла
                vscode.postMessage({
                    type: 'openFile',
                    path: filePath
                });
            });

            // Определяем корневые узлы (без родителей)
            cy.nodes().forEach(node => {
                if (node.indegree(false) === 0) {
                    node.addClass('root');
                }
            });

            return () => {
                cy.destroy();
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new Error(
                `Ошибка при отображении графа: ${
                    error instanceof Error ? error.message : 'Неизвестная ошибка'
                }`,
            );
        }
    }, [data]);

    // Эффект для обработки выбранного файла
    useEffect(() => {
        if (!cyRef.current) return;

        // Сначала снимаем выделение со всех узлов
        cyRef.current.nodes().removeClass('selected');

        // Если есть выбранный файл, выделяем соответствующий узел
        if (selectedFile) {
            const node = cyRef.current.getElementById(selectedFile);
            if (node.length > 0) {
                node.addClass('selected');
                // Центрируем граф на выбранном узле
                cyRef.current.center(node);
            }
        }
    }, [selectedFile]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f5f5f5',
            }}
        />
    );
};
