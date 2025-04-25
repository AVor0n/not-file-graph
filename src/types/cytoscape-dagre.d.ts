declare module 'cytoscape-dagre' {
  import { Core, LayoutOptions } from 'cytoscape';

  interface DagreLayoutOptions extends LayoutOptions {
    name: 'dagre';
    rankDir?: 'TB' | 'LR' | 'RL' | 'BT';
    align?: 'UL' | 'UR' | 'DL' | 'DR';
    ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
    padding?: number;
    spacingFactor?: number;
    nodeSep?: number;
    edgeSep?: number;
    rankSep?: number;
  }

  function dagre(cytoscape: (extension: any) => void): void;
  export = dagre;
}
