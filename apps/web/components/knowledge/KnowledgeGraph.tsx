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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedId || !graphRef.current) return;
    const node = graphData.nodes.find((entry) => entry.id === selectedId) as
      | (GraphNode & { x?: number; y?: number })
      | undefined;
    if (node?.x == null || node?.y == null) return;
    graphRef.current.centerAt(node.x, node.y, 400);
    graphRef.current.zoom(2.2, 400);
  }, [graphData.nodes, selectedId]);

  useEffect(() => {
    if (selectedId || !graphRef.current || nodes.length === 0) return;
    if (size.width <= 0 || size.height <= 0) return;

    const timer = window.setTimeout(() => {
      graphRef.current?.zoomToFit(400, 80);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [graphData.nodes, graphData.links, nodes.length, selectedId, size.height, size.width]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Loading graph…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-rose-500">
        Failed to load knowledge graph.
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
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
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.width > 0 && size.height > 0 ? (
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
          onEngineStop={() => {
            if (!selectedId) {
              graphRef.current?.zoomToFit(400, 80);
            }
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
              ctx.strokeStyle = isHit ? "#facc15" : isLinkSource ? "#38bdf8" : "#f8fafc";
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
