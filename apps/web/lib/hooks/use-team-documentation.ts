"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { queryKeys } from "@/lib/query-client";
import {
  createDocumentationFromApi,
  deleteDocumentationFromApi,
  documentationDetailQueryOptions,
  updateDocumentationFromApi,
} from "@/lib/queries/documentation";
import {
  createFolderFromApi,
  deleteFolderFromApi,
  teamDocumentationTreeQueryOptions,
  updateFolderFromApi,
} from "@/lib/queries/folders";

function useInvalidateDocumentationQueries() {
  const team = useTeam();
  const queryClient = useQueryClient();
  const teamId = team?.id;

  return async (docId?: string) => {
    const invalidations: Promise<void>[] = [];

    if (teamId) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: queryKeys.docs.tree(teamId),
        }),
      );
    }

    if (docId) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: queryKeys.docs.detail(docId),
        }),
      );
    }

    await Promise.all(invalidations);
  };
}

export function useTeamDocumentationTree() {
  const team = useTeam();
  const teamId = team?.id;

  return useQuery({
    ...teamDocumentationTreeQueryOptions(teamId ?? ""),
    enabled: !!teamId,
  });
}

export function useDocumentationDetail(docId: string | null | undefined) {
  return useQuery({
    ...documentationDetailQueryOptions(docId ?? ""),
    enabled: !!docId,
  });
}

export function useCreateFolder() {
  const invalidate = useInvalidateDocumentationQueries();

  return useMutation({
    mutationFn: createFolderFromApi,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateFolder() {
  const invalidate = useInvalidateDocumentationQueries();

  return useMutation({
    mutationFn: updateFolderFromApi,
    onSuccess: () => invalidate(),
  });
}

export function useDeleteFolder() {
  const invalidate = useInvalidateDocumentationQueries();

  return useMutation({
    mutationFn: deleteFolderFromApi,
    onSuccess: () => invalidate(),
  });
}

export function useCreateDocumentation() {
  const invalidate = useInvalidateDocumentationQueries();

  return useMutation({
    mutationFn: createDocumentationFromApi,
    onSuccess: (doc) => invalidate(doc.id),
  });
}

export function useUpdateDocumentation() {
  const invalidate = useInvalidateDocumentationQueries();

  return useMutation({
    mutationFn: updateDocumentationFromApi,
    onSuccess: (doc) => invalidate(doc.id),
  });
}

export function useDeleteDocumentation() {
  const invalidate = useInvalidateDocumentationQueries();

  return useMutation({
    mutationFn: deleteDocumentationFromApi,
    onSuccess: (_void, docId) => invalidate(docId),
  });
}
