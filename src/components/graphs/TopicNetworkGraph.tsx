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
import { Search, X, ExternalLink, Maximize2, Minimize2, MessageSquare, Sparkles, Link2, Plus, ArrowRight } from 'lucide-react';

/* ── Softer dark canvas — charcoal/graphite ── */
const CANVAS_BG = 'hsl(220 12% 13%)';
const OVERLAY_BG = 'hsla(220, 12%, 15%, 0.92)';
const OVERLAY_BORDER = 'hsla(220, 12%, 30%, 0.3)';

/* ── Cluster palette — vivid on dark bg ── */
const CLUSTER_PALETTE = [
  '#e8457a', '#3ec9a0', '#e8b832',
  '#a065d4', '#3dacd5', '#e07040',
  '#4a90d9', '#c75a8c',
];

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex.length === 7 ? hex + a : hex.slice(0, 7) + a;
}

/* ── Extract short conceptual label ── */
function shortLabel(title: string): string {
  const cleaned = title
    .replace(/^(should we|how to|what if|why|the case for|the case against|proposal:|topic:|discussion:)\s*/i, '')
    .replace(/\?$/, '');
  const words = cleaned.split(/\s+/);
  if (words.length <= 2) return cleaned;
  return words.slice(0, 2).join(' ');
}

/* ── Types ── */
export interface NodeData {
  id: string;
  slug: string;
  title: string;
  shortLabel: string;
  category: string;
  postCount: number;
  status: string;
  cluster: number;
  degree: number;
  neighbors: string[];
  neighborTitles: string[];
  neighborCategories: string[];
  bridgeScore: number;
  bridgedClusters: string[];
  centrality: number;
}

export interface GapSuggestion {
  id: string;
  clusterA: string;
  clusterB: string;
  colorA: string;
  colorB: string;
  prompt: string;
  context: string;
  bridgeNodes: string[];
}

interface ClusterInfo {
  id: number;
  label: string;
  color: string;
  nodeCount: number;
  totalPosts: number;
  nodeIds: string[];
  topTopics: string[];
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

  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedNode;

  const clusterMap = useMemo(() => {
    const unique = [...new Set(topics.map(t => t.category))];
    const map = new Map<string, number>();
    unique.forEach((c, i) => map.set(c, i % CLUSTER_PALETTE.length));
    return map;
  }, [topics]);

  const clusters = useMemo<ClusterInfo[]>(() => {
    const groups = new Map<number, { label: string; count: number; posts: number; nodeIds: string[]; topTopics: string[] }>();
    for (const t of topics) {
      const c = clusterMap.get(t.category) ?? 0;
      if (!groups.has(c)) groups.set(c, { label: t.category, count: 0, posts: 0, nodeIds: [], topTopics: [] });
      const g = groups.get(c)!;
      g.count++;
      g.posts += t.post_count || 0;
      g.nodeIds.push(t.id);
      if (g.topTopics.length < 3) g.topTopics.push(shortLabel(t.title));
    }
    return Array.from(groups.entries()).map(([id, g]) => ({
      id, label: g.label,
      color: CLUSTER_PALETTE[id % CLUSTER_PALETTE.length],
      nodeCount: g.count, totalPosts: g.posts, nodeIds: g.nodeIds,
      topTopics: g.topTopics,
    })).sort((a, b) => b.totalPosts - a.totalPosts);
  }, [topics, clusterMap]);

  // ── Gap / bridge analysis with concrete prompts ──
  const gaps = useMemo<GapSuggestion[]>(() => {
    if (clusters.length < 2) return [];
    const results: GapSuggestion[] = [];
    const crossEdges = new Map<string, number>();
    const nodeCluster = new Map<string, number>();
    for (const t of topics) nodeCluster.set(t.id, clusterMap.get(t.category) ?? 0);
    
    for (const r of relations) {
      const cA = nodeCluster.get(r.source_topic_id);
      const cB = nodeCluster.get(r.target_topic_id);
      if (cA !== undefined && cB !== undefined && cA !== cB) {
        const key = [Math.min(cA, cB), Math.max(cA, cB)].join('-');
        crossEdges.set(key, (crossEdges.get(key) || 0) + 1);
      }
    }

    // Generate concrete bridge prompts
    const promptTemplates = [
      (a: ClusterInfo, b: ClusterInfo) => `What happens when ${a.topTopics[0] || a.label} meets ${b.topTopics[0] || b.label}?`,
      (a: ClusterInfo, b: ClusterInfo) => `Could ${a.label} solutions apply to ${b.label} challenges?`,
      (a: ClusterInfo, b: ClusterInfo) => `Who works at the intersection of ${a.label} and ${b.label}?`,
      (a: ClusterInfo, b: ClusterInfo) => `Start a discussion bridging ${a.topTopics[0] || a.label} and ${b.topTopics[0] || b.label}`,
    ];

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const key = [clusters[i].id, clusters[j].id].sort((a, b) => a - b).join('-');
        const count = crossEdges.get(key) || 0;
        if (count <= 1 && clusters[i].nodeCount >= 1 && clusters[j].nodeCount >= 1) {
          const templateIdx = results.length % promptTemplates.length;
          results.push({
            id: `gap-${key}`,
            clusterA: clusters[i].label,
            clusterB: clusters[j].label,
            colorA: clusters[i].color,
            colorB: clusters[j].color,
            prompt: promptTemplates[templateIdx](clusters[i], clusters[j]),
            context: count === 0
              ? `No connections yet between these ${clusters[i].nodeCount + clusters[j].nodeCount} topics`
              : `Only ${count} weak link between these clusters`,
            bridgeNodes: [clusters[i].nodeIds[0], clusters[j].nodeIds[0]].filter(Boolean),
          });
        }
      }
    }
    return results.slice(0, 4);
  }, [clusters, relations, topics, clusterMap]);

  const importantNodes = useRef<Set<string>>(new Set());
  const centralityMap = useRef<Record<string, number>>({});

  // Build selected node data
  const selectedNodeData = useMemo<NodeData | null>(() => {
    if (!selectedNode) return null;
    const t = topics.find(t => t.id === selectedNode);
    const graph = graphRef.current;
    if (!t) return null;
    const neighbors = graph && graph.hasNode(selectedNode) ? graph.neighbors(selectedNode) : [];
    const neighborTitles = neighbors.map(nid => topics.find(x => x.id === nid)?.title || '').filter(Boolean);
    const neighborCategories = neighbors.map(nid => topics.find(x => x.id === nid)?.category || '').filter(Boolean);
    const uniqueClusters = [...new Set(neighborCategories)];
    return {
      id: t.id, slug: t.slug, title: t.title,
      shortLabel: shortLabel(t.title),
      category: t.category,
      postCount: t.post_count || 0, status: t.status, cluster: clusterMap.get(t.category) ?? 0,
      degree: neighbors.length, neighbors, neighborTitles,
      neighborCategories,
      bridgeScore: uniqueClusters.length,
      bridgedClusters: uniqueClusters.filter(c => c !== t.category),
      centrality: centralityMap.current[selectedNode] || 0,
    };
  }, [selectedNode, topics, clusterMap]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return topics.filter(t => t.title.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, topics]);

  // ─── Build graph + Sigma ───
  useEffect(() => {
    if (!containerRef.current || topics.length === 0) return;

    const graph = new Graph();
    graphRef.current = graph;

    for (const t of topics) {
      const cluster = clusterMap.get(t.category) ?? 0;
      const color = CLUSTER_PALETTE[cluster % CLUSTER_PALETTE.length];
      graph.addNode(t.id, {
        label: shortLabel(t.title),
        fullTitle: t.title,
        size: Math.max(5, Math.min(26, 5 + (t.post_count || 0) * 1.5)),
        color,
        originalColor: color,
        slug: t.slug,
        category: t.category,
        postCount: t.post_count || 0,
        status: t.status,
        cluster,
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
        const srcColor = CLUSTER_PALETTE[srcCluster % CLUSTER_PALETTE.length];
        try {
          graph.addEdge(r.source_topic_id, r.target_topic_id, {
            size: sameCluster ? 2.5 : 1.5,
            color: sameCluster ? hexWithAlpha(srcColor, 0.5) : hexWithAlpha('#8899aa', 0.3),
            originalColor: sameCluster ? hexWithAlpha(srcColor, 0.5) : hexWithAlpha('#8899aa', 0.3),
            originalSize: sameCluster ? 2.5 : 1.5,
            type: 'line',
            isCrossCluster: !sameCluster,
          });
        } catch { /* edge exists */ }
      }
    }

    // Layout
    circular.assign(graph, { scale: 80 });

    // Degree centrality
    try {
      const centralities = degreeCentrality(graph);
      centralityMap.current = centralities;
      const sorted = Object.entries(centralities).sort((a, b) => b[1] - a[1]);
      const topN = Math.max(3, Math.ceil(topics.length * 0.25));
      const important = new Set(sorted.slice(0, topN).map(([id]) => id));
      importantNodes.current = important;

      graph.forEachNode((node) => {
        const currentSize = graph.getNodeAttribute(node, 'size') as number;
        const centrality = centralities[node] || 0;
        graph.setNodeAttribute(node, 'size', Math.max(5, currentSize + centrality * 22));
        graph.setNodeAttribute(node, 'forceLabel', important.has(node));
      });
    } catch { /* ok */ }

    // ForceAtlas2 — tighter clusters
    forceAtlas2.assign(graph, {
      iterations: 200,
      settings: {
        gravity: 2.5,
        scalingRatio: 8,
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        strongGravityMode: false,
        slowDown: 6,
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
      labelColor: { color: '#c8cdd3' },
      stagePadding: 50,
      labelRenderedSizeThreshold: 8,
      defaultNodeColor: '#667788',
      defaultEdgeColor: '#3a4555',
      labelDensity: 0.08,
      labelGridCellSize: 180,
      zIndex: true,
    });
    sigmaRef.current = renderer;

    // ─── Focus+Context reducer ───
    function applyReducers() {
      const hovered = hoveredRef.current;
      const selected = selectedRef.current;
      const focus = hovered || selected;

      if (!focus || !graph.hasNode(focus)) {
        renderer.setSetting('nodeReducer', (_node: string, data: Partial<NodeDisplayData>) => ({ ...data }));
        renderer.setSetting('edgeReducer', (_edge: string, data: Partial<EdgeDisplayData>) => ({ ...data }));
        renderer.refresh();
        return;
      }

      // 1st order neighbors
      const neighbors1 = new Set(graph.neighbors(focus));
      neighbors1.add(focus);

      // 2nd order neighbors
      const neighbors2 = new Set<string>();
      for (const n1 of neighbors1) {
        if (n1 === focus) continue;
        for (const n2 of graph.neighbors(n1)) {
          if (!neighbors1.has(n2)) neighbors2.add(n2);
        }
      }

      renderer.setSetting('nodeReducer', (node: string, data: Partial<NodeDisplayData>) => {
        const res = { ...data };
        if (node === focus) {
          res.highlighted = true;
          res.zIndex = 10;
          (res as any).forceLabel = true;
          res.label = graph.getNodeAttribute(node, 'fullTitle') as string;
          res.size = ((data.size as number) || 6) * 1.5;
          res.color = graph.getNodeAttribute(node, 'originalColor') as string;
        } else if (neighbors1.has(node)) {
          res.highlighted = true;
          res.zIndex = 5;
          (res as any).forceLabel = true;
          res.color = graph.getNodeAttribute(node, 'originalColor') as string;
          res.size = ((data.size as number) || 5) * 1.1;
        } else if (neighbors2.has(node)) {
          const origColor = graph.getNodeAttribute(node, 'originalColor') as string;
          res.color = hexWithAlpha(origColor, 0.4);
          res.zIndex = 2;
          // Show label for important 2nd-order nodes
          if (importantNodes.current.has(node)) {
            (res as any).forceLabel = true;
            res.label = graph.getNodeAttribute(node, 'label') as string;
          } else {
            res.label = '';
          }
        } else {
          const origColor = graph.getNodeAttribute(node, 'originalColor') as string;
          res.color = hexWithAlpha(origColor, 0.18);
          res.label = '';
          res.zIndex = 0;
        }
        return res;
      });

      renderer.setSetting('edgeReducer', (edge: string, data: Partial<EdgeDisplayData>) => {
        const res = { ...data };
        const src = graph.source(edge);
        const tgt = graph.target(edge);
        const focusColor = graph.getNodeAttribute(focus, 'originalColor') as string;

        if ((src === focus || tgt === focus) && neighbors1.has(src) && neighbors1.has(tgt)) {
          res.color = hexWithAlpha(focusColor, 0.8);
          res.size = 3.5;
          res.zIndex = 5;
        } else if (neighbors1.has(src) && neighbors1.has(tgt)) {
          res.color = hexWithAlpha(focusColor, 0.35);
          res.size = 2;
          res.zIndex = 3;
        } else if ((neighbors1.has(src) || neighbors1.has(tgt)) && (neighbors2.has(src) || neighbors2.has(tgt))) {
          res.color = hexWithAlpha('#8899aa', 0.18);
          res.size = 1;
          res.zIndex = 1;
        } else {
          res.color = hexWithAlpha('#556677', 0.07);
          res.size = 0.5;
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

    applyReducers();
    containerRef.current!.style.cursor = 'grab';

    return () => {
      renderer.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    };
  }, [topics, relations, clusterMap, navigate, onOpenDiscussion]);

  // Sync selection
  useEffect(() => {
    selectedRef.current = selectedNode;
    const renderer = sigmaRef.current;
    const graph = graphRef.current;
    if (!renderer || !graph) return;
    const focus = hoveredRef.current || selectedNode;
    if (!focus || !graph.hasNode(focus)) {
      renderer.setSetting('nodeReducer', (_n: string, d: Partial<NodeDisplayData>) => ({ ...d }));
      renderer.setSetting('edgeReducer', (_e: string, d: Partial<EdgeDisplayData>) => ({ ...d }));
    } else {
      renderer.refresh();
    }
  }, [selectedNode]);

  useEffect(() => {
    onSelectNode?.(selectedNode, selectedNodeData);
  }, [selectedNode, selectedNodeData, onSelectNode]);

  const focusNode = useCallback((nodeId: string) => {
    const renderer = sigmaRef.current;
    const graph = graphRef.current;
    if (!renderer || !graph || !graph.hasNode(nodeId)) return;
    setSelectedNode(nodeId);
    setSearchOpen(false);
    setSearchQuery('');
    const nodePos = renderer.getNodeDisplayData(nodeId);
    if (nodePos) {
      renderer.getCamera().animate({ x: nodePos.x, y: nodePos.y, ratio: 0.3 }, { duration: 400 });
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
      !fullHeight && 'rounded-xl border border-border/50',
      expanded && 'fixed inset-0 z-50 rounded-none',
      fullHeight && 'h-full',
    )}>
      {/* Graph canvas — charcoal/graphite background */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          minHeight: fullHeight ? undefined : expanded ? '100vh' : '560px',
          background: CANVAS_BG,
        }}
      />

      {/* ── Top toolbar ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 pointer-events-none">
        {/* Cluster legend */}
        <div className="flex items-center gap-1.5 pointer-events-auto rounded-full px-3 py-1.5 border" style={{ background: OVERLAY_BG, borderColor: OVERLAY_BORDER }}>
          {clusters.map(c => (
            <button
              key={c.id}
              className="flex items-center gap-1 group"
              title={`${c.label} — ${c.nodeCount} topics`}
              onClick={() => { if (c.nodeIds[0]) focusNode(c.nodeIds[0]); }}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ background: c.color }} />
              <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors hidden sm:inline">{c.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span className="text-[9px] text-white/25 mr-1 hidden sm:inline">scroll zoom · drag pan · dblclick open</span>
          <div className="relative">
            <button
              onClick={() => setSearchOpen(o => !o)}
              className="text-white/40 hover:text-white/80 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-lg shadow-2xl z-50 overflow-hidden border" style={{ background: OVERLAY_BG, borderColor: OVERLAY_BORDER }}>
                <div className="flex items-center px-3 py-2 gap-2" style={{ borderBottom: `1px solid ${OVERLAY_BORDER}` }}>
                  <Search className="h-3.5 w-3.5 text-white/40 shrink-0" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Find a topic…"
                    className="flex-1 text-xs bg-transparent outline-none text-white/90 placeholder:text-white/30"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white/80">
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
                        className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CLUSTER_PALETTE[(clusterMap.get(t.category) ?? 0) % CLUSTER_PALETTE.length] }} />
                        <span className="truncate">{t.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && (
                  <p className="px-3 py-3 text-xs text-white/30">No topics found</p>
                )}
              </div>
            )}
          </div>
          {!fullHeight && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-white/40 hover:text-white/80 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Gaps / bridge suggestions — bottom-left ── */}
      {gaps.length > 0 && !selectedNodeData && (
        <div className="absolute bottom-4 left-4 z-20 max-w-[280px]">
          <div className="rounded-xl p-3 space-y-2.5 backdrop-blur-md border" style={{ background: OVERLAY_BG, borderColor: OVERLAY_BORDER }}>
            <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-semibold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-amber-400/70" /> Bridge opportunities
            </div>
            {gaps.slice(0, 3).map(gap => (
              <button
                key={gap.id}
                onClick={() => { if (gap.bridgeNodes[0]) focusNode(gap.bridgeNodes[0]); }}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: gap.colorA }} />
                  <span className="text-[9px] text-white/30">{gap.clusterA}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-white/15 group-hover:text-amber-400/50 transition-colors" />
                  <span className="w-2 h-2 rounded-full" style={{ background: gap.colorB }} />
                  <span className="text-[9px] text-white/30">{gap.clusterB}</span>
                </div>
                <p className="text-[11px] text-white/50 group-hover:text-white/80 transition-colors leading-snug">
                  {gap.prompt}
                </p>
                <p className="text-[9px] text-white/20 mt-0.5">{gap.context}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Selected node context card — bottom-right ── */}
      {selectedNodeData && (
        <div className="absolute bottom-4 right-4 z-20 w-80 backdrop-blur-md border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200" style={{ background: OVERLAY_BG, borderColor: OVERLAY_BORDER }}>
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white/90 leading-snug">{selectedNodeData.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      background: CLUSTER_PALETTE[selectedNodeData.cluster % CLUSTER_PALETTE.length] + '25',
                      color: CLUSTER_PALETTE[selectedNodeData.cluster % CLUSTER_PALETTE.length],
                    }}
                  >
                    {selectedNodeData.category}
                  </span>
                  <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                    <MessageSquare className="h-2.5 w-2.5" /> {selectedNodeData.postCount} posts
                  </span>
                  <span className="text-[10px] text-white/40">{selectedNodeData.degree} connections</span>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-white/30 hover:text-white/70 p-0.5 shrink-0 mt-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Why it matters */}
            <div className="space-y-1">
              <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">Why it matters</span>
              <p className="text-[11px] text-white/55 leading-relaxed">
                {selectedNodeData.bridgeScore > 1
                  ? `This topic bridges ${selectedNodeData.bridgedClusters.join(', ')} — a key connector across ${selectedNodeData.bridgeScore} clusters.`
                  : selectedNodeData.degree >= 3
                    ? `Central to the ${selectedNodeData.category} cluster with ${selectedNodeData.degree} direct connections.`
                    : `Part of the ${selectedNodeData.category} cluster. Could benefit from more cross-topic connections.`
                }
              </p>
            </div>

            {/* Connected topics */}
            {selectedNodeData.neighborTitles.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">Connected to</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNodeData.neighborTitles.slice(0, 5).map((title, i) => (
                    <button
                      key={i}
                      onClick={() => focusNode(selectedNodeData.neighbors[i])}
                      className="text-[10px] text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors truncate max-w-[140px]"
                    >
                      {shortLabel(title)}
                    </button>
                  ))}
                  {selectedNodeData.neighborTitles.length > 5 && (
                    <span className="text-[10px] text-white/20 px-1 py-0.5">+{selectedNodeData.neighborTitles.length - 5}</span>
                  )}
                </div>
              </div>
            )}

            {/* Missing discussion suggestion */}
            {selectedNodeData.bridgedClusters.length > 0 && (
              <div className="rounded-lg bg-amber-400/5 border border-amber-400/10 px-3 py-2 space-y-1">
                <span className="text-[9px] font-semibold text-amber-400/60 uppercase tracking-wider flex items-center gap-1">
                  <Plus className="h-2.5 w-2.5" /> Suggested new discussion
                </span>
                <p className="text-[10px] text-white/45 leading-snug">
                  Explore how {shortLabel(selectedNodeData.title)} could inform {selectedNodeData.bridgedClusters[0]} approaches
                </p>
              </div>
            )}

            <button
              onClick={() => handleOpen(selectedNodeData.slug)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition-colors"
            >
              Open Discussion <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Cluster legend — bottom-left (fallback) ── */}
      {(gaps.length === 0 || selectedNodeData) && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="backdrop-blur-sm rounded-lg border px-3 py-2 space-y-1 opacity-60 hover:opacity-100 transition-opacity" style={{ background: OVERLAY_BG, borderColor: OVERLAY_BORDER }}>
            {clusters.map(c => (
              <button
                key={c.id}
                onClick={() => c.nodeIds[0] && focusNode(c.nodeIds[0])}
                className="flex items-center gap-2 text-[10px] w-full text-left hover:bg-white/5 rounded px-1 -mx-1 transition-colors"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="text-white/60 font-medium">{c.label}</span>
                <span className="text-white/25 ml-auto">{c.nodeCount}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
