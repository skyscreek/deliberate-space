import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY,
  SimulationNodeDatum, SimulationLinkDatum,
} from 'd3-force';
import { TopicRow } from '@/hooks/useTopics';
import { TopicRelation } from '@/hooks/useTopicRelations';
import { cn } from '@/lib/utils';
import { Network, Lightbulb, ChevronRight, ChevronLeft, Maximize2, Minimize2, PanelRightClose, PanelRightOpen } from 'lucide-react';

/* ── Cluster colours (raw HSL for Canvas API — CSS var() doesn't work in Canvas) ── */
const CLUSTER_COLORS_HSL: [number, number, number][] = [
  [340, 70, 55], [160, 60, 45], [45, 80, 55],
  [270, 55, 58], [195, 70, 50], [15, 75, 55],
];
const CLUSTER_COLORS = CLUSTER_COLORS_HSL.map(([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`);

function hslA(idx: number, alpha: number) {
  const [h, s, l] = CLUSTER_COLORS_HSL[idx % CLUSTER_COLORS_HSL.length];
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

/* ── Types ── */
interface GraphNode extends SimulationNodeDatum {
  id: string;
  slug: string;
  title: string;
  category: string;
  postCount: number;
  status: string;
  cluster: number;
  importance: number; // betweenness-like
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  relationType: string;
}

interface Cluster {
  id: number;
  label: string;
  color: string;
  nodes: GraphNode[];
  cx: number;
  cy: number;
  percentage: number;
}

/* ── Helpers ── */
function assignClusters(categories: string[]): Map<string, number> {
  const unique = [...new Set(categories)];
  const map = new Map<string, number>();
  unique.forEach((c, i) => map.set(c, i % CLUSTER_COLORS.length));
  return map;
}

function computeImportance(nodeId: string, links: { source: string; target: string }[]): number {
  let degree = 0;
  for (const l of links) {
    if (l.source === nodeId || l.target === nodeId) degree++;
  }
  return degree;
}

/* ── Component ── */
interface Props {
  topics: TopicRow[];
  relations: TopicRelation[];
}

export default function TopicNetworkGraph({ topics, relations }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });
  const [expanded, setExpanded] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const animFrame = useRef<number>(0);

  // Cluster map
  const clusterMap = useMemo(
    () => assignClusters(topics.map(t => t.category)),
    [topics]
  );

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      const h = expanded ? Math.min(680, width * 0.65) : Math.min(440, Math.max(320, width * 0.5));
      setDimensions({ width, height: h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded]);

  // Build simulation
  useEffect(() => {
    if (topics.length === 0) return;

    const rawLinks = relations.map(r => ({ source: r.source_topic_id, target: r.target_topic_id }));

    const graphNodes: GraphNode[] = topics.map(t => {
      const imp = computeImportance(t.id, rawLinks);
      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        category: t.category,
        postCount: t.post_count || 0,
        status: t.status,
        cluster: clusterMap.get(t.category) ?? 0,
        importance: imp,
      };
    });

    const nodeIds = new Set(graphNodes.map(n => n.id));
    const graphLinks: GraphLink[] = relations
      .filter(r => nodeIds.has(r.source_topic_id) && nodeIds.has(r.target_topic_id))
      .map(r => ({
        id: r.id,
        source: r.source_topic_id,
        target: r.target_topic_id,
        relationType: r.relation_type,
      }));

    nodesRef.current = graphNodes;
    linksRef.current = graphLinks;

    const sim = forceSimulation<GraphNode>(graphNodes)
      .force('link', forceLink<GraphNode, GraphLink>(graphLinks).id(d => d.id).distance(80).strength(0.7))
      .force('charge', forceManyBody().strength(-180))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide<GraphNode>().radius(d => nodeRadius(d) + 8))
      .force('x', forceX(dimensions.width / 2).strength(0.03))
      .force('y', forceY(dimensions.height / 2).strength(0.03))
      .alphaDecay(0.02)
      .on('tick', () => {
        setNodes([...graphNodes]);
        setLinks([...graphLinks]);
      });

    simRef.current = sim;
    return () => { sim.stop(); };
  }, [topics, relations, dimensions.width, dimensions.height, clusterMap]);

  // Compute clusters
  const clusters = useMemo<Cluster[]>(() => {
    if (nodes.length === 0) return [];
    const groups = new Map<number, GraphNode[]>();
    for (const n of nodes) {
      if (!groups.has(n.cluster)) groups.set(n.cluster, []);
      groups.get(n.cluster)!.push(n);
    }
    const totalPosts = nodes.reduce((s, n) => s + n.postCount, 0) || 1;
    return Array.from(groups.entries()).map(([id, clusterNodes]) => {
      const cx = clusterNodes.reduce((s, n) => s + (n.x ?? 0), 0) / clusterNodes.length;
      const cy = clusterNodes.reduce((s, n) => s + (n.y ?? 0), 0) / clusterNodes.length;
      const posts = clusterNodes.reduce((s, n) => s + n.postCount, 0);
      return {
        id,
        label: clusterNodes[0].category,
        color: CLUSTER_COLORS[id % CLUSTER_COLORS.length],
        nodes: clusterNodes,
        cx, cy,
        percentage: Math.round((posts / totalPosts) * 100),
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [nodes]);

  // Detect "gaps" – clusters with fewest inter-cluster links
  const gaps = useMemo(() => {
    if (clusters.length < 2) return [];
    const interLinks = new Map<string, number>();
    for (const l of links) {
      const src = typeof l.source === 'object' ? (l.source as GraphNode).cluster : -1;
      const tgt = typeof l.target === 'object' ? (l.target as GraphNode).cluster : -1;
      if (src !== tgt && src >= 0 && tgt >= 0) {
        const key = [Math.min(src, tgt), Math.max(src, tgt)].join('-');
        interLinks.set(key, (interLinks.get(key) ?? 0) + 1);
      }
    }
    // Find pairs of clusters with 0 or minimal connections
    const gapPairs: { a: Cluster; b: Cluster; count: number }[] = [];
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const key = [Math.min(clusters[i].id, clusters[j].id), Math.max(clusters[i].id, clusters[j].id)].join('-');
        const count = interLinks.get(key) ?? 0;
        if (count <= 1) gapPairs.push({ a: clusters[i], b: clusters[j], count });
      }
    }
    return gapPairs.sort((a, b) => a.count - b.count).slice(0, 3);
  }, [clusters, links]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = 'hsl(220, 15%, 8%)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    const connectedToHovered = new Set<string>();
    if (hoveredNode) {
      connectedToHovered.add(hoveredNode);
      for (const l of links) {
        const src = typeof l.source === 'object' ? (l.source as GraphNode).id : String(l.source);
        const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : String(l.target);
        if (src === hoveredNode) connectedToHovered.add(tgt);
        if (tgt === hoveredNode) connectedToHovered.add(src);
      }
    }

    // Draw cluster background regions (subtle glow)
    for (const cluster of clusters) {
      if (cluster.nodes.length < 2) continue;
      const cx = cluster.cx;
      const cy = cluster.cy;
      const spread = Math.max(60, cluster.nodes.length * 25);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread);
      grad.addColorStop(0, hslA(cluster.id, 0.06));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, spread, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw edges
    for (const l of links) {
      const src = l.source as GraphNode;
      const tgt = l.target as GraphNode;
      if (src.x == null || tgt.x == null) continue;

      const srcCluster = src.cluster;
      const tgtCluster = tgt.cluster;
      const sameCluster = srcCluster === tgtCluster;
      const edgeColor = sameCluster
        ? CLUSTER_COLORS[srcCluster % CLUSTER_COLORS.length]
        : 'hsl(0, 0%, 35%)';

      const isHighlighted = hoveredNode && connectedToHovered.has(src.id) && connectedToHovered.has(tgt.id);
      const isDimmed = hoveredNode && !isHighlighted;

      ctx.beginPath();
      ctx.moveTo(src.x!, src.y!);
      ctx.lineTo(tgt.x!, tgt.y!);
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = isHighlighted ? 2 : 0.8;
      ctx.globalAlpha = isDimmed ? 0.08 : isHighlighted ? 0.9 : 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw nodes
    for (const node of nodes) {
      if (node.x == null || node.y == null) continue;
      const r = nodeRadius(node);
      const color = CLUSTER_COLORS[node.cluster % CLUSTER_COLORS.length];
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;
      const isDimmed = hoveredNode && !connectedToHovered.has(node.id);

      ctx.globalAlpha = isDimmed ? 0.15 : 1;

      // Glow for hovered/selected
      if (isHovered || isSelected) {
        const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 3);
        glow.addColorStop(0, hslA(node.cluster, 0.35));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Border for selected
      if (isSelected) {
        ctx.strokeStyle = 'hsl(0, 0%, 90%)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Label – show for important or hovered or no hover
      const showLabel = isHovered || isSelected || !hoveredNode || node.importance > 1 || node.postCount > 2;
      if (showLabel) {
        const fontSize = isHovered ? 12 : Math.max(9, Math.min(13, 8 + node.importance * 1.5 + node.postCount * 0.5));
        ctx.font = `${isHovered ? 700 : 500} ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isDimmed ? 'hsla(0, 0%, 85%, 0.15)' : isHovered ? 'hsl(0, 0%, 100%)' : 'hsla(0, 0%, 85%, 0.75)';
        ctx.fillText(
          node.title.length > 30 ? node.title.slice(0, 28) + '…' : node.title,
          node.x,
          node.y + r + 5,
        );
      }
    }

    // Cluster labels (large)
    for (const cluster of clusters) {
      if (cluster.nodes.length === 0) continue;
      const fontSize = Math.max(14, Math.min(22, 12 + cluster.nodes.length * 3));
      ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = hslA(cluster.id, 0.25);
      ctx.fillText(cluster.label, cluster.cx, cluster.cy - 35);
    }

    // Gap indicators (dashed lines between disconnected clusters)
    for (const gap of gaps) {
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.moveTo(gap.a.cx, gap.a.cy);
      ctx.lineTo(gap.b.cx, gap.b.cy);
      ctx.strokeStyle = 'hsla(320, 70%, 60%, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // "gap" label
      const mx = (gap.a.cx + gap.b.cx) / 2;
      const my = (gap.a.cy + gap.b.cy) / 2;
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'hsla(320, 70%, 70%, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('idea gap', mx, my - 6);
    }

    ctx.restore();
  }, [nodes, links, dimensions, hoveredNode, selectedNode, clusters, gaps, transform]);

  const nodeRadius = (node: GraphNode) => Math.max(5, Math.min(18, 5 + node.postCount * 1.5 + node.importance * 2));

  // Hit detection
  const getNodeAtPoint = useCallback((clientX: number, clientY: number): GraphNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - transform.x) / transform.k;
    const y = (clientY - rect.top - transform.y) / transform.k;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.x == null || n.y == null) continue;
      const r = nodeRadius(n) + 4;
      if ((n.x - x) ** 2 + (n.y - y) ** 2 <= r ** 2) return n;
    }
    return null;
  }, [nodes, transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: prev.x + (e.clientX - panStart.x),
        y: prev.y + (e.clientY - panStart.y),
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    const node = getNodeAtPoint(e.clientX, e.clientY);
    setHoveredNode(node?.id ?? null);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = node ? 'pointer' : 'grab';
  }, [getNodeAtPoint, isPanning, panStart]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const node = getNodeAtPoint(e.clientX, e.clientY);
    if (!node) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  }, [getNodeAtPoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    const node = getNodeAtPoint(e.clientX, e.clientY);
    if (node) {
      setSelectedNode(prev => prev === node.id ? null : node.id);
    }
  }, [getNodeAtPoint, isPanning]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const node = getNodeAtPoint(e.clientX, e.clientY);
    if (node) navigate(`/d/${node.slug}`);
  }, [getNodeAtPoint, navigate]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform(prev => {
      const newK = Math.max(0.3, Math.min(3, prev.k * factor));
      return {
        k: newK,
        x: mx - (mx - prev.x) * (newK / prev.k),
        y: my - (my - prev.y) * (newK / prev.k),
      };
    });
  }, []);

  const selectedNodeData = useMemo(
    () => nodes.find(n => n.id === selectedNode),
    [nodes, selectedNode]
  );

  if (topics.length < 2) return null;

  return (
    <div className={cn(
      'rounded-xl overflow-hidden border border-border/30',
      expanded && 'fixed inset-4 z-50'
    )} style={{ background: 'hsl(var(--graph-bg))' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-white/60" />
          <span className="text-xs font-semibold text-white/80">Discourse Network</span>
          <span className="text-[10px] text-white/40 ml-1">
            {topics.length} topics · {relations.length} connections
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
            className="text-[10px] text-white/50 hover:text-white/80 px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            Reset view
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-white/50 hover:text-white/80 p-1 rounded hover:bg-white/5 transition-colors"
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex" style={{ height: expanded ? 'calc(100% - 40px)' : dimensions.height }}>
        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
          />

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {clusters.map(c => (
              <span
                key={c.id}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: c.color.replace(')', ' / 0.2)').replace('hsl(', 'hsla('), color: c.color }}
              >
                {c.label}
              </span>
            ))}
          </div>

          {/* Zoom indicator */}
          <span className="absolute bottom-3 right-3 text-[10px] text-white/30">
            {Math.round(transform.k * 100)}%
          </span>
        </div>

        {/* Insights sidebar */}
        <div className="w-64 border-l border-white/10 overflow-y-auto flex-shrink-0" style={{ background: 'hsla(220, 15%, 10%, 0.9)' }}>
          <div className="p-3 space-y-4">
            {/* Main Topics */}
            <div>
              <h4 className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-2">Main Topics</h4>
              <div className="space-y-1.5">
                {clusters.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: c.color, color: 'hsl(220, 15%, 8%)' }}
                    >
                      {c.percentage}%: {c.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {clusters.flatMap(c => c.nodes.slice(0, 3)).map(n => (
                  <span key={n.id} className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                    {n.title.length > 20 ? n.title.slice(0, 18) + '…' : n.title}
                  </span>
                ))}
              </div>
            </div>

            {/* Gaps to Connect */}
            {gaps.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Gaps to Connect
                </h4>
                <div className="space-y-2">
                  {gaps.map((gap, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: gap.a.color, color: 'hsl(220, 15%, 8%)' }}
                      >
                        {gap.a.label}
                      </span>
                      <span className="text-[10px] text-white/30">↔</span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: gap.b.color, color: 'hsl(220, 15%, 8%)' }}
                      >
                        {gap.b.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed">
                  These topic clusters have few connections. Bridge them with new discussions.
                </p>
              </div>
            )}

            {/* Selected node detail */}
            {selectedNodeData && (
              <div className="border-t border-white/10 pt-3">
                <h4 className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">Selected</h4>
                <p className="text-xs text-white/90 font-medium">{selectedNodeData.title}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/50">
                  <span>{selectedNodeData.postCount} posts</span>
                  <span>·</span>
                  <span>{selectedNodeData.importance} connections</span>
                </div>
                <button
                  onClick={() => navigate(`/d/${selectedNodeData.slug}`)}
                  className="mt-2 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  style={{ color: CLUSTER_COLORS[selectedNodeData.cluster % CLUSTER_COLORS.length] }}
                >
                  Open discussion <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="border-t border-white/10 pt-3">
              <h4 className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-2">Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white/5 rounded p-2">
                  <div className="text-sm font-bold text-white/90">{topics.length}</div>
                  <div className="text-[9px] text-white/40">Topics</div>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <div className="text-sm font-bold text-white/90">{relations.length}</div>
                  <div className="text-[9px] text-white/40">Connections</div>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <div className="text-sm font-bold text-white/90">{clusters.length}</div>
                  <div className="text-[9px] text-white/40">Clusters</div>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <div className="text-sm font-bold text-white/90">{gaps.length}</div>
                  <div className="text-[9px] text-white/40">Gaps</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
