import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY,
  SimulationNodeDatum, SimulationLinkDatum,
} from 'd3-force';
import { TopicRow } from '@/hooks/useTopics';
import { TopicRelation } from '@/hooks/useTopicRelations';
import { cn } from '@/lib/utils';
import { Network, Lightbulb, ChevronRight, Maximize2, Minimize2, PanelRightClose, PanelRightOpen } from 'lucide-react';

/* ── Cluster colours ── */
const CLUSTER_COLORS_HSL: [number, number, number][] = [
  [340, 70, 55], [160, 60, 45], [45, 80, 55],
  [270, 55, 58], [195, 70, 50], [15, 75, 55],
];
const CLUSTER_COLORS = CLUSTER_COLORS_HSL.map(([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`);
const CLUSTER_THREE_COLORS = CLUSTER_COLORS_HSL.map(([h, s, l]) =>
  new THREE.Color(`hsl(${h}, ${s}%, ${l}%)`)
);

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
  importance: number;
  z?: number;
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
  cz: number;
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

/* ── 3D Scene components ── */
interface NodeSphereProps {
  node: GraphNode;
  isHovered: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onDoubleClick: (slug: string) => void;
}

function NodeSphere({ node, isHovered, isSelected, isDimmed, onHover, onSelect, onDoubleClick }: NodeSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = CLUSTER_THREE_COLORS[node.cluster % CLUSTER_THREE_COLORS.length];
  const radius = Math.max(0.3, Math.min(1.2, 0.3 + node.postCount * 0.1 + node.importance * 0.15));

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        (node.x ?? 0) * 0.08,
        (node.y ?? 0) * -0.08,
        (node.z ?? 0) * 0.08,
      );
      const targetScale = isHovered ? 1.3 : isSelected ? 1.15 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(node.id); }}
        onPointerLeave={(e) => { e.stopPropagation(); onHover(null); }}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node.slug); }}
      >
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.6 : isSelected ? 0.4 : 0.15}
          transparent
          opacity={isDimmed ? 0.15 : 0.9}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {/* Label */}
      {(isHovered || isSelected || !isDimmed) && (
        <Billboard
          position={[
            (node.x ?? 0) * 0.08,
            (node.y ?? 0) * -0.08 + radius + 0.35,
            (node.z ?? 0) * 0.08,
          ]}
        >
          <Text
            fontSize={isHovered ? 0.35 : 0.25}
            color={isDimmed ? '#999' : '#333'}
            anchorX="center"
            anchorY="bottom"
            font="/fonts/inter-medium.woff"
            maxWidth={8}
          >
            {node.title.length > 32 ? node.title.slice(0, 30) + '…' : node.title}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

interface EdgeLineProps {
  source: GraphNode;
  target: GraphNode;
  sameCluster: boolean;
  clusterIdx: number;
  isDimmed: boolean;
  isHighlighted: boolean;
}

function EdgeLine({ source, target, sameCluster, clusterIdx, isDimmed, isHighlighted }: EdgeLineProps) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const color = sameCluster
    ? CLUSTER_THREE_COLORS[clusterIdx % CLUSTER_THREE_COLORS.length]
    : new THREE.Color('#aaa');

  const opacity = isDimmed ? 0.03 : isHighlighted ? 0.7 : 0.15;

  useFrame(() => {
    if (lineRef.current) {
      const geo = lineRef.current.geometry;
      const positions = new Float32Array([
        (source.x ?? 0) * 0.08, (source.y ?? 0) * -0.08, (source.z ?? 0) * 0.08,
        (target.x ?? 0) * 0.08, (target.y ?? 0) * -0.08, (target.z ?? 0) * 0.08,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.attributes.position.needsUpdate = true;
    }
  });

  // Build initial geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([0, 0, 0, 0, 0, 0]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    [color, opacity]
  );

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />;
}

function ClusterLabel({ cluster }: { cluster: Cluster }) {
  return (
    <Billboard
      position={[
        cluster.cx * 0.08,
        cluster.cy * -0.08 - 2,
        cluster.cz * 0.08,
      ]}
    >
      <Text
        fontSize={0.6}
        color={CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length]}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.2}
        font="/fonts/inter-bold.woff"
      >
        {cluster.label}
      </Text>
    </Billboard>
  );
}

/* ── Scene ── */
interface SceneProps {
  nodes: GraphNode[];
  links: GraphLink[];
  clusters: Cluster[];
  hoveredNode: string | null;
  selectedNode: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onDoubleClick: (slug: string) => void;
}

function Scene({ nodes, links, clusters, hoveredNode, selectedNode, onHover, onSelect, onDoubleClick }: SceneProps) {
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

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />

      {/* Edges */}
      {links.map(l => {
        const src = l.source as GraphNode;
        const tgt = l.target as GraphNode;
        const same = src.cluster === tgt.cluster;
        const isHigh = hoveredNode ? connectedToHovered.has(src.id) && connectedToHovered.has(tgt.id) : false;
        const isDim = hoveredNode ? !isHigh : false;
        return (
          <EdgeLine
            key={l.id}
            source={src}
            target={tgt}
            sameCluster={same}
            clusterIdx={src.cluster}
            isDimmed={isDim}
            isHighlighted={isHigh}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(node => (
        <NodeSphere
          key={node.id}
          node={node}
          isHovered={hoveredNode === node.id}
          isSelected={selectedNode === node.id}
          isDimmed={!!hoveredNode && !connectedToHovered.has(node.id)}
          onHover={onHover}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
        />
      ))}

      {/* Cluster labels */}
      {clusters.map(c => (
        <ClusterLabel key={c.id} cluster={c} />
      ))}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.3}
        minDistance={5}
        maxDistance={50}
      />
    </>
  );
}

/* ── Main component ── */
interface Props {
  topics: TopicRow[];
  relations: TopicRelation[];
}

export default function TopicNetworkGraph({ topics, relations }: Props) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const clusterMap = useMemo(
    () => assignClusters(topics.map(t => t.category)),
    [topics]
  );

  // Build 3D simulation
  useEffect(() => {
    if (topics.length === 0) return;

    const rawLinks = relations.map(r => ({ source: r.source_topic_id, target: r.target_topic_id }));

    const graphNodes: GraphNode[] = topics.map(t => {
      const imp = computeImportance(t.id, rawLinks);
      const clusterIdx = clusterMap.get(t.category) ?? 0;
      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        category: t.category,
        postCount: t.post_count || 0,
        status: t.status,
        cluster: clusterIdx,
        importance: imp,
        // Initialize z with cluster-based spread
        z: (clusterIdx - 3) * 15 + (Math.random() - 0.5) * 20,
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

    // 2D force sim for x/y, then we keep z from initial assignment with some attraction
    const sim = forceSimulation<GraphNode>(graphNodes)
      .force('link', forceLink<GraphNode, GraphLink>(graphLinks).id(d => d.id).distance(100).strength(0.6))
      .force('charge', forceManyBody().strength(-250))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<GraphNode>().radius(d => 12 + (d.postCount || 0) * 2))
      .force('x', forceX(0).strength(0.02))
      .force('y', forceY(0).strength(0.02))
      .alphaDecay(0.015)
      .on('tick', () => {
        // Gradually pull z toward cluster centroid
        for (const n of graphNodes) {
          const targetZ = (n.cluster - 3) * 12;
          n.z = (n.z ?? 0) * 0.98 + targetZ * 0.02;
        }
        setNodes([...graphNodes]);
        setLinks([...graphLinks]);
      });

    return () => { sim.stop(); };
  }, [topics, relations, clusterMap]);

  // Clusters
  const clusters = useMemo<Cluster[]>(() => {
    if (nodes.length === 0) return [];
    const groups = new Map<number, GraphNode[]>();
    for (const n of nodes) {
      if (!groups.has(n.cluster)) groups.set(n.cluster, []);
      groups.get(n.cluster)!.push(n);
    }
    const totalPosts = nodes.reduce((s, n) => s + n.postCount, 0) || 1;
    return Array.from(groups.entries()).map(([id, clusterNodes]) => ({
      id,
      label: clusterNodes[0].category,
      color: CLUSTER_COLORS[id % CLUSTER_COLORS.length],
      nodes: clusterNodes,
      cx: clusterNodes.reduce((s, n) => s + (n.x ?? 0), 0) / clusterNodes.length,
      cy: clusterNodes.reduce((s, n) => s + (n.y ?? 0), 0) / clusterNodes.length,
      cz: clusterNodes.reduce((s, n) => s + (n.z ?? 0), 0) / clusterNodes.length,
      percentage: Math.round((clusterNodes.reduce((s, n) => s + n.postCount, 0) / totalPosts) * 100),
    })).sort((a, b) => b.percentage - a.percentage);
  }, [nodes]);

  // Gaps
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

  const selectedNodeData = useMemo(
    () => nodes.find(n => n.id === selectedNode),
    [nodes, selectedNode]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedNode(prev => prev === id ? null : id);
  }, []);

  if (topics.length < 2) return null;

  const graphHeight = expanded ? '100%' : '480px';

  return (
    <div className={cn(
      'rounded-xl overflow-hidden border border-border bg-card',
      expanded && 'fixed inset-4 z-50'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Discourse Network</span>
          <span className="text-[10px] text-muted-foreground ml-1">
            {topics.length} topics · {relations.length} connections
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground mr-1">Drag to rotate · Scroll to zoom</span>
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors"
            title={sidebarOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {sidebarOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors"
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex" style={{ height: expanded ? 'calc(100% - 40px)' : graphHeight }}>
        {/* 3D Canvas */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          <Canvas
            camera={{ position: [0, 0, 25], fov: 60 }}
            style={{ width: '100%', height: '100%' }}
            dpr={[1, 2]}
          >
            <Scene
              nodes={nodes}
              links={links}
              clusters={clusters}
              hoveredNode={hoveredNode}
              selectedNode={selectedNode}
              onHover={setHoveredNode}
              onSelect={handleSelect}
              onDoubleClick={(slug) => navigate(`/d/${slug}`)}
            />
          </Canvas>

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {clusters.map(c => (
              <span
                key={c.id}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
                style={{ background: hslA(c.id, 0.15), color: c.color, border: `1px solid ${hslA(c.id, 0.3)}` }}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Insights sidebar — collapsible */}
        <div
          className={cn(
            'border-l border-border overflow-y-auto flex-shrink-0 transition-all duration-300 bg-card',
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          )}
        >
          <div className="p-3 space-y-4 w-64">
            {/* Main Topics */}
            <div>
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Topics</h4>
              <div className="space-y-1.5">
                {clusters.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap text-white"
                      style={{ background: c.color }}
                    >
                      {c.percentage}%: {c.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {clusters.flatMap(c => c.nodes.slice(0, 3)).map(n => (
                  <span key={n.id} className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {n.title.length > 20 ? n.title.slice(0, 18) + '…' : n.title}
                  </span>
                ))}
              </div>
            </div>

            {/* Gaps to Connect */}
            {gaps.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Gaps to Connect
                </h4>
                <div className="space-y-2">
                  {gaps.map((gap, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
                        style={{ background: gap.a.color }}
                      >
                        {gap.a.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">↔</span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
                        style={{ background: gap.b.color }}
                      >
                        {gap.b.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-1.5 leading-relaxed">
                  These topic clusters have few connections. Bridge them with new discussions.
                </p>
              </div>
            )}

            {/* Selected node detail */}
            {selectedNodeData && (
              <div className="border-t border-border pt-3">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Selected</h4>
                <p className="text-xs text-foreground font-medium">{selectedNodeData.title}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                  <span>{selectedNodeData.postCount} posts</span>
                  <span>·</span>
                  <span>{selectedNodeData.importance} connections</span>
                </div>
                <button
                  onClick={() => navigate(`/d/${selectedNodeData.slug}`)}
                  className="mt-2 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded hover:bg-accent transition-colors"
                  style={{ color: CLUSTER_COLORS[selectedNodeData.cluster % CLUSTER_COLORS.length] }}
                >
                  Open discussion <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="border-t border-border pt-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-muted rounded p-2">
                  <div className="text-sm font-bold text-foreground">{topics.length}</div>
                  <div className="text-[9px] text-muted-foreground">Topics</div>
                </div>
                <div className="bg-muted rounded p-2">
                  <div className="text-sm font-bold text-foreground">{relations.length}</div>
                  <div className="text-[9px] text-muted-foreground">Connections</div>
                </div>
                <div className="bg-muted rounded p-2">
                  <div className="text-sm font-bold text-foreground">{clusters.length}</div>
                  <div className="text-[9px] text-muted-foreground">Clusters</div>
                </div>
                <div className="bg-muted rounded p-2">
                  <div className="text-sm font-bold text-foreground">{gaps.length}</div>
                  <div className="text-[9px] text-muted-foreground">Gaps</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
