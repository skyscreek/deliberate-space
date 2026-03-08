import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Graph from 'graphology';
import Sigma from 'sigma';
import { NodeDisplayData, EdgeDisplayData } from 'sigma/types';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { circular } from 'graphology-layout';
import { degreeCentrality } from 'graphology-metrics/centrality/degree';
import { TopicRow } from '@/hooks/useTopics';
import { TopicRelation } from '@/hooks/useTopicRelations';
import { cn } from '@/lib/utils';
import { Search, X, ChevronRight, ExternalLink, Maximize2, Minimize2, MessageSquare } from 'lucide-react';

/* ── Cluster colours ── */
const CLUSTER_PALETTE = [
  'hsl(340, 70%, 55%)', 'hsl(160, 60%, 45%)', 'hsl(45, 80%, 55%)',
  'hsl(270, 55%, 58%)', 'hsl(195, 70%, 50%)', 'hsl(15, 75%, 55%)',
  'hsl(200, 60%, 50%)', 'hsl(320, 50%, 50%)',
];

function assignClusterColors(categories: string[]): Map<string, number> {
  const unique = [...new Set(categories)];
  const map = new Map<string, number>();
  unique.forEach((c, i) => map.set(c, i % CLUSTER_PALETTE.length));
  return map;
}

function hexFromHsl(hslStr: string): string {
  const m = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return '#888888';
  const h = parseInt(m[1]) / 360;
  const s = parseInt(m[2]) / 100;
  const l = parseInt(m[3]) / 100;
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q2;
    r = hue2rgb(p, q2, h + 1/3);
    g = hue2rgb(p, q2, h);
    b = hue2rgb(p, q2, h - 1/3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex.length === 7 ? hex + a : hex.slice(0, 7) + a;
}

/* ── Types ── */
export interface NodeData {
  id: string;
  slug: string;
  title: string;
  category: string;
  postCount: number;
  status: string;
  cluster: number;
  degree: number;
  neighbors: string[];
  neighborTitles: string[];
}

interface ClusterInfo {
  id: number;
  label: string;
  color: string;
  hex: string;
  nodeCount: number;
  totalPosts: number;
}

/* ── Main component ── */
interface Props {
  topics: TopicRow[];
  relations: TopicRelation[];
  fullHeight?: boolean;
  onSelectNode?: (nodeId: string | null, nodeData: NodeData | null) => void;
  onOpenDiscussion?: (slug: string) => void;
}

export default function TopicNetworkGraph({ topics, relations, fullHeight, onSelectNode, onOpenDiscussion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  // Refs for reducers (avoid stale closures)
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedNode;

  const clusterMap = useMemo(() => assignClusterColors(topics.map(t => t.category)), [topics]);

  const clusters = useMemo<ClusterInfo[]>(() => {
    const groups = new Map<number, { label: string; count: number; posts: number }>();
    for (const t of topics) {
      const c = clusterMap.get(t.category) ?? 0;
      if (!groups.has(c)) groups.set(c, { label: t.category, count: 0, posts: 0 });
      const g = groups.get(c)!;
      g.count++;
      g.posts += t.post_count || 0;
    }
    return Array.from(groups.entries()).map(([id, g]) => ({
      id, label: g.label,
      color: CLUSTER_PALETTE[id % CLUSTER_PALETTE.length],
      hex: hexFromHsl(CLUSTER_PALETTE[id % CLUSTER_PALETTE.length]),
      nodeCount: g.count, totalPosts: g.posts,
    })).sort((a, b) => b.totalPosts - a.totalPosts);
  }, [topics, clusterMap]);

  // Build selectedNodeData including neighbors
  const selectedNodeData = useMemo<NodeData | null>(() => {
    if (!selectedNode) return null;
    const t = topics.find(t => t.id === selectedNode);
    const graph = graphRef.current;
    if (!t) return null;
    const neighbors = graph && graph.hasNode(selectedNode) ? graph.neighbors(selectedNode) : [];
    const neighborTitles = neighbors.map(nid => {
      const nt = topics.find(x => x.id === nid);
      return nt?.title || '';
    }).filter(Boolean);
    return {
      id: t.id, slug: t.slug, title: t.title, category: t.category,
      postCount: t.post_count || 0, status: t.status, cluster: clusterMap.get(t.category) ?? 0,
      degree: neighbors.length, neighbors, neighborTitles,
    };
  }, [selectedNode, topics, clusterMap]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return topics.filter(t => t.title.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, topics]);

  // Compute which nodes are "important" — top N by degree
  const importantNodes = useRef<Set<string>>(new Set());

  // ─── Build graph + Sigma ───
  useEffect(() => {
    if (!containerRef.current || topics.length === 0) return;

    const graph = new Graph();
    graphRef.current = graph;

    // Add nodes
    for (const t of topics) {
      const cluster = clusterMap.get(t.category) ?? 0;
      const hex = hexFromHsl(CLUSTER_PALETTE[cluster % CLUSTER_PALETTE.length]);
      graph.addNode(t.id, {
        label: t.title,
        size: Math.max(5, Math.min(30, 5 + (t.post_count || 0) * 2)),
        color: hex,
        originalColor: hex,
        slug: t.slug,
        category: t.category,
        postCount: t.post_count || 0,
        status: t.status,
        cluster,
        // forceLabel will be set after centrality
        forceLabel: false,
      });
    }

    // Add edges
    const nodeIds = new Set(topics.map(t => t.id));
    for (const r of relations) {
      if (nodeIds.has(r.source_topic_id) && nodeIds.has(r.target_topic_id)) {
        const srcCluster = clusterMap.get(topics.find(t => t.id === r.source_topic_id)?.category || '') ?? 0;
        const tgtCluster = clusterMap.get(topics.find(t => t.id === r.target_topic_id)?.category || '') ?? 0;
        const sameCluster = srcCluster === tgtCluster;
        const srcHex = hexFromHsl(CLUSTER_PALETTE[srcCluster % CLUSTER_PALETTE.length]);
        try {
          graph.addEdge(r.source_topic_id, r.target_topic_id, {
            size: sameCluster ? 1.5 : 0.8,
            color: sameCluster ? hexWithAlpha(srcHex, 0.35) : '#88888822',
            originalColor: sameCluster ? hexWithAlpha(srcHex, 0.35) : '#88888822',
            type: 'line',
          });
        } catch { /* edge exists */ }
      }
    }

    // Layout
    circular.assign(graph, { scale: 100 });

    // Degree centrality for sizing + importance
    try {
      const centralities = degreeCentrality(graph);
      const sorted = Object.entries(centralities).sort((a, b) => b[1] - a[1]);
      const topN = Math.max(3, Math.ceil(topics.length * 0.25));
      const important = new Set(sorted.slice(0, topN).map(([id]) => id));
      importantNodes.current = important;

      graph.forEachNode((node) => {
        const currentSize = graph.getNodeAttribute(node, 'size') as number;
        const centrality = centralities[node] || 0;
        const newSize = Math.max(5, currentSize + centrality * 25);
        graph.setNodeAttribute(node, 'size', newSize);
        graph.setNodeAttribute(node, 'forceLabel', important.has(node));
      });
    } catch { /* ok */ }

    // ForceAtlas2
    forceAtlas2.assign(graph, {
      iterations: 150,
      settings: {
        gravity: 1.5,
        scalingRatio: 12,
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        strongGravityMode: false,
        slowDown: 8,
        outboundAttractionDistribution: true,
        linLogMode: true,
      },
    });

    // ─── Sigma renderer ───
    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      enableEdgeEvents: false,
      defaultEdgeType: 'line',
      labelFont: "'Inter', system-ui, sans-serif",
      labelSize: 11,
      labelWeight: '500',
      labelColor: { color: '#555' },
      stagePadding: 60,
      // Only show labels for large / important nodes at default zoom
      labelRenderedSizeThreshold: 10,
      defaultNodeColor: '#aaa',
      defaultEdgeColor: '#ddd',
      // Spread labels out, less overlap
      labelDensity: 0.08,
      labelGridCellSize: 180,
      zIndex: true,
      // Node border for selected
      nodeReducer: undefined,
      edgeReducer: undefined,
    });
    sigmaRef.current = renderer;

    // ─── Unified reducer that handles hover + selection ───
    function applyReducers() {
      const hovered = hoveredRef.current;
      const selected = selectedRef.current;
      const focus = hovered || selected;

      if (!focus || !graph.hasNode(focus)) {
        renderer.setSetting('nodeReducer', (node: string, data: Partial<NodeDisplayData>) => {
          const res = { ...data };
          // Only show labels for forceLabel (important) nodes at default zoom
          if (!graph.getNodeAttribute(node, 'forceLabel')) {
            // Let sigma's threshold handle it
          }
          return res;
        });
        renderer.setSetting('edgeReducer', null);
        renderer.refresh();
        return;
      }

      const neighborSet = new Set(graph.neighbors(focus));
      neighborSet.add(focus);

      renderer.setSetting('nodeReducer', (node: string, data: Partial<NodeDisplayData>) => {
        const res = { ...data };
        if (node === focus) {
          res.highlighted = true;
          res.zIndex = 10;
          (res as any).forceLabel = true;
          // Make selected node bigger
          res.size = ((data.size as number) || 8) * 1.3;
        } else if (neighborSet.has(node)) {
          res.highlighted = true;
          res.zIndex = 5;
          (res as any).forceLabel = true;
        } else {
          // Fade out non-connected
          const origColor = graph.getNodeAttribute(node, 'originalColor') as string;
          res.color = hexWithAlpha(origColor, 0.08);
          res.label = '';
          res.zIndex = 0;
        }
        return res;
      });

      renderer.setSetting('edgeReducer', (edge: string, data: Partial<EdgeDisplayData>) => {
        const res = { ...data };
        const src = graph.source(edge);
        const tgt = graph.target(edge);
        if (neighborSet.has(src) && neighborSet.has(tgt) && (src === focus || tgt === focus)) {
          const focusColor = graph.getNodeAttribute(focus, 'originalColor') as string;
          res.color = hexWithAlpha(focusColor, 0.7);
          res.size = 2.5;
          res.zIndex = 5;
        } else {
          res.color = '#00000005';
          res.size = 0.3;
          res.zIndex = 0;
        }
        return res;
      });

      renderer.refresh();
    }

    // ─── Events ───
    renderer.on('enterNode', ({ node }) => {
      hoveredRef.current = node;
      containerRef.current!.style.cursor = 'pointer';
      applyReducers();
    });

    renderer.on('leaveNode', () => {
      hoveredRef.current = null;
      containerRef.current!.style.cursor = 'grab';
      applyReducers();
    });

    renderer.on('clickNode', ({ node }) => {
      const prev = selectedRef.current;
      const next = prev === node ? null : node;
      setSelectedNode(next);
      selectedRef.current = next;
      applyReducers();
    });

    renderer.on('doubleClickNode', ({ node, event }) => {
      event.preventSigmaDefault();
      const slug = graph.getNodeAttribute(node, 'slug') as string;
      if (slug) {
        if (onOpenDiscussion) onOpenDiscussion(slug);
        else navigate(`/d/${slug}`);
      }
    });

    renderer.on('clickStage', () => {
      setSelectedNode(null);
      selectedRef.current = null;
      applyReducers();
    });

    // Initial state
    applyReducers();
    containerRef.current!.style.cursor = 'grab';

    return () => {
      renderer.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    };
  }, [topics, relations, clusterMap, navigate, onOpenDiscussion]);

  // Sync selection changes from outside (e.g. search)
  useEffect(() => {
    selectedRef.current = selectedNode;
    const renderer = sigmaRef.current;
    if (renderer) {
      // Re-apply reducers
      const graph = graphRef.current;
      if (!graph) return;
      const focus = hoveredRef.current || selectedNode;
      if (!focus || !graph.hasNode(focus)) {
        renderer.setSetting('nodeReducer', (node: string, data: Partial<NodeDisplayData>) => ({ ...data }));
        renderer.setSetting('edgeReducer', null);
      } else {
        const neighborSet = new Set(graph.neighbors(focus));
        neighborSet.add(focus);
        renderer.setSetting('nodeReducer', (node: string, data: Partial<NodeDisplayData>) => {
          const res = { ...data };
          if (node === focus) { res.highlighted = true; res.zIndex = 10; (res as any).forceLabel = true; res.size = ((data.size as number) || 8) * 1.3; }
          else if (neighborSet.has(node)) { res.highlighted = true; res.zIndex = 5; (res as any).forceLabel = true; }
          else { res.color = hexWithAlpha(graph.getNodeAttribute(node, 'originalColor') as string, 0.08); res.label = ''; res.zIndex = 0; }
          return res;
        });
        renderer.setSetting('edgeReducer', (edge: string, data: Partial<EdgeDisplayData>) => {
          const res = { ...data };
          const src = graph.source(edge);
          const tgt = graph.target(edge);
          if (neighborSet.has(src) && neighborSet.has(tgt) && (src === focus || tgt === focus)) {
            res.color = hexWithAlpha(graph.getNodeAttribute(focus, 'originalColor') as string, 0.7); res.size = 2.5; res.zIndex = 5;
          } else { res.color = '#00000005'; res.size = 0.3; res.zIndex = 0; }
          return res;
        });
      }
      renderer.refresh();
    }
  }, [selectedNode]);

  // Notify parent
  useEffect(() => {
    onSelectNode?.(selectedNode, selectedNodeData);
  }, [selectedNode, selectedNodeData, onSelectNode]);

  // Camera focus
  const focusNode = useCallback((nodeId: string) => {
    const renderer = sigmaRef.current;
    const graph = graphRef.current;
    if (!renderer || !graph || !graph.hasNode(nodeId)) return;
    setSelectedNode(nodeId);
    setSearchOpen(false);
    setSearchQuery('');
    const attrs = graph.getNodeAttributes(nodeId);
    const nodePos = renderer.getNodeDisplayData(nodeId);
    if (nodePos) {
      renderer.getCamera().animate(
        { x: nodePos.x, y: nodePos.y, ratio: 0.25 },
        { duration: 400 },
      );
    }
  }, []);

  const handleOpen = useCallback((slug: string) => {
    if (onOpenDiscussion) onOpenDiscussion(slug);
    else navigate(`/d/${slug}`);
  }, [navigate, onOpenDiscussion]);

  if (topics.length < 2) return null;

  return (
    <div className={cn(
      'overflow-hidden relative',
      !fullHeight && 'rounded-xl border border-border',
      expanded && 'fixed inset-0 z-50 rounded-none',
      fullHeight && 'h-full',
    )}>
      {/* Minimal toolbar — floats over graph */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Cluster legend — compact */}
          <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded-full px-2.5 py-1 border border-border/50">
            {clusters.map(c => (
              <span
                key={c.id}
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: c.color }}
                title={`${c.label} (${c.nodeCount})`}
              />
            ))}
            <span className="text-[9px] text-muted-foreground ml-1">{topics.length} topics</span>
          </div>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          <span className="text-[9px] text-muted-foreground/60 mr-1 hidden sm:inline">scroll zoom · drag pan · click focus</span>
          {/* Search */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(o => !o)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-card/80 backdrop-blur-sm transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="flex items-center px-3 py-2 border-b border-border gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Find a topic…"
                    className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto">
                    {searchResults.map(t => (
                      <button
                        key={t.id}
                        onClick={() => focusNode(t.id)}
                        className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CLUSTER_PALETTE[(clusterMap.get(t.category) ?? 0) % CLUSTER_PALETTE.length] }} />
                        <span className="truncate">{t.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && (
                  <p className="px-3 py-3 text-xs text-muted-foreground">No topics found</p>
                )}
              </div>
            )}
          </div>
          {!fullHeight && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-card/80 backdrop-blur-sm transition-colors"
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Graph canvas — takes full space */}
      <div
        ref={containerRef}
        className="w-full h-full bg-background"
        style={{ minHeight: fullHeight ? undefined : expanded ? '100vh' : '560px' }}
      />

      {/* Contextual node panel — appears on selection, overlays bottom-right */}
      {selectedNodeData && (
        <div className="absolute bottom-4 right-4 z-20 w-72 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground leading-snug">{selectedNodeData.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      background: CLUSTER_PALETTE[selectedNodeData.cluster % CLUSTER_PALETTE.length] + '18',
                      color: CLUSTER_PALETTE[selectedNodeData.cluster % CLUSTER_PALETTE.length],
                    }}
                  >
                    {selectedNodeData.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <MessageSquare className="h-2.5 w-2.5" /> {selectedNodeData.postCount}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{selectedNodeData.degree} connections</span>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground p-0.5 shrink-0 mt-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Neighbors */}
            {selectedNodeData.neighborTitles.length > 0 && (
              <div className="mb-3">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Connected to</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedNodeData.neighborTitles.slice(0, 5).map((title, i) => (
                    <button
                      key={i}
                      onClick={() => focusNode(selectedNodeData.neighbors[i])}
                      className="text-[10px] text-muted-foreground hover:text-foreground bg-accent/60 hover:bg-accent px-1.5 py-0.5 rounded transition-colors truncate max-w-[120px]"
                    >
                      {title}
                    </button>
                  ))}
                  {selectedNodeData.neighborTitles.length > 5 && (
                    <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5">+{selectedNodeData.neighborTitles.length - 5} more</span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => handleOpen(selectedNodeData.slug)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open Discussion <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom-left: expanded cluster legend on hover */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="group">
          <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 px-3 py-2 space-y-1 opacity-60 hover:opacity-100 transition-opacity">
            {clusters.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-[10px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="text-foreground/80 font-medium">{c.label}</span>
                <span className="text-muted-foreground ml-auto">{c.nodeCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
