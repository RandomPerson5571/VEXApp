"use client";

import { useMemo, useState } from "react";
import { Network } from "lucide-react";

import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { KnowledgeSidebar } from "@/components/knowledge/KnowledgeSidebar";
import { DEFAULT_EDGE_RELATIONSHIP } from "@/components/knowledge/knowledge-view-utils";
import { useTeam, useUser } from "@/components/providers/UserProvider";
import { isGlobalAdmin } from "@/lib/auth/auth-guards";
import {
  useKnowledgeMutations,
  useTeamKnowledge,
} from "@/lib/hooks/use-team-knowledge";
import type {
  CreateNodePayload,
  KnowledgeSearchHit,
} from "@/lib/queries/knowledge";

function KnowledgeFallback() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 p-8 dark:bg-[#000000]">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-8 text-center dark:border-[#1a1a1a] dark:bg-[#0a0a0a] dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-slate-100 dark:border-[#1a1a1a] dark:bg-[#121212]">
          <Network className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
          No team assigned
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Join a team to explore the knowledge graph.
        </p>
      </div>
    </div>
  );
}

export function KnowledgeView() {
  const user = useUser();
  const team = useTeam();
  const isAdmin = isGlobalAdmin(user);
  const { teamId, nodes, edges, isLoading, isError } = useTeamKnowledge();
  const { createNode, createEdge, deleteNode, deleteEdge, search } =
    useKnowledgeMutations(teamId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeSearchHit[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const highlightedIds = useMemo(
    () => searchResults.map((hit) => hit.id),
    [searchResults],
  );

  if (!team) {
    return <KnowledgeFallback />;
  }

  const createEdgeBetween = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      setFormError("Pick a different node to connect.");
      return;
    }
    setFormError(null);
    try {
      await createEdge.mutateAsync({
        sourceId,
        targetId,
        relationshipType: DEFAULT_EDGE_RELATIONSHIP,
      });
      setLinkSourceId(null);
      setSelectedId(targetId);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create edge.",
      );
      setSelectedId(targetId);
    }
  };

  const handleSelectNode = (id: string) => {
    if (linkSourceId) {
      if (linkSourceId === id) return;
      void createEdgeBetween(linkSourceId, id);
      return;
    }
    setSelectedId(id);
    setFormError(null);
  };

  const handleClearSelection = () => {
    setSelectedId(null);
    setLinkSourceId(null);
    setFormError(null);
  };

  const handleCreateNode = async (payload: CreateNodePayload) => {
    setFormError(null);
    try {
      const node = await createNode.mutateAsync(payload);
      setSelectedId(node.id);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create node.",
      );
      throw error;
    }
  };

  const handleSearch = async () => {
    setFormError(null);
    try {
      const hits = await search.mutateAsync(searchQuery);
      setSearchResults(hits);
      if (hits[0]) {
        handleSelectNode(hits[0].id);
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Search failed.",
      );
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    deleteNode.mutate(nodeId, {
      onSuccess: () => {
        if (selectedId === nodeId) setSelectedId(null);
        if (linkSourceId === nodeId) setLinkSourceId(null);
        setSearchResults((prev) => prev.filter((hit) => hit.id !== nodeId));
      },
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-slate-100 dark:bg-[#000000] lg:flex-row">
      <div className="relative min-h-[420px] flex-1 overflow-hidden border-b border-slate-200 dark:border-[#1a1a1a] lg:border-b-0 lg:border-r">
        <KnowledgeGraph
          nodes={nodes}
          edges={edges}
          selectedId={selectedId}
          highlightedIds={highlightedIds}
          linkSourceId={linkSourceId}
          isLoading={isLoading}
          isError={isError}
          isAdmin={isAdmin}
          onSelectNode={handleSelectNode}
          onClearSelection={handleClearSelection}
        />
      </div>

      <KnowledgeSidebar
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode}
        linkSourceId={linkSourceId}
        searchQuery={searchQuery}
        searchResults={searchResults}
        formError={formError}
        isAdmin={isAdmin}
        isSearching={search.isPending}
        isCreatingNode={createNode.isPending}
        isCreatingEdge={createEdge.isPending}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        onClearSearch={() => {
          setSearchResults([]);
          setSearchQuery("");
        }}
        onClearSelection={handleClearSelection}
        onSelectNode={handleSelectNode}
        onStartLink={setLinkSourceId}
        onCancelLink={() => setLinkSourceId(null)}
        onDeleteNode={handleDeleteNode}
        onDeleteEdge={(edgeId) => deleteEdge.mutate(edgeId)}
        onCreateNode={handleCreateNode}
      />
    </div>
  );
}
