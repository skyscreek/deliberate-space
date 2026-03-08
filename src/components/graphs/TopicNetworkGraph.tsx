import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY,
  SimulationNodeDatum, SimulationLinkDatum,
} from 'd3-force';
import { TopicRow } from '@/hooks/useTopics';
import { TopicRelation } from '@/hooks/useTopicRelations';
import { cn } from '@/lib/utils';
import { Network, Lightbulb, ChevronRight, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, ChevronDown, ChevronUp } from 'lucide-react';

/* ── Cluster colours ── */
const CLUSTER_COLORS_HSL: [number, number, number][] = [
  [340, 70, 55], [160, 60, 45], [45, 80, 55],
  [270, 55, 58], [195, 70, 50], [15, 75, 55],
];
const CLUSTER_COLORS = CLUSTER_COLORS_HSL.map(([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`);

function hslStr(idx: number, alpha = 1) {
  const [h, s, l] = CLUSTER_COLORS_HSL[idx % CLUSTER_COLORS_HSL.length];
  return alpha < 1 ? `hsla(${h}, ${s}%, ${l}%, ${alpha})` : `hsl(${h}, ${s}%, ${l}%)`;
}

/* ── Types ── */
interface GraphNode extends SimulationNodeDatum {
  id: string; slug: string; title: string; category: string;
  postCount: number; status: string; cluster: number; importance: number;
}
interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string; relationType: string;
}
interface Cluster {
  id: number; label: string; color: string; nodes: GraphNode[];
  cx: number; cy: number; percentage: number;
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
  for (const l of links) { if (l.source === nodeId || l.target === nodeId) degree++; }
  return degree;
}

/* ── Main component ── */
interface Props { topics: TopicRow[]; relations: TopicRelation[]; }

export default function TopicNetworkGraph({ topics, relations }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topicsOpen, setTopicsOpen] = useState(true);
  const [gapsOpen, setGapsOpen] = useState(true);
  const [statsOpen, setStatsOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{ dragging: boolean; nodeId: string | null; startX: number; startY: number; panStartX: number; panStartY: number }>({
    dragging: false, nodeId: null, startX: 0, startY: 0, panStartX: 0, panStartY: 0,
  });
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const navigate = useNavigate();

  const clusterMap = useMemo(() => assignClusters(topics.map(t => t.category)), [topics]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build simulation
  useEffect(() => {
    if (topics.length === 0) return;
    const rawLinks = relations.map(r => ({ source: r.source_topic_id, target: r.target_topic_id }));
    const graphNodes: GraphNode[] = topics.map(t => {
      const imp = computeImportance(t.id, rawLinks);
      return {
        id: t.id, slug: t.slug, title: t.title, category: t.category,
        postCount: t.post_count || 0, status: t.status,
        cluster: clusterMap.get(t.category) ?? 0, importance: imp,
      };
    });
    const nodeIds = new Set(graphNodes.map(n => n.id));
    const graphLinks: GraphLink[] = relations
      .filter(r => nodeIds.has(r.source_topic_id) && nodeIds.has(r.target_topic_id))
      .map(r => ({ id: r.id, source: r.source_topic_id, target: r.target_topic_id, relationType: r.relation_type }));

    const sim = forceSimulation<GraphNode>(graphNodes)
      .force('link', forceLink<GraphNode, GraphLink>(graphLinks).id(d => d.id).distance(120).strength(0.5))
      .force('charge', forceManyBody().strength(-400))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<GraphNode>().radius(d => 20 + (d.postCount || 0) * 3 + d.importance * 4))
      .force('x', forceX(0).strength(0.03))
      .force('y', forceY(0).strength(0.03))
      .alphaDecay(0.012)
      .on('tick', () => { setNodes([...graphNodes]); setLinks([...graphLinks]); });

    simRef.current = sim;
    return () => { sim.stop(); };
  }, [topics, relations, clusterMap]);

  // Node radius helper
  const getRadius = useCallback((n: GraphNode) => {
    return Math.max(8, Math.min(40, 8 + n.postCount * 3 + n.importance * 5));
  }, []);

  // Find node at position
  const findNodeAt = useCallback((cx: number, cy: number) => {
    const { x: tx, y: ty, k } = transform;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const sx = (n.x ?? 0) * k + tx + dimensions.width / 2;
      const sy = (n.y ?? 0) * k + ty + dimensions.height / 2;
      const r = getRadius(n) * k;
      const dx = cx - sx, dy = cy - sy;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }, [nodes, transform, dimensions, getRadius]);

  // Connected set for hover highlight
  const connectedToHovered = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const s = new Set<string>([hoveredNode]);
    for (const l of links) {
      const src = typeof l.source === 'object' ? (l.source as GraphNode).id : String(l.source);
      const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : String(l.target);
      if (src === hoveredNode) s.add(tgt);
      if (tgt === hoveredNode) s.add(src);
    }
    return s;
  }, [hoveredNode, links]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { width: W, height: H } = dimensions;
    const { x: tx, y: ty, k } = transform;

    // Background
    ctx.fillStyle = 'hsl(220, 14%, 96%)';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'hsla(220, 10%, 85%, 0.4)';
    ctx.lineWidth = 0.5;
    const gridSize = 60 * k;
    const offX = (tx + W / 2) % gridSize;
    const offY = (ty + H / 2) % gridSize;
    for (let x = offX; x < W; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = offY; y < H; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.save();
    ctx.translate(W / 2 + tx, H / 2 + ty);
    ctx.scale(k, k);

    // Draw edges
    for (const l of links) {
      const src = l.source as GraphNode;
      const tgt = l.target as GraphNode;
      const sameCluster = src.cluster === tgt.cluster;
      const isHighlighted = hoveredNode
        ? connectedToHovered.has(src.id) && connectedToHovered.has(tgt.id)
        : false;
      const isDimmed = hoveredNode ? !isHighlighted : false;

      ctx.beginPath();
      ctx.moveTo(src.x ?? 0, src.y ?? 0);
      ctx.lineTo(tgt.x ?? 0, tgt.y ?? 0);
      ctx.lineWidth = isHighlighted ? 3 : sameCluster ? 2 : 1.5;
      ctx.strokeStyle = isDimmed
        ? 'hsla(220, 10%, 70%, 0.1)'
        : isHighlighted
          ? hslStr(src.cluster, 0.8)
          : sameCluster
            ? hslStr(src.cluster, 0.3)
            : 'hsla(220, 10%, 60%, 0.25)';
      ctx.stroke();
    }

    // Draw nodes
    for (const n of nodes) {
      const r = getRadius(n);
      const nx = n.x ?? 0, ny = n.y ?? 0;
      const isDimmed = hoveredNode ? !connectedToHovered.has(n.id) : false;
      const isHov = hoveredNode === n.id;
      const isSel = selectedNode === n.id;

      // Glow for hovered/selected
      if (isHov || isSel) {
        const grad = ctx.createRadialGradient(nx, ny, r * 0.5, nx, ny, r * 2.5);
        grad.addColorStop(0, hslStr(n.cluster, 0.3));
        grad.addColorStop(1, 'hsla(0,0%,0%,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, r * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      const alpha = isDimmed ? 0.12 : isHov ? 1 : 0.85;
      ctx.fillStyle = hslStr(n.cluster, alpha);
      ctx.fill();

      // Border
      if (isSel) {
        ctx.strokeStyle = 'hsl(var(--foreground))';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (isHov) {
        ctx.strokeStyle = hslStr(n.cluster, 1);
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      if (!isDimmed || isHov || isSel) {
        const label = n.title.length > 24 ? n.title.slice(0, 22) + '…' : n.title;
        const fontSize = isHov ? 13 : isSel ? 12 : Math.max(9, Math.min(12, r * 0.6));
        ctx.font = `${isHov || isSel ? '600' : '500'} ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Text background for readability
        const metrics = ctx.measureText(label);
        const tw = metrics.width + 8;
        const th = fontSize + 6;
        ctx.fillStyle = 'hsla(220, 14%, 96%, 0.85)';
        ctx.beginPath();
        ctx.roundRect(nx - tw / 2, ny + r + 4, tw, th, 3);
        ctx.fill();

        ctx.fillStyle = isDimmed ? 'hsla(220, 10%, 50%, 0.4)' : 'hsl(220, 15%, 20%)';
        ctx.fillText(label, nx, ny + r + 4 + th / 2);
      }
    }

    ctx.restore();
  }, [nodes, links, dimensions, transform, hoveredNode, selectedNode, connectedToHovered, getRadius]);

  // Mouse interactions
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const d = dragRef.current;

    if (d.dragging && d.nodeId) {
      // Drag node
      const n = nodes.find(nd => nd.id === d.nodeId);
      if (n && simRef.current) {
        n.fx = (cx - dimensions.width / 2 - transform.x) / transform.k;
        n.fy = (cy - dimensions.height / 2 - transform.y) / transform.k;
        simRef.current.alpha(0.3).restart();
      }
      return;
    }
    if (d.dragging && !d.nodeId) {
      // Pan
      setTransform(t => ({ ...t, x: t.x + (cx - d.startX), y: t.y + (cy - d.startY) }));
      d.startX = cx; d.startY = cy;
      return;
    }

    const node = findNodeAt(cx, cy);
    setHoveredNode(node ? node.id : null);
    if (canvasRef.current) canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
  }, [nodes, findNodeAt, dimensions, transform]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const node = findNodeAt(cx, cy);
    dragRef.current = { dragging: true, nodeId: node?.id ?? null, startX: cx, startY: cy, panStartX: cx, panStartY: cy };
  }, [findNodeAt]);

  const handleMouseUp = useCallback(() => {
    const d = dragRef.current;
    if (d.nodeId) {
      const n = nodes.find(nd => nd.id === d.nodeId);
      if (n) { n.fx = null; n.fy = null; }
    }
    d.dragging = false; d.nodeId = null;
  }, [nodes]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const node = findNodeAt(cx, cy);
    if (node) setSelectedNode(prev => prev === node.id ? null : node.id);
    else setSelectedNode(null);
  }, [findNodeAt]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const node = findNodeAt(cx, cy);
    if (node) navigate(`/d/${node.slug}`);
  }, [findNodeAt, navigate]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    setTransform(t => {
      const newK = Math.max(0.2, Math.min(4, t.k * factor));
      const mx = cx - dimensions.width / 2, my = cy - dimensions.height / 2;
      return {
        k: newK,
        x: mx - (mx - t.x) * (newK / t.k),
        y: my - (my - t.y) * (newK / t.k),
      };
    });
  }, [dimensions]);

  // Clusters & gaps
  const clusters = useMemo<Cluster[]>(() => {
    if (nodes.length === 0) return [];
    const groups = new Map<number, GraphNode[]>();
    for (const n of nodes) { if (!groups.has(n.cluster)) groups.set(n.cluster, []); groups.get(n.cluster)!.push(n); }
    const totalPosts = nodes.reduce((s, n) => s + n.postCount, 0) || 1;
    return Array.from(groups.entries()).map(([id, clusterNodes]) => ({
      id, label: clusterNodes[0].category, color: CLUSTER_COLORS[id % CLUSTER_COLORS.length],
      nodes: clusterNodes,
      cx: clusterNodes.reduce((s, n) => s + (n.x ?? 0), 0) / clusterNodes.length,
      cy: clusterNodes.reduce((s, n) => s + (n.y ?? 0), 0) / clusterNodes.length,
      percentage: Math.round((clusterNodes.reduce((s, n) => s + n.postCount, 0) / totalPosts) * 100),
    })).sort((a, b) => b.percentage - a.percentage);
  }, [nodes]);

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

  const selectedNodeData = useMemo(() => nodes.find(n => n.id === selectedNode), [nodes, selectedNode]);
  const handleSelect = useCallback((id: string) => setSelectedNode(prev => prev === id ? null : id), []);

  if (topics.length < 2) return null;

  return (
    <div className={cn('rounded-xl overflow-hidden border border-border bg-card', expanded && 'fixed inset-4 z-50')}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Discourse Network</span>
          <span className="text-[10px] text-muted-foreground ml-1">{topics.length} topics · {relations.length} connections</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground mr-1">Drag nodes · Scroll to zoom · Dbl-click to open</span>
          <button onClick={() => setSidebarOpen(s => !s)} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors" title={sidebarOpen ? 'Collapse panel' : 'Expand panel'}>
            {sidebarOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors">
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex" style={{ height: expanded ? 'calc(100% - 40px)' : '480px' }}>
        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative" style={{ minHeight: '400px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: 'block' }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
          />
          {/* Legend overlay */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {clusters.map(c => (
              <span key={c.id} className="text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm bg-card/80" style={{ color: c.color, border: `1px solid ${hslStr(c.id, 0.3)}` }}>
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className={cn('border-l border-border overflow-y-auto flex-shrink-0 transition-all duration-300 bg-card', sidebarOpen ? 'w-64' : 'w-0 overflow-hidden')}>
          <div className="p-3 space-y-3 w-64">
            <div>
              <button onClick={() => setTopicsOpen(o => !o)} className="flex items-center justify-between w-full text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 hover:text-foreground transition-colors">
                Main Topics
                {topicsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {topicsOpen && (
                <>
                  <div className="space-y-1.5">
                    {clusters.map(c => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap text-white" style={{ background: c.color }}>{c.percentage}%: {c.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {clusters.flatMap(c => c.nodes.slice(0, 3)).map(n => (
                      <button key={n.id} onClick={() => handleSelect(n.id)} className="text-[9px] text-muted-foreground bg-muted hover:bg-accent px-1.5 py-0.5 rounded transition-colors cursor-pointer">
                        {n.title.length > 20 ? n.title.slice(0, 18) + '…' : n.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {gaps.length > 0 && (
              <div>
                <button onClick={() => setGapsOpen(o => !o)} className="flex items-center justify-between w-full text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 hover:text-foreground transition-colors">
                  <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Gaps to Connect</span>
                  {gapsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {gapsOpen && (
                  <>
                    <div className="space-y-2">
                      {gaps.map((gap, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white" style={{ background: gap.a.color }}>{gap.a.label}</span>
                          <span className="text-[10px] text-muted-foreground">↔</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white" style={{ background: gap.b.color }}>{gap.b.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5 leading-relaxed">These topic clusters have few connections. Bridge them with new discussions.</p>
                  </>
                )}
              </div>
            )}

            {selectedNodeData && (
              <div className="border-t border-border pt-3">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Selected</h4>
                <p className="text-xs text-foreground font-medium">{selectedNodeData.title}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                  <span>{selectedNodeData.postCount} posts</span><span>·</span><span>{selectedNodeData.importance} connections</span>
                </div>
                <button onClick={() => navigate(`/d/${selectedNodeData.slug}`)} className="mt-2 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded hover:bg-accent transition-colors" style={{ color: CLUSTER_COLORS[selectedNodeData.cluster % CLUSTER_COLORS.length] }}>
                  Open discussion <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="border-t border-border pt-3">
              <button onClick={() => setStatsOpen(o => !o)} className="flex items-center justify-between w-full text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 hover:text-foreground transition-colors">
                Stats
                {statsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {statsOpen && (
                <div className="grid grid-cols-2 gap-2 text-center mt-1">
                  <div className="bg-muted rounded p-2"><div className="text-sm font-bold text-foreground">{topics.length}</div><div className="text-[9px] text-muted-foreground">Topics</div></div>
                  <div className="bg-muted rounded p-2"><div className="text-sm font-bold text-foreground">{relations.length}</div><div className="text-[9px] text-muted-foreground">Connections</div></div>
                  <div className="bg-muted rounded p-2"><div className="text-sm font-bold text-foreground">{clusters.length}</div><div className="text-[9px] text-muted-foreground">Clusters</div></div>
                  <div className="bg-muted rounded p-2"><div className="text-sm font-bold text-foreground">{gaps.length}</div><div className="text-[9px] text-muted-foreground">Gaps</div></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
