import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Graph from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { circular } from 'graphology-layout';
import { degreeCentrality } from 'graphology-metrics/centrality/degree';
import { TopicRow } from '@/hooks/useTopics';
import { TopicRelation } from '@/hooks/useTopicRelations';
import { cn } from '@/lib/utils';
import { Network, Maximize2, Minimize2, Search, X, ChevronRight, ExternalLink, Lightbulb } from 'lucide-react';

/* ── Cluster colours from design tokens ── */
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
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/* ── Types ── */
interface NodeData {
  id: string;
  slug: string;
  title: string;
  category: string;
  postCount: number;
  status: string;
  cluster: number;
}

interface ClusterInfo {
  id: number;
  label: string;
  color: string;
  nodeCount: number;
  totalPosts: number;
}

interface GapInfo {
  a: ClusterInfo;
  b: ClusterInfo;
  linkCount: number;
}

/* ── Main component ── */
interface Props {
  topics: TopicRow[];
  relations: TopicRelation[];
  /** When in full overview mode, fill parent */
  fullHeight?: boolean;
  /** Called when user selects a node */
  onSelectNode?: (nodeId: string | null, nodeData: NodeData | null) => void;
  /** Called when user wants to open a discussion */
  onOpenDiscussion?: (slug: string) => void;
}

export default function TopicNetworkGraph({ topics, relations, fullHeight, onSelectNode, onOpenDiscussion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const clusterMap = useMemo(() => assignClusterColors(topics.map(t => t.category)), [topics]);

  // Build clusters info
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
      id, label: g.label, color: CLUSTER_PALETTE[id % CLUSTER_PALETTE.length],
      nodeCount: g.count, totalPosts: g.posts,
    })).sort((a, b) => b.totalPosts - a.totalPosts);
  }, [topics, clusterMap]);

  // Build gaps
  const gaps = useMemo<GapInfo[]>(() => {
    if (clusters.length < 2) return [];
    const clusterById = new Map(clusters.map(c => [c.id, c]));
    const topicCluster = new Map(topics.map(t => [t.id, clusterMap.get(t.category) ?? 0]));
    const interLinks = new Map<string, number>();

    for (const r of relations) {
      const src = topicCluster.get(r.source_topic_id);
      const tgt = topicCluster.get(r.target_topic_id);
      if (src !== undefined && tgt !== undefined && src !== tgt) {
        const key = [Math.min(src, tgt), Math.max(src, tgt)].join('-');
        interLinks.set(key, (interLinks.get(key) ?? 0) + 1);
      }
    }

    const result: GapInfo[] = [];
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const key = [Math.min(clusters[i].id, clusters[j].id), Math.max(clusters[i].id, clusters[j].id)].join('-');
        const count = interLinks.get(key) ?? 0;
        if (count <= 1) {
          result.push({
            a: clusterById.get(clusters[i].id)!,
            b: clusterById.get(clusters[j].id)!,
            linkCount: count,
          });
        }
      }
    }
    return result.sort((a, b) => a.linkCount - b.linkCount).slice(0, 4);
  }, [clusters, topics, relations, clusterMap]);

  // Selected node data
  const selectedNodeData = useMemo<NodeData | null>(() => {
    if (!selectedNode) return null;
    const t = topics.find(t => t.id === selectedNode);
    if (!t) return null;
    return {
      id: t.id, slug: t.slug, title: t.title, category: t.category,
      postCount: t.post_count || 0, status: t.status, cluster: clusterMap.get(t.category) ?? 0,
    };
  }, [selectedNode, topics, clusterMap]);

  // Search filtered nodes
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return topics.filter(t => t.title.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, topics]);

  // Build graph and sigma
  useEffect(() => {
    if (!containerRef.current || topics.length === 0) return;

    const graph = new Graph();
    graphRef.current = graph;

    // Add nodes
    for (const t of topics) {
      const cluster = clusterMap.get(t.category) ?? 0;
      graph.addNode(t.id, {
        label: t.title,
        size: Math.max(4, Math.min(25, 4 + (t.post_count || 0) * 1.5)),
        color: hexFromHsl(CLUSTER_PALETTE[cluster % CLUSTER_PALETTE.length]),
        // Store extra data
        slug: t.slug,
        category: t.category,
        postCount: t.post_count || 0,
        status: t.status,
        cluster,
      });
    }

    // Add edges
    const nodeIds = new Set(topics.map(t => t.id));
    for (const r of relations) {
      if (nodeIds.has(r.source_topic_id) && nodeIds.has(r.target_topic_id)) {
        const srcCluster = clusterMap.get(topics.find(t => t.id === r.source_topic_id)?.category || '') ?? 0;
        const tgtCluster = clusterMap.get(topics.find(t => t.id === r.target_topic_id)?.category || '') ?? 0;
        const sameCluster = srcCluster === tgtCluster;
        
        try {
          graph.addEdge(r.source_topic_id, r.target_topic_id, {
            size: sameCluster ? 2 : 1,
            color: sameCluster
              ? hexFromHsl(CLUSTER_PALETTE[srcCluster % CLUSTER_PALETTE.length]) + '66'
              : '#88888833',
            type: 'line',
          });
        } catch {
          // Edge may already exist
        }
      }
    }

    // Apply circular layout first, then ForceAtlas2
    circular.assign(graph, { scale: 100 });

    // Compute degree centrality for sizing
    try {
      const centralities = degreeCentrality(graph);
      graph.forEachNode((node) => {
        const currentSize = graph.getNodeAttribute(node, 'size') as number;
        const centrality = centralities[node] || 0;
        graph.setNodeAttribute(node, 'size', Math.max(4, currentSize + centrality * 20));
      });
    } catch {
      // metrics may fail on disconnected graphs
    }

    // Run ForceAtlas2
    forceAtlas2.assign(graph, {
      iterations: 100,
      settings: {
        gravity: 1,
        scalingRatio: 10,
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        strongGravityMode: false,
        slowDown: 5,
        outboundAttractionDistribution: true,
      },
    });

    // Create Sigma
    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      enableEdgeEvents: false,
      defaultEdgeType: 'line',
      labelFont: 'Inter, system-ui, -apple-system, sans-serif',
      labelSize: 12,
      labelWeight: '500',
      labelColor: { color: '#374151' },
      stagePadding: 40,
      labelRenderedSizeThreshold: 6,
      nodeProgramClasses: {},
      defaultNodeColor: '#888',
      defaultEdgeColor: '#ddd',
      labelDensity: 0.15,
      labelGridCellSize: 120,
      zIndex: true,
    });

    sigmaRef.current = renderer;

    // Hover reducer: highlight neighbors
    let currentHovered: string | null = null;

    renderer.on('enterNode', ({ node }) => {
      currentHovered = node;
      setHoveredNode(node);
      renderer.setSetting('nodeReducer', (n, data) => {
        const res = { ...data };
        if (n === currentHovered) {
          res.highlighted = true;
          res.zIndex = 2;
        } else if (graph.hasNode(currentHovered!) && graph.areNeighbors(n, currentHovered!)) {
          res.highlighted = true;
          res.zIndex = 1;
        } else {
          res.color = `${data.color}22`;
          res.label = '';
          res.zIndex = 0;
        }
        return res;
      });
      renderer.setSetting('edgeReducer', (edge, data) => {
        const res = { ...data };
        const src = graph.source(edge);
        const tgt = graph.target(edge);
        if (src === currentHovered || tgt === currentHovered) {
          res.size = 3;
          const srcColor = graph.getNodeAttribute(src === currentHovered ? src : tgt, 'color');
          res.color = srcColor + 'AA';
        } else {
          res.color = '#00000008';
          res.size = 0.5;
        }
        return res;
      });
      renderer.refresh();
    });

    renderer.on('leaveNode', () => {
      currentHovered = null;
      setHoveredNode(null);
      renderer.setSetting('nodeReducer', null);
      renderer.setSetting('edgeReducer', null);
      renderer.refresh();
    });

    // Click to select
    renderer.on('clickNode', ({ node }) => {
      setSelectedNode(prev => prev === node ? null : node);
    });

    // Double-click to navigate
    renderer.on('doubleClickNode', ({ node, event }) => {
      event.preventSigmaDefault();
      const slug = graph.getNodeAttribute(node, 'slug') as string;
      if (slug) {
        if (onOpenDiscussion) onOpenDiscussion(slug);
        else navigate(`/d/${slug}`);
      }
    });

    // Click stage to deselect
    renderer.on('clickStage', () => {
      setSelectedNode(null);
    });

    return () => {
      renderer.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    };
  }, [topics, relations, clusterMap, navigate, onOpenDiscussion]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectNode?.(selectedNode, selectedNodeData);
  }, [selectedNode, selectedNodeData, onSelectNode]);

  // Apply selected-node highlighting
  useEffect(() => {
    const renderer = sigmaRef.current;
    const graph = graphRef.current;
    if (!renderer || !graph) return;

    if (selectedNode && graph.hasNode(selectedNode)) {
      renderer.setSetting('nodeReducer', (n, data) => {
        const res = { ...data };
        if (n === selectedNode) {
          res.highlighted = true;
          res.zIndex = 2;
        } else if (graph.areNeighbors(n, selectedNode)) {
          res.highlighted = true;
          res.zIndex = 1;
        } else {
          res.color = `${data.color}33`;
          res.label = '';
          res.zIndex = 0;
        }
        return res;
      });
      renderer.setSetting('edgeReducer', (edge, data) => {
        const res = { ...data };
        const src = graph.source(edge);
        const tgt = graph.target(edge);
        if (src === selectedNode || tgt === selectedNode) {
          res.size = 3;
          res.color = graph.getNodeAttribute(selectedNode, 'color') + 'BB';
        } else {
          res.color = '#00000008';
          res.size = 0.5;
        }
        return res;
      });
    } else {
      renderer.setSetting('nodeReducer', null);
      renderer.setSetting('edgeReducer', null);
    }
    renderer.refresh();
  }, [selectedNode]);

  // Camera focus on search result
  const focusNode = useCallback((nodeId: string) => {
    const renderer = sigmaRef.current;
    const graph = graphRef.current;
    if (!renderer || !graph || !graph.hasNode(nodeId)) return;

    setSelectedNode(nodeId);
    setSearchOpen(false);
    setSearchQuery('');

    const pos = graph.getNodeAttributes(nodeId);
    renderer.getCamera().animate(
      { x: pos.x as number, y: pos.y as number, ratio: 0.3 },
      { duration: 400 },
    );
  }, []);

  const handleOpen = useCallback((slug: string) => {
    if (onOpenDiscussion) onOpenDiscussion(slug);
    else navigate(`/d/${slug}`);
  }, [navigate, onOpenDiscussion]);

  if (topics.length < 2) return null;

  const showSidebar = !fullHeight; // In standalone mode, show built-in sidebar

  return (
    <div className={cn(
      'rounded-xl overflow-hidden border border-border bg-card relative',
      expanded && 'fixed inset-4 z-50',
      fullHeight && 'h-full border-0 rounded-none',
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card z-10 relative">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Discourse Network</span>
          <span className="text-[10px] text-muted-foreground ml-1">{topics.length} topics · {relations.length} links</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline">Scroll zoom · Drag pan · Click select · Dbl-click open</span>
          {/* Search */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(o => !o)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors"
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
                    placeholder="Search topics…"
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
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: CLUSTER_PALETTE[(clusterMap.get(t.category) ?? 0) % CLUSTER_PALETTE.length] }}
                        />
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
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors"
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex" style={{ height: fullHeight ? 'calc(100% - 40px)' : expanded ? 'calc(100% - 40px)' : '500px' }}>
        {/* Sigma container */}
        <div ref={containerRef} className="flex-1 relative bg-background" />

        {/* Sidebar — only in standalone mode */}
        {showSidebar && (
          <div className="w-60 border-l border-border overflow-y-auto bg-card flex-shrink-0 hidden md:block">
            <div className="p-3 space-y-4">
              {/* Clusters */}
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Topic Clusters</h4>
                <div className="space-y-1.5">
                  {clusters.map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-foreground font-medium truncate flex-1">{c.label}</span>
                      <span className="text-muted-foreground text-[10px]">{c.nodeCount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaps */}
              {gaps.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" /> Gaps
                  </h4>
                  <div className="space-y-2">
                    {gaps.map((gap, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-medium px-1.5 py-0.5 rounded" style={{ background: gap.a.color + '22', color: gap.a.color }}>{gap.a.label}</span>
                        <span className="text-muted-foreground">↔</span>
                        <span className="font-medium px-1.5 py-0.5 rounded" style={{ background: gap.b.color + '22', color: gap.b.color }}>{gap.b.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5 leading-relaxed">
                    Weakly connected clusters. Bridge with new discussions.
                  </p>
                </div>
              )}

              {/* Selected */}
              {selectedNodeData && (
                <div className="border-t border-border pt-3">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Selected</h4>
                  <p className="text-xs text-foreground font-medium leading-snug">{selectedNodeData.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded" style={{
                      background: CLUSTER_PALETTE[selectedNodeData.cluster % CLUSTER_PALETTE.length] + '22',
                      color: CLUSTER_PALETTE[selectedNodeData.cluster % CLUSTER_PALETTE.length],
                    }}>
                      {selectedNodeData.category}
                    </span>
                    <span>{selectedNodeData.postCount} posts</span>
                  </div>
                  <button
                    onClick={() => handleOpen(selectedNodeData.slug)}
                    className="mt-2 flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Open discussion <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Stats */}
              <div className="border-t border-border pt-3">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stats</h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-accent rounded p-2">
                    <div className="text-sm font-bold text-foreground">{topics.length}</div>
                    <div className="text-[9px] text-muted-foreground">Topics</div>
                  </div>
                  <div className="bg-accent rounded p-2">
                    <div className="text-sm font-bold text-foreground">{relations.length}</div>
                    <div className="text-[9px] text-muted-foreground">Links</div>
                  </div>
                  <div className="bg-accent rounded p-2">
                    <div className="text-sm font-bold text-foreground">{clusters.length}</div>
                    <div className="text-[9px] text-muted-foreground">Clusters</div>
                  </div>
                  <div className="bg-accent rounded p-2">
                    <div className="text-sm font-bold text-foreground">{gaps.length}</div>
                    <div className="text-[9px] text-muted-foreground">Gaps</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 z-10">
        {clusters.map(c => (
          <span
            key={c.id}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm bg-card/80 border"
            style={{ color: c.color, borderColor: c.color + '44' }}
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
