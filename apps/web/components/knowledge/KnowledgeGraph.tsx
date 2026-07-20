"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Network } from "lucide-react";

import {
  linkEndpointId,
  neighborIdsFor,
  TOPIC_COLORS,
  toGraphData,
  type GraphNode,
} from "@/components/knowledge/knowledge-view-utils";
import type { KnowledgeEdgeRecord, KnowledgeNodeRecord } from "@/lib/queries/knowledge";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

type GraphApi = {
  centerAt: (x: number, y: number, ms?: number) => void;
  zoom: (k: number, ms?: number) => void;
  zoomToFit: (ms?: number, padding?: number) => void;
};

type KnowledgeGraphProps = {
  nodes: KnowledgeNodeRecord[];
  edges: KnowledgeEdgeRecord[];
  selectedId: string | null;
  highlightedIds: string[];
  linkSourceId: string | null;
  isLoading: boolean;
  isError: boolean;
  isAdmin: boolean;
  onSelectNode: (id: string) => void;
  onClearSelection: () => void;
};

export function KnowledgeGraph({
  nodes,
  edges,
  selectedId,
  highlightedIds,
  linkSourceId,
  isLoading,
  isError,
  isAdmin,
  onSelectNode,
  onClearSelection,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<GraphApi | null>(null);
  const hasFittedRef = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const graphData = useMemo(() => toGraphData(nodes, edges), [nodes, edges]);
  const neighborIds = useMemo(
    () => (selectedId ? neighborIdsFor(selectedId, edges) : new Set<string>()),
    [edges, selectedId],
  );
  const highlightSet = useMemo(
    () => new Set(highlightedIds),
    [highlightedIds],
  );

  const showGraph =
    !isLoading && !isError && nodes.length > 0 && size.width > 0 && size.height > 0;

  // Keep the measure target mounted so first paint gets real dimensions.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    };

    updateSize();
    const raf = requestAnimationFrame(updateSize);
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  // Reset fit when the graph set changes substantially (empty → data).
  useEffect(() => {
    if (nodes.length === 0) {
      hasFittedRef.current = false;
    }
  }, [nodes.length]);

  // Soft pan to selection — no hard zoom.
  useEffect(() => {
    if (!selectedId || !graphRef.current) return;
    const node = graphData.nodes.find((entry) => entry.id === selectedId) as
      | (GraphNode & { x?: number; y?: number })
      | undefined;
    if (node?.x == null || node?.y == null) return;
    graphRef.current.centerAt(node.x, node.y, 350);
  }, [selectedId, graphData.nodes]);

  const fitGraph = (ms = 300) => {
    if (!graphRef.current || size.width <= 0 || size.height <= 0) return;
    // Generous padding so the whole web stays in view (not clipped to an edge).
    graphRef.current.zoomToFit(ms, Math.max(100, Math.min(size.width, size.height) * 0.18));
  };

  return (
    <div ref={containerRef} className="relative h-full min-h-[420px] w-full">
      {isLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-slate-500">
          Loading graph…
        </div>
      ) : null}

      {isError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-rose-500">
          Failed to load knowledge graph.
        </div>
      ) : null}

      {!isLoading && !isError && nodes.length === 0 ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-8 text-center">
          <Network className="h-10 w-10 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No nodes yet
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            {isAdmin
              ? "Add your first node from the sidebar to start the graph."
              : "Nodes will appear here once an admin adds them."}
          </p>
        </div>
      ) : null}

      {showGraph ? (
        <ForceGraph2D
          ref={graphRef as never}
          width={size.width}
          height={size.height}
          graphData={graphData}
          nodeId="id"
          linkSource="source"
          linkTarget="target"
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={8}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          cooldownTicks={80}
          onEngineStop={() => {
            // Fit once after the first layout pass — avoid re-zooming on every settle.
            if (hasFittedRef.current) return;
            hasFittedRef.current = true;
            fitGraph(400);
          }}
          onNodeClick={(node) => onSelectNode(String((node as GraphNode).id))}
          onBackgroundClick={onClearSelection}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode & { x?: number; y?: number };
            const x = n.x ?? 0;
            const y = n.y ?? 0;
            const fontSize = 12 / globalScale;
            const isSelected = selectedId === n.id;
            const isLinkSource = linkSourceId === n.id;
            const isHit = highlightSet.has(n.id);
            const isNeighbor =
              !selectedId || neighborIds.has(n.id) || highlightSet.has(n.id);

            ctx.beginPath();
            ctx.arc(x, y, isSelected || isLinkSource ? 7 : 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = TOPIC_COLORS[n.topicCategory];
            ctx.globalAlpha = isNeighbor ? 1 : 0.18;
            ctx.fill();

            if (isSelected || isHit || isLinkSource) {
              ctx.strokeStyle = isHit
                ? "#facc15"
                : isLinkSource
                  ? "#38bdf8"
                  : "#f8fafc";
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }

            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#e2e8f0";
            ctx.fillText(n.name, x, y + 8);
            ctx.globalAlpha = 1;
          }}
          linkColor={(link) => {
            if (!selectedId && !linkSourceId) return "rgba(148,163,184,0.45)";
            const sourceId = linkEndpointId((link as { source: unknown }).source);
            const targetId = linkEndpointId((link as { target: unknown }).target);
            const connected =
              sourceId === selectedId ||
              targetId === selectedId ||
              sourceId === linkSourceId ||
              targetId === linkSourceId;
            return connected
              ? "rgba(56,189,248,0.9)"
              : "rgba(148,163,184,0.12)";
          }}
          linkWidth={(link) => {
            if (!selectedId && !linkSourceId) return 1;
            const sourceId = linkEndpointId((link as { source: unknown }).source);
            const targetId = linkEndpointId((link as { target: unknown }).target);
            return sourceId === selectedId ||
              targetId === selectedId ||
              sourceId === linkSourceId ||
              targetId === linkSourceId
              ? 2.5
              : 1;
          }}
        />
      ) : null}
    </div>
  );
}
