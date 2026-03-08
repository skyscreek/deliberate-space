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
import { Search, X, ExternalLink, Maximize2, Minimize2, MessageSquare, Sparkles, Link2, Plus, ArrowRight, Zap } from 'lucide-react';

/* ── Canvas — warm charcoal, not pure black ── */
const CANVAS_BG = 'hsl(222 10% 14%)';
const PANEL_BG = 'hsla(222, 10%, 17%, 0.94)';
const PANEL_BORDER = 'hsla(222, 8%, 28%, 0.35)';
const TEXT_DIM = 'hsla(220, 10%, 75%, 0.45)';
const TEXT_MED = 'hsla(220, 10%, 82%, 0.7)';
const TEXT_HI = 'hsla(220, 10%, 90%, 0.9)';

/* ── Cluster palette — vivid on dark ── */
const CLUSTER_PALETTE = [
  '#e8457a', '#3ec9a0', '#e8b832',
  '#a065d4', '#3dacd5', '#e07040',
  '#4a90d9', '#c75a8c',
];

function hex(h: string, a: number): string {
  const v = Math.round(a * 255).toString(16).padStart(2, '0');
  return h.length === 7 ? h + v : h.slice(0, 7) + v;
}

/* ── Short concept label (1-2 words) ── */
function concept(title: string): string {
  const c = title
    .replace(/^(should we|how to|what if|why|the case for|the case against|proposal:|topic:|discussion:)\s*/i, '')
    .replace(/\?$/, '')
    .trim();
  const w = c.split(/\s+/);
  return w.length <= 2 ? c : w.slice(0, 2).join(' ');
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
  isBroker: boolean;
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
  topConcepts: string[];
}

/* ── Component ── */
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
    const m = new Map<string, number>();
    unique.forEach((c, i) => m.set(c, i % CLUSTER_PALETTE.length));
    return m;
  }, [topics]);

  const clusters = useMemo<ClusterInfo[]>(() => {
    const groups = new Map<number, { label: string; count: number; posts: number; nodeIds: string[]; concepts: string[] }>();
    for (const t of topics) {
      const c = clusterMap.get(t.category) ?? 0;
      if (!groups.has(c)) groups.set(c, { label: t.category, count: 0, posts: 0, nodeIds: [], concepts: [] });
      const g = groups.get(c)!;
      g.count++; g.posts += t.post_count || 0; g.nodeIds.push(t.id);
      if (g.concepts.length < 3) g.concepts.push(concept(t.title));
    }
    return Array.from(groups.entries()).map(([id, g]) => ({
      id, label: g.label, color: CLUSTER_PALETTE[id % CLUSTER_PALETTE.length],
      nodeCount: g.count, totalPosts: g.posts, nodeIds: g.nodeIds, topConcepts: g.concepts,
    })).sort((a, b) => b.totalPosts - a.totalPosts);
  }, [topics, clusterMap]);

  // ── Gap / bridge analysis ──
  const gaps = useMemo<GapSuggestion[]>(() => {
    if (clusters.length < 2) return [];
    const results: GapSuggestion[] = [];
    const crossEdges = new Map<string, number>();
    const nodeCluster = new Map<string, number>();
    for (const t of topics) nodeCluster.set(t.id, clusterMap.get(t.category) ?? 0);
    for (const r of relations) {
      const cA = nodeCluster.get(r.source_topic_id), cB = nodeCluster.get(r.target_topic_id);
      if (cA !== undefined && cB !== undefined && cA !== cB) {
        const key = [Math.min(cA, cB), Math.max(cA, cB)].join('-');
        crossEdges.set(key, (crossEdges.get(key) || 0) + 1);
      }
    }
    const templates = [
      (a: ClusterInfo, b: ClusterInfo) => `How might ${a.topConcepts[0] || a.label} reshape thinking about ${b.topConcepts[0] || b.label}?`,
      (a: ClusterInfo, b: ClusterInfo) => `What tradeoffs emerge between ${a.label} and ${b.label} goals?`,
      (a: ClusterInfo, b: ClusterInfo) => `Could ${a.topConcepts[0] || a.label} approaches solve ${b.topConcepts[0] || b.label} problems?`,
      (a: ClusterInfo, b: ClusterInfo) => `Who are the hidden actors connecting ${a.label} and ${b.label}?`,
    ];
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const key = [clusters[i].id, clusters[j].id].sort((a, b) => a - b).join('-');
        const count = crossEdges.get(key) || 0;
        if (count <= 1 && clusters[i].nodeCount >= 1 && clusters[j].nodeCount >= 1) {
          results.push({
            id: `gap-${key}`, clusterA: clusters[i].label, clusterB: clusters[j].label,
            colorA: clusters[i].color, colorB: clusters[j].color,
            prompt: templates[results.length % templates.length](clusters[i], clusters[j]),
            context: count === 0 ? `No connections yet` : `Only ${count} weak link`,
            bridgeNodes: [clusters[i].nodeIds[0], clusters[j].nodeIds[0]].filter(Boolean),
          });
        }
      }
    }
    return results.slice(0, 4);
  }, [clusters, relations, topics, clusterMap]);

  const importantNodes = useRef<Set<string>>(new Set());
  const centralityMap = useRef<Record<string, number>>({});

  const selectedNodeData = useMemo<NodeData | null>(() => {
    if (!selectedNode) return null;
    const t = topics.find(t => t.id === selectedNode);
    const graph = graphRef.current;
    if (!t) return null;
    const neighbors = graph && graph.hasNode(selectedNode) ? graph.neighbors(selectedNode) : [];
    const neighborTitles = neighbors.map(nid => topics.find(x => x.id === nid)?.title || '').filter(Boolean);
    const neighborCategories = neighbors.map(nid => topics.find(x => x.id === nid)?.category || '').filter(Boolean);
    const uniqueClusters = [...new Set(neighborCategories)];
    const bridged = uniqueClusters.filter(c => c !== t.category);
    return {
      id: t.id, slug: t.slug, title: t.title, shortLabel: concept(t.title),
      category: t.category, postCount: t.post_count || 0, status: t.status,
      cluster: clusterMap.get(t.category) ?? 0, degree: neighbors.length,
      neighbors, neighborTitles, neighborCategories,
      bridgeScore: uniqueClusters.length, bridgedClusters: bridged,
      centrality: centralityMap.current[selectedNode] || 0,
      isBroker: bridged.length > 0,
    };
  }, [selectedNode, topics, clusterMap]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return topics.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8);
  }, [searchQuery, topics]);

  // ─── Build graph + Sigma ───
  useEffect(() => {
    if (!containerRef.current || topics.length === 0) return;
    const graph = new Graph();
    graphRef.current = graph;

    for (const t of topics) {
      const cl = clusterMap.get(t.category) ?? 0;
      const color = CLUSTER_PALETTE[cl % CLUSTER_PALETTE.length];
      graph.addNode(t.id, {
        label: concept(t.title),
        fullTitle: t.title,
        size: Math.max(6, Math.min(28, 6 + (t.post_count || 0) * 1.8)),
        color, originalColor: color,
        slug: t.slug, category: t.category, postCount: t.post_count || 0,
        status: t.status, cluster: cl, forceLabel: false,
      });
    }

    // ── Explicit edges ──
    const nodeIds = new Set(topics.map(t => t.id));
    const edgeSet = new Set<string>();
    for (const r of relations) {
      if (nodeIds.has(r.source_topic_id) && nodeIds.has(r.target_topic_id)) {
        const eKey = [r.source_topic_id, r.target_topic_id].sort().join('|');
        if (edgeSet.has(eKey)) continue;
        edgeSet.add(eKey);
        const srcCl = clusterMap.get(topics.find(t => t.id === r.source_topic_id)?.category || '') ?? 0;
        const tgtCl = clusterMap.get(topics.find(t => t.id === r.target_topic_id)?.category || '') ?? 0;
        const same = srcCl === tgtCl;
        const srcColor = CLUSTER_PALETTE[srcCl % CLUSTER_PALETTE.length];
        try {
          graph.addEdge(r.source_topic_id, r.target_topic_id, {
            size: same ? 2.5 : 1.8,
            color: same ? hex(srcColor, 0.55) : hex('#8899aa', 0.35),
            originalColor: same ? hex(srcColor, 0.55) : hex('#8899aa', 0.35),
            originalSize: same ? 2.5 : 1.8,
            type: 'line', isCrossCluster: !same, isInferred: false,
          });
        } catch { /* dup */ }
      }
    }

    // ── Inferred edges: same-category topics without explicit connection ──
    // This adds relational density even with sparse explicit relations
    const byCategory = new Map<string, string[]>();
    for (const t of topics) {
      const arr = byCategory.get(t.category) || [];
      arr.push(t.id);
      byCategory.set(t.category, arr);
    }
    for (const [cat, ids] of byCategory.entries()) {
      if (ids.length < 2) continue;
      const cl = clusterMap.get(cat) ?? 0;
      const clColor = CLUSTER_PALETTE[cl % CLUSTER_PALETTE.length];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const eKey = [ids[i], ids[j]].sort().join('|');
          if (edgeSet.has(eKey)) continue;
          edgeSet.add(eKey);
          try {
            graph.addEdge(ids[i], ids[j], {
              size: 1.0,
              color: hex(clColor, 0.2),
              originalColor: hex(clColor, 0.2),
              originalSize: 1.0,
              type: 'line', isCrossCluster: false, isInferred: true,
            });
          } catch { /* dup */ }
        }
      }
    }

    // Layout
    circular.assign(graph, { scale: 80 });
    try {
      const centralities = degreeCentrality(graph);
      centralityMap.current = centralities;
      const sorted = Object.entries(centralities).sort((a, b) => b[1] - a[1]);
      const topN = Math.max(3, Math.ceil(topics.length * 0.3));
      const important = new Set(sorted.slice(0, topN).map(([id]) => id));
      importantNodes.current = important;
      graph.forEachNode((node) => {
        const sz = graph.getNodeAttribute(node, 'size') as number;
        const c = centralities[node] || 0;
        graph.setNodeAttribute(node, 'size', Math.max(6, sz + c * 24));
        graph.setNodeAttribute(node, 'forceLabel', important.has(node));
      });
    } catch { /* ok */ }

    forceAtlas2.assign(graph, {
      iterations: 250,
      settings: {
        gravity: 3,
        scalingRatio: 6,
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        strongGravityMode: false,
        slowDown: 5,
        outboundAttractionDistribution: true,
        linLogMode: true,
      },
    });

    // Custom label draw — no background box, text shadow for readability
    function drawNodeLabel(
      context: CanvasRenderingContext2D,
      data: any,
      settings: any,
    ) {
      if (!data.label) return;
      const size = settings.labelSize;
      const font = settings.labelFont;
      const weight = settings.labelWeight || '500';
      context.font = `${weight} ${size}px ${font}`;
      context.fillStyle = (data as any).forceLabel
        ? 'hsla(220, 10%, 88%, 0.95)'
        : 'hsla(220, 10%, 75%, 0.75)';
      context.shadowColor = 'hsla(222, 10%, 5%, 0.9)';
      context.shadowBlur = 5;
      context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
      context.shadowColor = 'transparent';
      context.shadowBlur = 0;
    }

    // Custom hover draw — dark background instead of white
    function drawNodeHover(
      context: CanvasRenderingContext2D,
      data: any,
      settings: any,
    ) {
      const size = settings.labelSize + 2;
      const font = settings.labelFont;
      const weight = '600';
      const label = data.label || '';
      if (!label) return;
      context.font = `${weight} ${size}px ${font}`;
      const textWidth = context.measureText(label).width;
      const padding = 6;
      const x = data.x + data.size + 3;
      const y = data.y - size / 2 - padding;
      // Dark rounded background
      const radius = 4;
      context.fillStyle = 'hsla(222, 10%, 12%, 0.92)';
      context.beginPath();
      context.roundRect(x - padding, y, textWidth + padding * 2, size + padding * 2, radius);
      context.fill();
      context.strokeStyle = 'hsla(222, 8%, 30%, 0.4)';
      context.lineWidth = 1;
      context.stroke();
      // Text
      context.fillStyle = 'hsla(220, 10%, 92%, 0.95)';
      context.fillText(label, x, data.y + size / 3);
    }


    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      enableEdgeEvents: false,
      defaultEdgeType: 'line',
      labelFont: "'Inter', system-ui, sans-serif",
      labelSize: 11,
      labelWeight: '500',
      labelColor: { color: 'hsla(220, 10%, 80%, 0.85)' },
      defaultDrawNodeLabel: drawNodeLabel,
      defaultDrawNodeHover: drawNodeHover,
      stagePadding: 60,
      labelRenderedSizeThreshold: 7,
      defaultNodeColor: '#556677',
      defaultEdgeColor: '#2a3545',
      labelDensity: 0.07,
      labelGridCellSize: 200,
      zIndex: true,
    });
    sigmaRef.current = renderer;

    // ─── Focus+Context reducer ───
    function applyReducers() {
      const focus = hoveredRef.current || selectedRef.current;
      if (!focus || !graph.hasNode(focus)) {
        renderer.setSetting('nodeReducer', (_n: string, d: Partial<NodeDisplayData>) => ({ ...d }));
        renderer.setSetting('edgeReducer', (_e: string, d: Partial<EdgeDisplayData>) => ({ ...d }));
        renderer.refresh();
        return;
      }

      const n1 = new Set(graph.neighbors(focus));
      n1.add(focus);
      const n2 = new Set<string>();
      for (const nb of n1) {
        if (nb === focus) continue;
        for (const nb2 of graph.neighbors(nb)) {
          if (!n1.has(nb2)) n2.add(nb2);
        }
      }

      renderer.setSetting('nodeReducer', (node: string, data: Partial<NodeDisplayData>) => {
        const r = { ...data };
        const orig = graph.getNodeAttribute(node, 'originalColor') as string;
        if (node === focus) {
          r.highlighted = true; r.zIndex = 10;
          (r as any).forceLabel = true;
          r.label = graph.getNodeAttribute(node, 'fullTitle') as string;
          r.size = ((data.size as number) || 6) * 1.6;
          r.color = orig;
        } else if (n1.has(node)) {
          r.highlighted = true; r.zIndex = 5;
          (r as any).forceLabel = true;
          r.color = orig;
          r.size = ((data.size as number) || 5) * 1.15;
        } else if (n2.has(node)) {
          r.color = hex(orig, 0.45); r.zIndex = 2;
          if (importantNodes.current.has(node)) {
            (r as any).forceLabel = true;
          } else {
            r.label = '';
          }
        } else {
          r.color = hex(orig, 0.15); r.label = ''; r.zIndex = 0;
        }
        return r;
      });

      renderer.setSetting('edgeReducer', (edge: string, data: Partial<EdgeDisplayData>) => {
        const r = { ...data };
        const src = graph.source(edge), tgt = graph.target(edge);
        const fc = graph.getNodeAttribute(focus, 'originalColor') as string;
        if ((src === focus || tgt === focus) && n1.has(src) && n1.has(tgt)) {
          r.color = hex(fc, 0.85); r.size = 3.5; r.zIndex = 5;
        } else if (n1.has(src) && n1.has(tgt)) {
          r.color = hex(fc, 0.4); r.size = 2; r.zIndex = 3;
        } else if ((n1.has(src) || n1.has(tgt)) && (n2.has(src) || n2.has(tgt))) {
          r.color = hex('#8899aa', 0.2); r.size = 1; r.zIndex = 1;
        } else {
          r.color = hex('#556677', 0.06); r.size = 0.4; r.zIndex = 0;
        }
        return r;
      });
      renderer.refresh();
    }

    renderer.on('enterNode', ({ node }) => { hoveredRef.current = node; containerRef.current!.style.cursor = 'pointer'; applyReducers(); });
    renderer.on('leaveNode', () => { hoveredRef.current = null; containerRef.current!.style.cursor = 'grab'; applyReducers(); });
    renderer.on('clickNode', ({ node }) => {
      const next = selectedRef.current === node ? null : node;
      setSelectedNode(next); selectedRef.current = next; applyReducers();
    });
    renderer.on('doubleClickNode', ({ node, event }) => {
      event.preventSigmaDefault();
      const slug = graph.getNodeAttribute(node, 'slug') as string;
      if (slug) { onOpenDiscussion ? onOpenDiscussion(slug) : navigate(`/d/${slug}`); }
    });
    renderer.on('clickStage', () => { setSelectedNode(null); selectedRef.current = null; applyReducers(); });

    applyReducers();
    containerRef.current!.style.cursor = 'grab';
    return () => { renderer.kill(); sigmaRef.current = null; graphRef.current = null; };
  }, [topics, relations, clusterMap, navigate, onOpenDiscussion]);

  useEffect(() => {
    selectedRef.current = selectedNode;
    const r = sigmaRef.current, g = graphRef.current;
    if (!r || !g) return;
    if (!(hoveredRef.current || selectedNode) || !g.hasNode(hoveredRef.current || selectedNode || '')) {
      r.setSetting('nodeReducer', (_n: string, d: Partial<NodeDisplayData>) => ({ ...d }));
      r.setSetting('edgeReducer', (_e: string, d: Partial<EdgeDisplayData>) => ({ ...d }));
    } else { r.refresh(); }
  }, [selectedNode]);

  useEffect(() => { onSelectNode?.(selectedNode, selectedNodeData); }, [selectedNode, selectedNodeData, onSelectNode]);

  const focusNode = useCallback((nodeId: string) => {
    const r = sigmaRef.current, g = graphRef.current;
    if (!r || !g || !g.hasNode(nodeId)) return;
    setSelectedNode(nodeId); setSearchOpen(false); setSearchQuery('');
    const pos = r.getNodeDisplayData(nodeId);
    if (pos) r.getCamera().animate({ x: pos.x, y: pos.y, ratio: 0.3 }, { duration: 400 });
  }, []);

  const handleOpen = useCallback((slug: string) => {
    onOpenDiscussion ? onOpenDiscussion(slug) : navigate(`/d/${slug}`);
  }, [navigate, onOpenDiscussion]);

  // ── Broker nodes (connect multiple clusters) ──
  const brokerCount = useMemo(() => {
    if (!graphRef.current || topics.length < 2) return 0;
    let count = 0;
    for (const t of topics) {
      const g = graphRef.current;
      if (!g.hasNode(t.id)) continue;
      const nbs = g.neighbors(t.id);
      const cats = new Set(nbs.map(n => topics.find(x => x.id === n)?.category).filter(Boolean));
      if (cats.size > 1) count++;
    }
    return count;
  }, [topics, selectedNode]);

  if (topics.length < 2) return null;

  return (
    <div className={cn(
      'overflow-hidden relative',
      !fullHeight && 'rounded-xl border border-border/40',
      expanded && 'fixed inset-0 z-50 rounded-none',
      fullHeight && 'h-full',
    )}>
      <div ref={containerRef} className="w-full h-full" style={{
        minHeight: fullHeight ? undefined : expanded ? '100vh' : '560px',
        background: CANVAS_BG,
      }} />

      {/* ── Top bar — search + expand only ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end px-3 py-2 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span className="text-[9px] mr-1 hidden sm:inline" style={{ color: TEXT_DIM }}>scroll · drag · dblclick</span>
          <div className="relative">
            <button onClick={() => setSearchOpen(o => !o)} className="p-1.5 rounded-full transition-colors" style={{ color: TEXT_DIM }}>
              <Search className="h-3.5 w-3.5" />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-lg shadow-2xl z-50 overflow-hidden" style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
                <div className="flex items-center px-3 py-2 gap-2" style={{ borderBottom: `1px solid ${PANEL_BORDER}` }}>
                  <Search className="h-3.5 w-3.5 shrink-0" style={{ color: TEXT_DIM }} />
                  <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Find a topic…"
                    className="flex-1 text-xs bg-transparent outline-none" style={{ color: TEXT_HI }}
                  />
                  {searchQuery && <button onClick={() => setSearchQuery('')} style={{ color: TEXT_DIM }}><X className="h-3 w-3" /></button>}
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto">
                    {searchResults.map(t => (
                      <button key={t.id} onClick={() => focusNode(t.id)}
                        className="w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 hover:bg-white/5"
                        style={{ color: TEXT_MED }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CLUSTER_PALETTE[(clusterMap.get(t.category) ?? 0) % CLUSTER_PALETTE.length] }} />
                        <span className="truncate">{t.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && <p className="px-3 py-3 text-xs" style={{ color: TEXT_DIM }}>No topics found</p>}
              </div>
            )}
          </div>
          {!fullHeight && (
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-full transition-colors" style={{ color: TEXT_DIM }}>
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Insight strip — top-right, below toolbar ── */}
      {!selectedNodeData && topics.length >= 2 && (
        <div className="absolute top-12 right-3 z-10 pointer-events-none">
          <div className="rounded-lg px-3 py-2 space-y-1" style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
            <div className="flex items-center gap-3">
              <span className="text-[10px]" style={{ color: TEXT_DIM }}>{topics.length} topics</span>
              <span className="text-[10px]" style={{ color: TEXT_DIM }}>{relations.length} links</span>
              {brokerCount > 0 && (
                <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#e8b832aa' }}>
                  <Zap className="h-2.5 w-2.5" /> {brokerCount} broker{brokerCount > 1 ? 's' : ''}
                </span>
              )}
              {gaps.length > 0 && (
                <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#e8457aaa' }}>
                  <Sparkles className="h-2.5 w-2.5" /> {gaps.length} gap{gaps.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom-left: cluster legend only ── */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="backdrop-blur-sm rounded-lg px-3 py-2 space-y-1 opacity-50 hover:opacity-100 transition-opacity"
          style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
          {clusters.map(c => (
            <button key={c.id} onClick={() => c.nodeIds[0] && focusNode(c.nodeIds[0])}
              className="flex items-center gap-2 text-[10px] w-full text-left rounded px-1 -mx-1 transition-colors hover:bg-white/5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="font-medium" style={{ color: TEXT_MED }}>{c.label}</span>
              <span className="ml-auto" style={{ color: TEXT_DIM }}>{c.nodeCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom-right: bridge opportunities OR selected node card ── */}
      {gaps.length > 0 && !selectedNodeData && (
        <div className="absolute bottom-4 right-4 z-20 max-w-[280px]">
          <div className="rounded-xl p-3 space-y-2.5 backdrop-blur-md" style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_DIM }}>
              <Sparkles className="h-3 w-3" style={{ color: '#e8b832aa' }} /> Bridge opportunities
            </div>
            {gaps.slice(0, 3).map(gap => (
              <button key={gap.id} onClick={() => gap.bridgeNodes[0] && focusNode(gap.bridgeNodes[0])} className="w-full text-left group">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: gap.colorA }} />
                  <span className="text-[9px]" style={{ color: TEXT_DIM }}>{gap.clusterA}</span>
                  <ArrowRight className="h-2.5 w-2.5 group-hover:text-amber-400/50 transition-colors" style={{ color: 'hsla(220,10%,40%,0.3)' }} />
                  <span className="w-2 h-2 rounded-full" style={{ background: gap.colorB }} />
                  <span className="text-[9px]" style={{ color: TEXT_DIM }}>{gap.clusterB}</span>
                </div>
                <p className="text-[11px] group-hover:opacity-100 opacity-70 transition-opacity leading-snug" style={{ color: TEXT_MED }}>{gap.prompt}</p>
                <p className="text-[9px] mt-0.5" style={{ color: TEXT_DIM }}>{gap.context}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Selected node card — bottom-right ── */}
      {selectedNodeData && (
        <div className="absolute bottom-4 right-4 z-20 w-80 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
          style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold leading-snug" style={{ color: TEXT_HI }}>{selectedNodeData.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: CLUSTER_PALETTE[selectedNodeData.cluster % CLUSTER_PALETTE.length] + '22', color: CLUSTER_PALETTE[selectedNodeData.cluster % CLUSTER_PALETTE.length] }}>
                    {selectedNodeData.category}
                  </span>
                  <span className="text-[10px] flex items-center gap-0.5" style={{ color: TEXT_DIM }}>
                    <MessageSquare className="h-2.5 w-2.5" /> {selectedNodeData.postCount}
                  </span>
                  <span className="text-[10px]" style={{ color: TEXT_DIM }}>{selectedNodeData.degree} links</span>
                  {selectedNodeData.isBroker && (
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#e8b832aa' }}>
                      <Zap className="h-2.5 w-2.5" /> broker
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-0.5 shrink-0 mt-0.5 transition-colors" style={{ color: TEXT_DIM }}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: TEXT_DIM }}>Why it matters</span>
              <p className="text-[11px] leading-relaxed" style={{ color: TEXT_MED }}>
                {selectedNodeData.isBroker
                  ? `Bridges ${selectedNodeData.bridgedClusters.join(' and ')} — a latent broker connecting ${selectedNodeData.bridgeScore} discourse clusters.`
                  : selectedNodeData.degree >= 3
                    ? `Central node in ${selectedNodeData.category} with ${selectedNodeData.degree} connections. High local influence.`
                    : selectedNodeData.degree === 0
                      ? `Isolated topic — not yet connected to the wider discourse. Needs links.`
                      : `Part of ${selectedNodeData.category}. Could gain insight from cross-cluster connections.`
                }
              </p>
            </div>

            {selectedNodeData.neighborTitles.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: TEXT_DIM }}>Connected to</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNodeData.neighborTitles.slice(0, 6).map((title, i) => (
                    <button key={i} onClick={() => focusNode(selectedNodeData.neighbors[i])}
                      className="text-[10px] px-1.5 py-0.5 rounded transition-colors truncate max-w-[140px]"
                      style={{ color: TEXT_MED, background: 'hsla(220,10%,25%,0.5)' }}>
                      {concept(title)}
                    </button>
                  ))}
                  {selectedNodeData.neighborTitles.length > 6 && (
                    <span className="text-[10px] px-1 py-0.5" style={{ color: TEXT_DIM }}>+{selectedNodeData.neighborTitles.length - 6}</span>
                  )}
                </div>
              </div>
            )}

            {selectedNodeData.bridgedClusters.length > 0 && (
              <div className="rounded-lg px-3 py-2 space-y-1" style={{ background: 'hsla(45,80%,55%,0.06)', border: '1px solid hsla(45,80%,55%,0.1)' }}>
                <span className="text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'hsla(45,80%,60%,0.6)' }}>
                  <Plus className="h-2.5 w-2.5" /> Suggested discussion
                </span>
                <p className="text-[10px] leading-snug" style={{ color: TEXT_MED }}>
                  How does {concept(selectedNodeData.title)} inform {selectedNodeData.bridgedClusters[0]} thinking?
                </p>
              </div>
            )}

            <button onClick={() => handleOpen(selectedNodeData.slug)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'hsla(220,10%,30%,0.5)', color: TEXT_HI }}>
              Open Discussion <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
