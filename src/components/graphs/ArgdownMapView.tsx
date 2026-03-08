import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceY,
  forceX,
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
  author?: string;
  argdownType?: string; // claim, support, objection, concern, alternative, question, proposal, evidence, rebuttal
}

interface MapEdge {
  id: string;
  source: string;
  target: string;
  relationType: 'support' | 'attack' | 'undercut' | 'contrary';
}

interface GraphNode extends SimulationNodeDatum {
  id: string;
  title: string;
  type: 'statement' | 'argument';
  text: string;
  tags: string[];
  author?: string;
  argdownType?: string;
  nodeWidth: number;
  nodeHeight: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  relationType: MapEdge['relationType'];
}

/* ── Argdown Parser ── */
function parseArgdownSource(source: string): { nodes: MapNode[]; edges: MapEdge[] } {
  const nodes = new Map<string, MapNode>();
  const edges: MapEdge[] = [];
  const lines = source.split('\n');
  let edgeCounter = 0;

  const parentStack: { title: string; indent: number }[] = [];

  function getOrCreateNode(title: string, type: 'statement' | 'argument', text?: string, author?: string): MapNode {
    const existing = nodes.get(title);
    if (existing) {
      if (text && text.length > (existing.text?.length || 0)) existing.text = text;
      if (author && !existing.author) existing.author = author;
      return existing;
    }
    const node: MapNode = {
      id: `node-${nodes.size}`,
      title,
      type,
      text: text || title,
      tags: [],
      author,
    };
    nodes.set(title, node);
    return node;
  }

  function extractTags(line: string): string[] {
    const tags: string[] = [];
    const tagRegex = /#([\w-]+)/g;
    let m;
    while ((m = tagRegex.exec(line)) !== null) tags.push(m[1]);
    return tags;
  }

  function extractAuthor(text: string): { author?: string; cleaned: string } {
    const match = text.match(/\(([^)]+)\)\s*:/);
    if (match) return { author: match[1], cleaned: text.replace(match[0], ':') };
    return { cleaned: text };
  }

  function findParent(currentIndent: number): string | null {
    for (let i = parentStack.length - 1; i >= 0; i--) {
      if (parentStack[i].indent < currentIndent) return parentStack[i].title;
    }
    return parentStack.length > 0 ? parentStack[0].title : null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      // Empty line resets context for top-level elements
      continue;
    }

    const indent = line.search(/\S/);
    const trimmed = line.trim();
    const tags = extractTags(trimmed);

    // Contrary relation: >< [Title] or >< <Title>
    const contraryMatch = trimmed.match(/^><\s*(?:\[([^\]]+)\]|<([^>]+)>)(?:\([^)]*\))?\s*(?::\s*(.+))?/);
    if (contraryMatch) {
      const title = contraryMatch[1] || contraryMatch[2];
      const type = contraryMatch[1] ? 'statement' : 'argument';
      const text = contraryMatch[3]?.replace(/#[\w-]+/g, '').trim();
      const node = getOrCreateNode(title, type as 'statement' | 'argument', text);
      node.tags.push(...tags);
      node.argdownType = 'alternative';

      const parent = findParent(indent);
      if (parent) {
        edges.push({
          id: `edge-${edgeCounter++}`,
          source: nodes.get(title)!.id,
          target: nodes.get(parent)!.id,
          relationType: 'contrary',
        });
      }
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].indent >= indent) parentStack.pop();
      parentStack.push({ title, indent });
      continue;
    }

    // Statement definition: [Title]: text or [Title](Author): text
    const stmtMatch = trimmed.match(/^\[([^\]]+)\](?:\(([^)]*)\))?\s*:\s*(.+)/);
    if (stmtMatch) {
      const cleanedText = stmtMatch[3].replace(/#[\w-]+/g, '').trim();
      const node = getOrCreateNode(stmtMatch[1], 'statement', cleanedText, stmtMatch[2]);
      node.tags.push(...tags);
      // Infer argdownType from tags
      if (tags.includes('question')) node.argdownType = 'question';
      else if (tags.includes('alternative')) node.argdownType = 'alternative';
      else if (tags.includes('proposal')) node.argdownType = 'proposal';
      else if (!node.argdownType) node.argdownType = 'claim';
      parentStack.length = 0;
      parentStack.push({ title: stmtMatch[1], indent });
      continue;
    }

    // Statement reference: [Title] (no colon)
    const stmtRefMatch = trimmed.match(/^\[([^\]]+)\]\s*$/);
    if (stmtRefMatch) {
      getOrCreateNode(stmtRefMatch[1], 'statement');
      continue;
    }

    // Argument definition: <Title>: text or <Title>(Author): text
    const argMatch = trimmed.match(/^<([^>]+)>(?:\(([^)]*)\))?\s*:\s*(.+)/);
    if (argMatch) {
      const cleanedText = argMatch[3].replace(/#[\w-]+/g, '').trim();
      const node = getOrCreateNode(argMatch[1], 'argument', cleanedText, argMatch[2]);
      node.tags.push(...tags);
      if (!node.argdownType) node.argdownType = 'support';
      parentStack.length = 0;
      parentStack.push({ title: argMatch[1], indent });
      continue;
    }

    // Support relation: + <Title> or + [Title]
    const supportMatch = trimmed.match(/^\+\s*(?:<([^>]+)>|\[([^\]]+)\])(?:\(([^)]*)\))?\s*(?::\s*(.+))?/);
    if (supportMatch) {
      const title = supportMatch[1] || supportMatch[2];
      const type = supportMatch[1] ? 'argument' : 'statement';
      const author = supportMatch[3];
      const text = supportMatch[4]?.replace(/#[\w-]+/g, '').trim();
      const node = getOrCreateNode(title, type as 'statement' | 'argument', text, author);
      node.tags.push(...tags);
      if (type === 'argument' && !node.argdownType) {
        node.argdownType = tags.includes('evidence') ? 'evidence' : 'support';
      }

      const parent = findParent(indent);
      if (parent) {
        edges.push({
          id: `edge-${edgeCounter++}`,
          source: nodes.get(title)!.id,
          target: nodes.get(parent)!.id,
          relationType: 'support',
        });
      }
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].indent >= indent) parentStack.pop();
      parentStack.push({ title, indent });
      continue;
    }

    // Attack relation: - <Title> or - [Title]
    const attackMatch = trimmed.match(/^-\s*(?:<([^>]+)>|\[([^\]]+)\])(?:\(([^)]*)\))?\s*(?::\s*(.+))?/);
    if (attackMatch) {
      const title = attackMatch[1] || attackMatch[2];
      const type = attackMatch[1] ? 'argument' : 'statement';
      const author = attackMatch[3];
      const text = attackMatch[4]?.replace(/#[\w-]+/g, '').trim();
      const node = getOrCreateNode(title, type as 'statement' | 'argument', text, author);
      node.tags.push(...tags);
      if (type === 'argument' && !node.argdownType) {
        if (tags.includes('concern')) node.argdownType = 'concern';
        else if (tags.includes('rebuttal')) node.argdownType = 'rebuttal';
        else node.argdownType = 'objection';
      }

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

    // Undercut: _ <Title>
    const undercutMatch = trimmed.match(/^_\s*<([^>]+)>(?:\(([^)]*)\))?\s*(?::\s*(.+))?/);
    if (undercutMatch) {
      const title = undercutMatch[1];
      const text = undercutMatch[3]?.replace(/#[\w-]+/g, '').trim();
      const node = getOrCreateNode(title, 'argument', text, undercutMatch[2]);
      node.tags.push(...tags);

      const parent = findParent(indent);
      if (parent) {
        edges.push({
          id: `edge-${edgeCounter++}`,
          source: nodes.get(title)!.id,
          target: nodes.get(parent)!.id,
          relationType: 'undercut',
        });
      }
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].indent >= indent) parentStack.pop();
      parentStack.push({ title, indent });
      continue;
    }
  }

  return { nodes: Array.from(nodes.values()), edges };
}

/* ── Color scheme matching argdown.org style ── */
const typeColors: Record<string, { fill: string; border: string; text: string }> = {
  claim:       { fill: 'hsl(200, 60%, 92%)', border: 'hsl(200, 60%, 55%)', text: 'hsl(200, 70%, 25%)' },
  proposal:    { fill: 'hsl(195, 55%, 90%)', border: 'hsl(195, 65%, 42%)', text: 'hsl(195, 70%, 22%)' },
  support:     { fill: 'hsl(152, 45%, 88%)', border: 'hsl(152, 50%, 36%)', text: 'hsl(152, 55%, 18%)' },
  evidence:    { fill: 'hsl(152, 45%, 88%)', border: 'hsl(152, 50%, 36%)', text: 'hsl(152, 55%, 18%)' },
  objection:   { fill: 'hsl(15, 75%, 92%)',  border: 'hsl(15, 70%, 50%)',  text: 'hsl(15, 60%, 25%)' },
  rebuttal:    { fill: 'hsl(15, 75%, 92%)',  border: 'hsl(15, 70%, 50%)',  text: 'hsl(15, 60%, 25%)' },
  concern:     { fill: 'hsl(38, 70%, 92%)',  border: 'hsl(38, 75%, 46%)',  text: 'hsl(38, 60%, 22%)' },
  alternative: { fill: 'hsl(330, 50%, 92%)', border: 'hsl(330, 50%, 50%)', text: 'hsl(330, 45%, 25%)' },
  question:    { fill: 'hsl(270, 40%, 92%)', border: 'hsl(270, 45%, 50%)', text: 'hsl(270, 40%, 25%)' },
};

const defaultColors = { fill: 'hsl(0, 0%, 94%)', border: 'hsl(0, 0%, 60%)', text: 'hsl(0, 0%, 20%)' };

const edgeColors: Record<string, string> = {
  support: 'hsl(152, 50%, 40%)',
  attack: 'hsl(355, 60%, 50%)',
  undercut: 'hsl(38, 60%, 50%)',
  contrary: 'hsl(270, 40%, 55%)',
};

/* ── Text wrapping helper ── */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const charWidth = fontSize * 0.55;
  const maxChars = Math.floor(maxWidth / charWidth);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 4); // max 4 lines
}

function measureNode(title: string, text: string): { width: number; height: number } {
  const titleLines = wrapText(title, 160, 11);
  const textLines = wrapText(text.length > 120 ? text.slice(0, 117) + '…' : text, 160, 9.5);
  const lineCount = titleLines.length + textLines.length;
  const height = Math.max(50, 28 + lineCount * 14 + 12);
  const width = 180;
  return { width, height };
}

/* ── Component ── */
interface Props {
  argdownSource: string;
  onViewPost?: (postId: string) => void;
}

export default function ArgdownMapView({ argdownSource, onViewPost }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  const { nodes: mapNodes, edges: mapEdges } = useMemo(() => parseArgdownSource(argdownSource), [argdownSource]);

  // Resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      const nodeCount = mapNodes.length;
      const h = Math.max(400, Math.min(700, 200 + nodeCount * 50));
      setDimensions({ width, height: h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mapNodes.length]);

  // Simulation
  useEffect(() => {
    if (mapNodes.length === 0) return;

    const gNodes: GraphNode[] = mapNodes.map(n => {
      const measured = measureNode(n.title, n.text);
      return {
        id: n.id,
        title: n.title,
        type: n.type,
        text: n.text,
        tags: n.tags,
        author: n.author,
        argdownType: n.argdownType,
        nodeWidth: measured.width,
        nodeHeight: measured.height,
      };
    });

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
      .force('link', forceLink<GraphNode, GraphLink>(gLinks).id(d => d.id).distance(160).strength(0.5))
      .force('charge', forceManyBody().strength(-400))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide<GraphNode>().radius(d => Math.max(d.nodeWidth, d.nodeHeight) / 2 + 20).strength(0.8))
      .force('x', forceX<GraphNode>(dimensions.width / 2).strength(0.03))
      .force('y', forceY<GraphNode>(dimensions.height / 2).strength(0.03))
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

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragging.current.startX;
    const dy = e.clientY - dragging.current.startY;
    setPan({ x: dragging.current.startPanX + dx, y: dragging.current.startPanY + dy });
  }, []);

  const handleMouseUp = useCallback(() => { dragging.current = null; }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)));
  }, []);

  if (mapNodes.length === 0) {
    return (
      <div className="surface-card-elevated p-8 text-center">
        <p className="text-sm text-muted-foreground">No argument map available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="surface-card-elevated overflow-hidden" ref={containerRef}>
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold text-foreground">Argument Map</h3>
            <span className="text-[10px] text-muted-foreground">
              {mapNodes.length} nodes · {mapEdges.length} relations
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Legend chips */}
            {['claim', 'support', 'objection', 'concern', 'alternative', 'question'].map(t => (
              <span key={t} className="flex items-center gap-1 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-sm border" style={{
                  background: (typeColors[t] || defaultColors).fill,
                  borderColor: (typeColors[t] || defaultColors).border,
                }} />
                <span className="text-muted-foreground capitalize">{t}</span>
              </span>
            ))}
            <button
              onClick={() => setShowSource(!showSource)}
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ml-2',
                showSource ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              Source
            </button>
          </div>
        </div>

        {showSource ? (
          <div className="p-4 max-h-[500px] overflow-auto">
            <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">{argdownSource}</pre>
          </div>
        ) : (
          /* SVG Graph */
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full cursor-grab active:cursor-grabbing"
            style={{ background: 'hsl(var(--surface-sunken))' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <defs>
              <marker id="arrow-support" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={edgeColors.support} opacity="0.8" />
              </marker>
              <marker id="arrow-attack" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={edgeColors.attack} opacity="0.8" />
              </marker>
              <marker id="arrow-contrary" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={edgeColors.contrary} opacity="0.8" />
              </marker>
              <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
              </filter>
            </defs>

            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {graphLinks.map(l => {
                const src = l.source as GraphNode;
                const tgt = l.target as GraphNode;
                if (!src.x || !tgt.x) return null;
                const isHL = hoveredNode && connectedToHovered.has(src.id) && connectedToHovered.has(tgt.id);
                const color = edgeColors[l.relationType] || edgeColors.support;
                const markerId = l.relationType === 'attack' ? 'arrow-attack' : l.relationType === 'contrary' ? 'arrow-contrary' : 'arrow-support';

                return (
                  <line
                    key={l.id}
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isHL ? color : 'hsl(var(--border))'}
                    strokeWidth={isHL ? 3 : 2}
                    strokeDasharray={l.relationType === 'attack' ? '8 4' : l.relationType === 'contrary' ? '4 4' : 'none'}
                    opacity={hoveredNode && !isHL ? 0.08 : 0.6}
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
                const colors = typeColors[node.argdownType || ''] || defaultColors;
                const w = node.nodeWidth;
                const h = node.nodeHeight;
                const titleLines = wrapText(node.title, w - 16, 11);
                const displayText = node.text.length > 120 ? node.text.slice(0, 117) + '…' : node.text;
                const textLines = wrapText(displayText, w - 16, 9.5);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${(node.x ?? 0) - w / 2},${(node.y ?? 0) - h / 2})`}
                    className="cursor-pointer"
                    onPointerEnter={() => setHoveredNode(node.id)}
                    onPointerLeave={() => setHoveredNode(null)}
                    onClick={(e) => { e.stopPropagation(); setSelectedNode(prev => prev === node.id ? null : node.id); }}
                    opacity={isDimmed ? 0.1 : 1}
                    style={{ transition: 'opacity 200ms' }}
                    filter={isHovered || isSelected ? 'url(#node-shadow)' : undefined}
                  >
                    {/* Card background */}
                    <rect
                      width={w}
                      height={h}
                      rx={node.type === 'argument' ? 12 : 4}
                      fill={colors.fill}
                      stroke={isSelected ? colors.text : colors.border}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                    />
                    {/* Title */}
                    {titleLines.map((line, i) => (
                      <text
                        key={`t-${i}`}
                        x={w / 2}
                        y={16 + i * 13}
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize={11}
                        fontWeight={700}
                        className="pointer-events-none select-none"
                      >
                        {line}
                      </text>
                    ))}
                    {/* Separator */}
                    <line
                      x1={8}
                      y1={16 + titleLines.length * 13 - 2}
                      x2={w - 8}
                      y2={16 + titleLines.length * 13 - 2}
                      stroke={colors.border}
                      strokeWidth={0.5}
                      opacity={0.5}
                    />
                    {/* Body text */}
                    {textLines.map((line, i) => (
                      <text
                        key={`b-${i}`}
                        x={w / 2}
                        y={16 + titleLines.length * 13 + 10 + i * 12}
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize={9.5}
                        fontWeight={400}
                        opacity={0.85}
                        className="pointer-events-none select-none"
                      >
                        {line}
                      </text>
                    ))}
                    {/* Author badge */}
                    {node.author && (
                      <text
                        x={w / 2}
                        y={h - 5}
                        textAnchor="middle"
                        fill={colors.border}
                        fontSize={8}
                        fontWeight={500}
                        className="pointer-events-none select-none"
                      >
                        — {node.author}
                      </text>
                    )}
                    {/* Tags */}
                    {node.tags.length > 0 && (
                      <text
                        x={w - 6}
                        y={12}
                        textAnchor="end"
                        fill={colors.border}
                        fontSize={7.5}
                        fontWeight={500}
                        className="pointer-events-none select-none"
                      >
                        {node.tags.map(t => `#${t}`).join(' ')}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Edge legend */}
        <div className="px-4 py-2 border-t border-border/40 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-5 h-0 border-t-2" style={{ borderColor: edgeColors.support }} />
            support
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-0 border-t-2 border-dashed" style={{ borderColor: edgeColors.attack }} />
            attack
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-0 border-t-2 border-dotted" style={{ borderColor: edgeColors.contrary }} />
            contrary
          </span>
          <span className="ml-auto text-[9px]">Scroll to zoom · Drag to pan</span>
        </div>
      </div>

      {/* Selected node detail */}
      {selectedData && (
        <div className="surface-card-elevated p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm border" style={{
              background: (typeColors[selectedData.argdownType || ''] || defaultColors).fill,
              borderColor: (typeColors[selectedData.argdownType || ''] || defaultColors).border,
            }} />
            <span className="text-xs font-bold text-foreground">{selectedData.title}</span>
            <span className="text-[10px] text-muted-foreground capitalize">{selectedData.argdownType || selectedData.type}</span>
            {selectedData.author && (
              <span className="text-[10px] text-muted-foreground">by {selectedData.author}</span>
            )}
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{selectedData.text}</p>
          {selectedData.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedData.tags.map(t => (
                <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
