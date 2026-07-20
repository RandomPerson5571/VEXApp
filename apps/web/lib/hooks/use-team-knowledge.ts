"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import {
  createKnowledgeEdgeFromApi,
  createKnowledgeNodeFromApi,
  deleteKnowledgeEdgeFromApi,
  deleteKnowledgeNodeFromApi,
  knowledgeEdgesQueryOptions,
  knowledgeNodesQueryOptions,
  searchKnowledgeFromApi,
  type CreateEdgePayload,
  type CreateNodePayload,
  type KnowledgeEdgeRecord,
  type KnowledgeNodeRecord,
} from "@/lib/queries/knowledge";
import { queryKeys } from "@/lib/query-client";

export function useTeamKnowledge() {
  const team = useTeam();
  const teamId = team?.id ?? "";

  const nodesQuery = useQuery(knowledgeNodesQueryOptions(teamId));
  const edgesQuery = useQuery(knowledgeEdgesQueryOptions(teamId));

  return {
    teamId,
    nodes: nodesQuery.data ?? [],
    edges: edgesQuery.data ?? [],
    nodesQuery,
    edgesQuery,
    isLoading: nodesQuery.isLoading || edgesQuery.isLoading,
    isError: nodesQuery.isError || edgesQuery.isError,
  };
}

export function useKnowledgeMutations(teamId: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.nodes(teamId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.edges(teamId) }),
    ]);
  };

  const createNode = useMutation({
    mutationFn: (payload: CreateNodePayload) => createKnowledgeNodeFromApi(payload),
    onSuccess: invalidate,
  });

  const createEdge = useMutation({
    mutationFn: (payload: CreateEdgePayload) => createKnowledgeEdgeFromApi(payload),
    onSuccess: invalidate,
  });

  const deleteNode = useMutation({
    mutationFn: (nodeId: string) => deleteKnowledgeNodeFromApi(nodeId),
    onSuccess: async (_data, nodeId) => {
      // Keep nodes/edges in sync so force-graph never sees orphan link IDs
      queryClient.setQueryData<KnowledgeNodeRecord[]>(
        queryKeys.knowledge.nodes(teamId),
        (old) => old?.filter((node) => node.id !== nodeId) ?? [],
      );
      queryClient.setQueryData<KnowledgeEdgeRecord[]>(
        queryKeys.knowledge.edges(teamId),
        (old) =>
          old?.filter(
            (edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId,
          ) ?? [],
      );
      await invalidate();
    },
  });

  const deleteEdge = useMutation({
    mutationFn: (edgeId: string) => deleteKnowledgeEdgeFromApi(edgeId),
    onSuccess: invalidate,
  });

  const search = useMutation({
    mutationFn: (query: string) => searchKnowledgeFromApi(query),
  });

  return { createNode, createEdge, deleteNode, deleteEdge, search };
}
