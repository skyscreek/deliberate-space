import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceY, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { ArgumentNode } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  nodeId: string; // original argument node id
  type: ArgumentNode['type'];
  label: string;
  author?: string;
  status?: string;
  strength?: number;
  relatedPostIds: string[];
  depth: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  relation: 'child'; // parent→child
}

const typeConfig: Record<string, { fill: string; abbr: string }> = {
  claim:       { fill: 'hsl(var(--argdown-claim))',       abbr: 'CLM' },
  support:     { fill: 'hsl(var(--argdown-support))',     abbr: 'SUP' },
  objection:   { fill: 'hsl(var(--argdown-objection))',   abbr: 'OBJ' },
  concern:     { fill: 'hsl(var(--argdown-concern))',     abbr: 'CON' },
  alternative: { fill: 'hsl(var(--argdown-alternative))', abbr: 'ALT' },
  question:    { fill: 'hsl(var(--argdown-question))',    abbr: 'Q' },
  proposal:    { fill: 'hsl(var(--argdown-proposal))',    abbr: 'PRP' },
};

function flatten(nodes: ArgumentNode[], depth = 0): { gNodes: GraphNode[]; gLinks: GraphLink[] } {
  const gNodes: GraphNode[] = [];
  const gLinks: GraphLink[] = [];

  function walk(node: ArgumentNode, parentId: string | null, d: number) {
    const gNode: GraphNode = {
      id: node.id,
      nodeId: node.id,
      type: node.type,
      label: node.text.length > 60 ? node.text.slice(0, 58) + '…' : node.text,
      author: node.author,
      status: node.status,
      strength: node.strength,
      relatedPostIds: node.relatedPostIds,
      depth: d,
    };
    gNodes.push(gNode);
    if (parentId) {
      gLinks.push({ id: `${parentId}->${node.id}`, source: parentId, target: node.id, relation: 'child' });
    }
    node.children.forEach(child => walk(child, node.id, d + 1));
  }

  nodes.forEach(n => walk(n, null, 0));
  return { gNodes, gLinks };
}

interface Props {
  nodes: ArgumentNode[];
  onSwitchToThread?: (postId: string) => void;
}

export default function ArgumentGraph({ nodes: argNodes, onSwitchToThread }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 450 });
  const { scrollToPost, setFilter } = useDiscussion();

  // Resize
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(350, Math.min(550, width * 0.65)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build simulation
  useEffect(() => {
    const { gNodes, gLinks } = flatten(argNodes);
    if (gNodes.length === 0) return;

    const sim = forceSimulation<GraphNode>(gNodes)
      .force('link', forceLink<GraphNode, GraphLink>(gLinks).id(d => d.id).distance(80).strength(0.8))
      .force('charge', forceManyBody().strength(-150))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide<GraphNode>().radius(35))
      .force('y', forceY<GraphNode>().y(d => 60 + d.depth * 90).strength(0.15))
      .on('tick', () => {
        setGraphNodes([...gNodes]);
        setGraphLinks([...gLinks]);
      });

    return () => { sim.stop(); };
  }, [argNodes, dimensions]);

  const connectedToHovered = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const s = new Set<string>([hoveredNode]);
    for (const l of graphLinks) {
      const src = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source as string;
      const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target as string;
      if (src === hoveredNode) s.add(tgt);
      if (tgt === hoveredNode) s.add(src);
    }
    return s;
  }, [hoveredNode, graphLinks]);

  const selectedData = useMemo(() => graphNodes.find(n => n.id === selectedNode), [selectedNode, graphNodes]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(prev => prev === node.id ? null : node.id);
  }, []);

  if (argNodes.length === 0) {
    return (
      <div className="surface-card-elevated p-8 text-center">
        <p className="text-sm text-muted-foreground">No argument structure to visualize.</p>
      </div>
    );
  }

  // Arrow marker colors by relation type
  const linkColor = (l: GraphLink) => {
    const tgt = typeof l.target === 'object' ? (l.target as GraphNode) : graphNodes.find(n => n.id === l.target);
    return tgt ? typeConfig[tgt.type]?.fill || 'hsl(var(--border))' : 'hsl(var(--border))';
  };

  return (
    <div className="space-y-3">
      <div className="surface-card-elevated overflow-hidden">
        {/* Legend */}
        <div className="px-4 py-2.5 border-b border-border/40 flex items-center gap-3 flex-wrap">
          {Object.entries(typeConfig).map(([type, cfg]) => (
            <span key={type} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.fill }} />
              <span className="capitalize text-muted-foreground">{type}</span>
            </span>
          ))}
        </div>

        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full"
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity="0.4" />
            </marker>
          </defs>

          {/* Links */}
          {graphLinks.map(l => {
            const src = l.source as GraphNode;
            const tgt = l.target as GraphNode;
            if (!src.x || !tgt.x) return null;
            const isHighlighted = hoveredNode && connectedToHovered.has(src.id) && connectedToHovered.has(tgt.id);
            const color = linkColor(l);

            return (
              <line
                key={l.id}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={isHighlighted ? color : 'hsl(var(--border))'}
                strokeWidth={isHighlighted ? 2 : 1}
                opacity={hoveredNode && !isHighlighted ? 0.1 : 0.5}
                markerEnd="url(#arrowhead)"
                style={{ transition: 'opacity 200ms' }}
              />
            );
          })}

          {/* Nodes */}
          {graphNodes.map(node => {
            const cfg = typeConfig[node.type] || typeConfig.claim;
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const isDimmed = hoveredNode && !connectedToHovered.has(node.id);
            const r = 18;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
                className="cursor-pointer"
                onPointerEnter={() => setHoveredNode(node.id)}
                onPointerLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node)}
                opacity={isDimmed ? 0.15 : 1}
                style={{ transition: 'opacity 200ms' }}
              >
                {/* Selection ring */}
                {isSelected && <circle r={r + 5} fill="none" stroke={cfg.fill} strokeWidth={2} strokeDasharray="4 2" />}
                {/* Hover glow */}
                {isHovered && <circle r={r + 4} fill={cfg.fill} opacity={0.12} />}
                {/* Main circle */}
                <circle
                  r={r}
                  fill={cfg.fill}
                  opacity={isHovered || isSelected ? 1 : 0.75}
                  stroke={isHovered ? 'hsl(var(--foreground))' : 'transparent'}
                  strokeWidth={1}
                />
                {/* Type abbreviation */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={8}
                  fontWeight={700}
                  letterSpacing={0.5}
                  className="pointer-events-none select-none"
                >
                  {cfg.abbr}
                </text>
                {/* Author label below */}
                {node.author && (
                  <text
                    y={r + 12}
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                    fontSize={9}
                    opacity={isHovered || !hoveredNode ? 0.7 : 0.2}
                    className="pointer-events-none select-none"
                    style={{ transition: 'opacity 200ms' }}
                  >
                    {node.author.split(' ')[0]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel for selected node */}
      {selectedData && (
        <div className="surface-card-elevated p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: typeConfig[selectedData.type]?.fill }}
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: typeConfig[selectedData.type]?.fill }}>
              {selectedData.type}
            </span>
            {selectedData.status && (
              <span className="text-[10px] text-muted-foreground">
                {selectedData.status === 'resolved' ? '✓ Resolved' : selectedData.status === 'contested' ? '⚡ Contested' : '? Unresolved'}
              </span>
            )}
            {selectedData.author && (
              <span className="text-[10px] text-muted-foreground ml-auto">by {selectedData.author}</span>
            )}
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{selectedData.label}</p>
          {selectedData.strength != null && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 rounded-full bg-border w-20">
                <div className="h-full rounded-full bg-argdown-support" style={{ width: `${Math.round(selectedData.strength * 100)}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{Math.round(selectedData.strength * 100)}% confidence</span>
            </div>
          )}
          {selectedData.relatedPostIds.length > 0 && (
            <button
              onClick={() => {
                if (onSwitchToThread) onSwitchToThread(selectedData.relatedPostIds[0]);
                else scrollToPost(selectedData.relatedPostIds[0]);
              }}
              className="text-[11px] text-primary font-medium hover:underline"
            >
              View in discussion →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
