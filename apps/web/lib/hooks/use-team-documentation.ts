"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import {
  applyDocumentationDetailPatch,
  applyDocumentationTreeDocPatch,
} from "@/lib/queries/cache-updates/documentation";
import { applyFolderTreePatch } from "@/lib/queries/cache-updates/folders";
import { invalidateDocsTree } from "@/lib/queries/cache-updates/invalidate";
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

function useBackgroundInvalidateDocumentation() {
  const team = useTeam();
  const queryClient = useQueryClient();
  const teamId = team?.id;

  return (docId?: string) => {
    if (!teamId) {
      return;
    }

    invalidateDocsTree(queryClient, teamId, docId);
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
  const team = useTeam();
  const invalidate = useBackgroundInvalidateDocumentation();

  return useMutation({
    mutationFn: createFolderFromApi,
    onSettled: () => {
      if (team?.id) {
        invalidate();
      }
    },
  });
}

export function useUpdateFolder() {
  const team = useTeam();
  const queryClient = useQueryClient();
  const teamId = team?.id;
  const invalidate = useBackgroundInvalidateDocumentation();

  return useMutation({
    mutationFn: updateFolderFromApi,
    onSuccess: (folder) => {
      if (!teamId) {
        return;
      }

      applyFolderTreePatch(queryClient, teamId, folder);
    },
    onSettled: () => {
      if (teamId) {
        invalidate();
      }
    },
  });
}

export function useDeleteFolder() {
  const team = useTeam();
  const invalidate = useBackgroundInvalidateDocumentation();

  return useMutation({
    mutationFn: deleteFolderFromApi,
    onSettled: () => {
      if (team?.id) {
        invalidate();
      }
    },
  });
}

export function useCreateDocumentation() {
  const team = useTeam();
  const invalidate = useBackgroundInvalidateDocumentation();

  return useMutation({
    mutationFn: createDocumentationFromApi,
    onSettled: () => {
      if (team?.id) {
        invalidate();
      }
    },
  });
}

export function useUpdateDocumentation() {
  const team = useTeam();
  const queryClient = useQueryClient();
  const teamId = team?.id;
  const invalidate = useBackgroundInvalidateDocumentation();

  return useMutation({
    mutationFn: updateDocumentationFromApi,
    onSuccess: (doc) => {
      applyDocumentationDetailPatch(queryClient, doc.id, doc);
      if (teamId) {
        applyDocumentationTreeDocPatch(queryClient, teamId, doc);
      }
    },
    onSettled: (_doc, _error, variables) => {
      if (teamId) {
        invalidate(variables.docId);
      }
    },
  });
}

export function useDeleteDocumentation() {
  const team = useTeam();
  const invalidate = useBackgroundInvalidateDocumentation();

  return useMutation({
    mutationFn: deleteDocumentationFromApi,
    onSettled: (_void, _error, docId) => {
      if (team?.id) {
        invalidate(docId);
      }
    },
  });
}
