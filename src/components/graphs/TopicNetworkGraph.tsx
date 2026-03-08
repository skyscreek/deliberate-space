import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { TopicRow } from '@/hooks/useTopics';
import { TopicRelation } from '@/hooks/useTopicRelations';
import { cn } from '@/lib/utils';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  slug: string;
  title: string;
  category: string;
  postCount: number;
  status: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  relationType: string;
}

const statusColors: Record<string, string> = {
  active: 'hsl(var(--vote-up))',
  'seeking-consensus': 'hsl(var(--highlight))',
  resolved: 'hsl(var(--primary))',
};

const categoryColors: Record<string, string> = {
  'Urban Policy': 'hsl(var(--argdown-claim))',
  'Education': 'hsl(var(--argdown-support))',
  'Housing': 'hsl(var(--argdown-concern))',
  'Technology': 'hsl(var(--argdown-alternative))',
  'Infrastructure': 'hsl(var(--argdown-proposal))',
  'General': 'hsl(var(--primary))',
};

function getCategoryColor(category: string) {
  return categoryColors[category] || 'hsl(var(--primary))';
}

interface Props {
  topics: TopicRow[];
  relations: TopicRelation[];
}

export default function TopicNetworkGraph({ topics, relations }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });
  const navigate = useNavigate();

  // Resize observer
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: Math.min(360, Math.max(260, width * 0.45)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build simulation
  useEffect(() => {
    if (topics.length === 0) return;

    const graphNodes: GraphNode[] = topics.map(t => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      category: t.category,
      postCount: t.post_count || 0,
      status: t.status,
    }));

    const nodeIds = new Set(graphNodes.map(n => n.id));
    const graphLinks: GraphLink[] = relations
      .filter(r => nodeIds.has(r.source_topic_id) && nodeIds.has(r.target_topic_id))
      .map(r => ({
        id: r.id,
        source: r.source_topic_id,
        target: r.target_topic_id,
        relationType: r.relation_type,
      }));

    const sim = forceSimulation<GraphNode>(graphNodes)
      .force('link', forceLink<GraphNode, GraphLink>(graphLinks).id(d => d.id).distance(100))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide<GraphNode>().radius(d => nodeRadius(d.postCount) + 12))
      .on('tick', () => {
        setNodes([...graphNodes]);
        setLinks([...graphLinks]);
      });

    return () => { sim.stop(); };
  }, [topics, relations, dimensions.width, dimensions.height]);

  const nodeRadius = (postCount: number) => Math.max(14, Math.min(30, 14 + postCount * 1.5));

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    setDragNode(nodeId);
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragNode) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setNodes(prev => prev.map(n => n.id === dragNode ? { ...n, x, y, fx: x, fy: y } : n));
  }, [dragNode]);

  const handlePointerUp = useCallback(() => {
    if (dragNode) {
      setNodes(prev => prev.map(n => n.id === dragNode ? { ...n, fx: undefined, fy: undefined } : n));
      setDragNode(null);
    }
  }, [dragNode]);

  const connectedToHovered = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>();
    connected.add(hoveredNode);
    for (const l of links) {
      const src = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
      const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
      if (src === hoveredNode) connected.add(tgt);
      if (tgt === hoveredNode) connected.add(src);
    }
    return connected;
  }, [hoveredNode, links]);

  if (topics.length < 2) return null;

  return (
    <div className="surface-card-elevated overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Topic Network</h3>
        <span className="text-[10px] text-muted-foreground">{topics.length} topics · {relations.length} connections</span>
      </div>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full cursor-grab active:cursor-grabbing"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Links */}
        {links.map(l => {
          const src = l.source as GraphNode;
          const tgt = l.target as GraphNode;
          if (!src.x || !tgt.x) return null;
          const isHighlighted = hoveredNode && connectedToHovered.has(src.id) && connectedToHovered.has(tgt.id);
          return (
            <line
              key={l.id}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeDasharray={l.relationType === 'related' ? 'none' : '4 2'}
              opacity={hoveredNode && !isHighlighted ? 0.15 : 0.6}
              className="transition-opacity duration-200"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const r = nodeRadius(node.postCount);
          const isHovered = hoveredNode === node.id;
          const isDimmed = hoveredNode && !connectedToHovered.has(node.id);
          const color = getCategoryColor(node.category);

          return (
            <g
              key={node.id}
              transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
              className="cursor-pointer"
              onPointerDown={e => handlePointerDown(e, node.id)}
              onPointerEnter={() => setHoveredNode(node.id)}
              onPointerLeave={() => setHoveredNode(null)}
              onClick={() => !dragNode && navigate(`/d/${node.slug}`)}
              opacity={isDimmed ? 0.2 : 1}
              style={{ transition: 'opacity 200ms' }}
            >
              {/* Glow on hover */}
              {isHovered && (
                <circle r={r + 6} fill={color} opacity={0.15} />
              )}
              <circle
                r={r}
                fill={color}
                opacity={isHovered ? 1 : 0.8}
                stroke={isHovered ? 'hsl(var(--foreground))' : 'transparent'}
                strokeWidth={1.5}
              />
              {/* Status ring */}
              <circle
                r={r + 2}
                fill="none"
                stroke={statusColors[node.status] || statusColors.active}
                strokeWidth={2}
                opacity={0.5}
              />
              {/* Post count */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={r > 20 ? 11 : 9}
                fontWeight={600}
                className="pointer-events-none select-none"
              >
                {node.postCount}
              </text>
              {/* Title label */}
              <text
                y={r + 14}
                textAnchor="middle"
                fill="hsl(var(--foreground))"
                fontSize={10}
                fontWeight={500}
                opacity={isHovered || !hoveredNode ? 0.8 : 0.3}
                className="pointer-events-none select-none"
                style={{ transition: 'opacity 200ms' }}
              >
                {node.title.length > 28 ? node.title.slice(0, 26) + '…' : node.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
