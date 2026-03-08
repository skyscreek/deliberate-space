import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceY,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import { cn } from '@/lib/utils';

/* ── Types ── */
interface MapNode {
  id: string;
  title: string;
  type: 'statement' | 'argument';
  text: string;
  tags: string[];
  color?: string;
}

interface MapEdge {
  id: string;
  source: string;
  target: string;
  relationType: 'support' | 'attack' | 'undercut' | 'entails' | 'contrary';
}

interface GraphNode extends SimulationNodeDatum {
  id: string;
  title: string;
  type: 'statement' | 'argument';
  text: string;
  tags: string[];
  color?: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  relationType: MapEdge['relationType'];
}

/* ── Lightweight Argdown-ish parser ──
   Parses the AI-generated Argdown source into nodes and edges.
   Handles:
   - [Title]: text          → statement
   - <Title>: text          → argument
   - + <Title>/[Title]      → support edge
   - - <Title>/[Title]      → attack edge
   - #tag                   → tags on nearest node
   - (Author Name)          → stored in text
*/
function parseArgdownSource(source: string): { nodes: MapNode[]; edges: MapEdge[] } {
  const nodes = new Map<string, MapNode>();
  const edges: MapEdge[] = [];
  const lines = source.split('\n');
  let edgeCounter = 0;

  // Stack to track indentation-based parent context
  const parentStack: { title: string; indent: number }[] = [];

  function getOrCreateNode(title: string, type: 'statement' | 'argument', text?: string): MapNode {
    const existing = nodes.get(title);
    if (existing) {
      if (text && text.length > (existing.text?.length || 0)) existing.text = text;
      return existing;
    }
    const node: MapNode = {
      id: `node-${nodes.size}`,
      title,
      type,
      text: text || title,
      tags: [],
    };
    nodes.set(title, node);
    return node;
  }

  function extractTags(line: string): string[] {
    const tags: string[] = [];
    const tagRegex = /#(\w+)/g;
    let m;
    while ((m = tagRegex.exec(line)) !== null) tags.push(m[1]);
    return tags;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();
    const tags = extractTags(trimmed);

    // Statement definition: [Title]: text
    const stmtMatch = trimmed.match(/^\[([^\]]+)\]\s*:\s*(.+)/);
    if (stmtMatch) {
      const node = getOrCreateNode(stmtMatch[1], 'statement', stmtMatch[2].replace(/#\w+/g, '').trim());
      node.tags.push(...tags);
      parentStack.length = 0;
      parentStack.push({ title: stmtMatch[1], indent });
      continue;
    }

    // Argument definition: <Title>: text or <Title>(Author): text
    const argMatch = trimmed.match(/^<([^>]+)>(?:\([^)]*\))?\s*:\s*(.+)/);
    if (argMatch) {
      const node = getOrCreateNode(argMatch[1], 'argument', argMatch[2].replace(/#\w+/g, '').trim());
      node.tags.push(...tags);
      parentStack.length = 0;
      parentStack.push({ title: argMatch[1], indent });
      continue;
    }

    // Support relation: + <Title> or + [Title]
    const supportMatch = trimmed.match(/^\+\s*(?:<([^>]+)>|\[([^\]]+)\])(?:\([^)]*\))?\s*(?::\s*(.+))?/);
    if (supportMatch) {
      const title = supportMatch[1] || supportMatch[2];
      const type = supportMatch[1] ? 'argument' : 'statement';
      const text = supportMatch[3]?.replace(/#\w+/g, '').trim();
      const node = getOrCreateNode(title, type as 'statement' | 'argument', text);
      node.tags.push(...tags);

      // Find parent from stack
      const parent = findParent(indent);
      if (parent) {
        edges.push({
          id: `edge-${edgeCounter++}`,
          source: nodes.get(title)!.id,
          target: nodes.get(parent)!.id,
          relationType: 'support',
        });
      }
      // Update stack
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].indent >= indent) parentStack.pop();
      parentStack.push({ title, indent });
      continue;
    }

    // Attack relation: - <Title> or - [Title]
    const attackMatch = trimmed.match(/^-\s*(?:<([^>]+)>|\[([^\]]+)\])(?:\([^)]*\))?\s*(?::\s*(.+))?/);
    if (attackMatch) {
      const title = attackMatch[1] || attackMatch[2];
      const type = attackMatch[1] ? 'argument' : 'statement';
      const text = attackMatch[3]?.replace(/#\w+/g, '').trim();
      const node = getOrCreateNode(title, type as 'statement' | 'argument', text);
      node.tags.push(...tags);

      const parent = findParent(indent);
      if (parent) {
        edges.push({
          id: `edge-${edgeCounter++}`,
          source: nodes.get(title)!.id,
          target: nodes.get(parent)!.id,
          relationType: 'attack',
        });
      }
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].indent >= indent) parentStack.pop();
      parentStack.push({ title, indent });
      continue;
    }
  }

  function findParent(currentIndent: number): string | null {
    for (let i = parentStack.length - 1; i >= 0; i--) {
      if (parentStack[i].indent < currentIndent) return parentStack[i].title;
    }
    return parentStack.length > 0 ? parentStack[0].title : null;
  }

  return { nodes: Array.from(nodes.values()), edges };
}

/* ── Color helpers ── */
const nodeColors = {
  statement: 'hsl(var(--argdown-claim))',
  argument: 'hsl(var(--argdown-support))',
};

const edgeColors: Record<string, string> = {
  support: 'hsl(var(--argdown-support))',
  attack: 'hsl(var(--argdown-objection))',
  undercut: 'hsl(var(--argdown-concern))',
  entails: 'hsl(var(--argdown-proposal))',
  contrary: 'hsl(var(--argdown-alternative))',
};

/* ── Component ── */
interface Props {
  argdownSource: string;
  onViewPost?: (postId: string) => void;
}

export default function ArgdownMapView({ argdownSource, onViewPost }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 700, height: 420 });

  const { nodes: mapNodes, edges: mapEdges } = useMemo(() => parseArgdownSource(argdownSource), [argdownSource]);

  // Resize
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(320, Math.min(500, width * 0.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Simulation
  useEffect(() => {
    if (mapNodes.length === 0) return;

    const gNodes: GraphNode[] = mapNodes.map(n => ({
      id: n.id,
      title: n.title,
      type: n.type,
      text: n.text,
      tags: n.tags,
      color: n.color,
    }));

    const nodeIdSet = new Set(gNodes.map(n => n.id));
    const gLinks: GraphLink[] = mapEdges
      .filter(e => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
      .map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        relationType: e.relationType,
      }));

    const sim = forceSimulation<GraphNode>(gNodes)
      .force('link', forceLink<GraphNode, GraphLink>(gLinks).id(d => d.id).distance(90).strength(0.7))
      .force('charge', forceManyBody().strength(-220))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide<GraphNode>().radius(40))
      .force('y', forceY<GraphNode>().y(dimensions.height / 2).strength(0.03))
      .on('tick', () => {
        setGraphNodes([...gNodes]);
        setGraphLinks([...gLinks]);
      });

    return () => { sim.stop(); };
  }, [mapNodes, mapEdges, dimensions]);

  const connectedToHovered = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const s = new Set<string>([hoveredNode]);
    for (const l of graphLinks) {
      const src = typeof l.source === 'object' ? (l.source as GraphNode).id : String(l.source);
      const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : String(l.target);
      if (src === hoveredNode) s.add(tgt);
      if (tgt === hoveredNode) s.add(src);
    }
    return s;
  }, [hoveredNode, graphLinks]);

  const selectedData = useMemo(() => graphNodes.find(n => n.id === selectedNode), [selectedNode, graphNodes]);

  if (mapNodes.length === 0) {
    return (
      <div className="surface-card-elevated p-8 text-center">
        <p className="text-sm text-muted-foreground">No argument map available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="surface-card-elevated overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold text-foreground">Argument Map</h3>
            <span className="text-[10px] text-muted-foreground">
              {mapNodes.length} nodes · {mapEdges.length} relations
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Legend */}
            <span className="flex items-center gap-1 text-[10px]">
              <span className="w-2 h-2 rounded-sm" style={{ background: nodeColors.statement }} />
              <span className="text-muted-foreground">Statement</span>
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <span className="w-2 h-2 rounded-full" style={{ background: nodeColors.argument }} />
              <span className="text-muted-foreground">Argument</span>
            </span>
            <button
              onClick={() => setShowSource(!showSource)}
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded border transition-colors',
                showSource ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              Source
            </button>
          </div>
        </div>

        {/* SVG Graph */}
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full"
        >
          <defs>
            <marker id="arrow-support" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={edgeColors.support} opacity="0.7" />
            </marker>
            <marker id="arrow-attack" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={edgeColors.attack} opacity="0.7" />
            </marker>
          </defs>

          {/* Edges */}
          {graphLinks.map(l => {
            const src = l.source as GraphNode;
            const tgt = l.target as GraphNode;
            if (!src.x || !tgt.x) return null;
            const isHL = hoveredNode && connectedToHovered.has(src.id) && connectedToHovered.has(tgt.id);
            const color = edgeColors[l.relationType] || edgeColors.support;
            const markerId = l.relationType === 'attack' ? 'arrow-attack' : 'arrow-support';

            return (
              <line
                key={l.id}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={isHL ? color : 'hsl(var(--border))'}
                strokeWidth={isHL ? 2.5 : 1.5}
                strokeDasharray={l.relationType === 'attack' ? '6 3' : 'none'}
                opacity={hoveredNode && !isHL ? 0.1 : 0.5}
                markerEnd={`url(#${markerId})`}
                style={{ transition: 'opacity 200ms' }}
              />
            );
          })}

          {/* Nodes */}
          {graphNodes.map(node => {
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const isDimmed = hoveredNode && !connectedToHovered.has(node.id);
            const color = node.type === 'statement' ? nodeColors.statement : nodeColors.argument;
            const r = node.type === 'statement' ? 22 : 18;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
                className="cursor-pointer"
                onPointerEnter={() => setHoveredNode(node.id)}
                onPointerLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
                opacity={isDimmed ? 0.12 : 1}
                style={{ transition: 'opacity 200ms' }}
              >
                {isSelected && (
                  <rect
                    x={-(r + 5)}
                    y={-(r / 1.4 + 5)}
                    width={(r + 5) * 2}
                    height={(r / 1.4 + 5) * 2}
                    rx={node.type === 'statement' ? 4 : 20}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                )}
                {isHovered && (
                  node.type === 'statement'
                    ? <rect x={-(r + 3)} y={-(r / 1.4 + 3)} width={(r + 3) * 2} height={(r / 1.4 + 3) * 2} rx={4} fill={color} opacity={0.1} />
                    : <circle r={r + 3} fill={color} opacity={0.1} />
                )}
                {/* Statements = rounded rect, Arguments = circle */}
                {node.type === 'statement' ? (
                  <rect
                    x={-r}
                    y={-r / 1.4}
                    width={r * 2}
                    height={(r / 1.4) * 2}
                    rx={4}
                    fill={color}
                    opacity={isHovered || isSelected ? 1 : 0.8}
                    stroke={isHovered ? 'hsl(var(--foreground))' : 'transparent'}
                    strokeWidth={1}
                  />
                ) : (
                  <circle
                    r={r}
                    fill={color}
                    opacity={isHovered || isSelected ? 1 : 0.8}
                    stroke={isHovered ? 'hsl(var(--foreground))' : 'transparent'}
                    strokeWidth={1}
                  />
                )}
                {/* Title abbreviation */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={9}
                  fontWeight={600}
                  className="pointer-events-none select-none"
                >
                  {node.title.length > 8 ? node.title.slice(0, 7) + '…' : node.title}
                </text>
                {/* Full title below on hover */}
                {(isHovered || !hoveredNode) && (
                  <text
                    y={node.type === 'statement' ? r / 1.4 + 14 : r + 14}
                    textAnchor="middle"
                    fill="hsl(var(--foreground))"
                    fontSize={9}
                    fontWeight={500}
                    opacity={isHovered ? 0.9 : 0.5}
                    className="pointer-events-none select-none"
                    style={{ transition: 'opacity 200ms' }}
                  >
                    {node.title.length > 24 ? node.title.slice(0, 22) + '…' : node.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Edge legend */}
        <div className="px-4 py-2 border-t border-border/40 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-4 h-0 border-t-2" style={{ borderColor: edgeColors.support }} />
            support
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: edgeColors.attack }} />
            attack
          </span>
        </div>
      </div>

      {/* Selected node detail */}
      {selectedData && (
        <div className="surface-card-elevated p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            {selectedData.type === 'statement' ? (
              <span className="w-3 h-2.5 rounded-sm shrink-0" style={{ background: nodeColors.statement }} />
            ) : (
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: nodeColors.argument }} />
            )}
            <span className="text-xs font-semibold text-foreground">{selectedData.title}</span>
            <span className="text-[10px] text-muted-foreground capitalize">{selectedData.type}</span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{selectedData.text}</p>
          {selectedData.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {selectedData.tags.map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full border border-primary/20 text-primary/70">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Argdown source */}
      {showSource && (
        <div className="surface-card-elevated overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-border/40">
            <h4 className="text-xs font-semibold text-foreground">Argdown Source</h4>
          </div>
          <pre className="p-4 text-xs text-foreground/80 leading-relaxed overflow-x-auto font-mono whitespace-pre-wrap">
            {argdownSource}
          </pre>
        </div>
      )}
    </div>
  );
}
