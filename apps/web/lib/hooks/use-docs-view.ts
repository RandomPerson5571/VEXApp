"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { useProfile, useTeam, useUser } from "@/components/providers/UserProvider";
import {
  canDelegateTeamLeaders,
  verifyUserPermissions,
} from "@/lib/auth/auth-guards";
import {
  useCreateDocumentation,
  useCreateFolder,
  useDeleteDocumentation,
  useDocumentationDetail,
  useTeamDocumentationTree,
  useUpdateDocumentation,
} from "@/lib/hooks/use-team-documentation";
import { toDesignNotebookEntry } from "@/lib/mappers/documentation";

import {
  emptyDocumentFormValues,
  type DocumentFormValues,
} from "@/components/documents/DocumentFormModal";
import {
  canEditDocumentation,
  findDocInTree,
  findFirstDocId,
  findNextDocId,
  hasAnyDocsInTree,
  scrollToDocSection,
} from "@/components/documents/docs-view-utils";

export function useDocsView() {
  const user = useUser();
  const profile = useProfile();
  const team = useTeam();
  const teamId = team?.id;

  const {
    data: folders = [],
    isLoading: isTreeLoading,
    isError: isTreeError,
  } = useTeamDocumentationTree();

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeTocSegment, setActiveTocSegment] = useState("introduction");

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderSubmitError, setFolderSubmitError] = useState<string | null>(null);

  const [documentModalMode, setDocumentModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState<DocumentFormValues>(
    emptyDocumentFormValues,
  );
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [documentSubmitError, setDocumentSubmitError] = useState<string | null>(
    null,
  );

  const {
    data: docDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useDocumentationDetail(selectedDocId);

  const createFolderMutation = useCreateFolder();
  const createDocumentationMutation = useCreateDocumentation();
  const updateDocumentationMutation = useUpdateDocumentation();
  const deleteDocumentationMutation = useDeleteDocumentation();

  const permissions = verifyUserPermissions(user, teamId);
  const isLeader = canDelegateTeamLeaders(permissions);

  const treeSelection = useMemo(
    () => (selectedDocId ? findDocInTree(folders, selectedDocId) : null),
    [folders, selectedDocId],
  );

  const notebookEntry = useMemo(
    () => (docDetail ? toDesignNotebookEntry(docDetail) : null),
    [docDetail],
  );

  const canEditSelectedDoc = useMemo(
    () =>
      docDetail
        ? canEditDocumentation(docDetail, profile.id, isLeader)
        : false,
    [docDetail, isLeader, profile.id],
  );

  const hasAnyDocs = hasAnyDocsInTree(folders);
  const showToc =
    selectedDocId != null &&
    notebookEntry != null &&
    !isDetailLoading &&
    !isDetailError;

  const breadcrumbFolderName =
    docDetail?.folder.name ?? treeSelection?.folder.name ?? null;
  const breadcrumbDocTitle =
    docDetail?.title ?? treeSelection?.doc.title ?? null;

  useEffect(() => {
    if (folders.length === 0 || selectedDocId !== null) return;

    const firstDocId = findFirstDocId(folders);
    if (!firstDocId) return;

    setSelectedDocId(firstDocId);

    const match = findDocInTree(folders, firstDocId);
    if (match) {
      setExpandedFolderIds(new Set([match.folder.id]));
    }
  }, [folders, selectedDocId]);

  useEffect(() => {
    if (!selectedDocId) return;

    const match = findDocInTree(folders, selectedDocId);
    if (!match) return;

    setExpandedFolderIds((previous) => {
      if (previous.has(match.folder.id)) return previous;
      const next = new Set(previous);
      next.add(match.folder.id);
      return next;
    });
  }, [folders, selectedDocId]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolderIds((previous) => {
      const next = new Set(previous);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleTocSelect = useCallback((sectionId: string) => {
    scrollToDocSection(sectionId, setActiveTocSegment);
  }, []);

  const openCreateFolderModal = useCallback(() => {
    setFolderName("");
    setFolderSubmitError(null);
    setIsFolderModalOpen(true);
  }, []);

  const openCreateDocumentModal = useCallback((folderId: string) => {
    setDocumentModalMode("create");
    setTargetFolderId(folderId);
    setDocumentForm(emptyDocumentFormValues);
    setDocumentSubmitError(null);
    setIsDocumentModalOpen(true);
  }, []);

  const openEditDocumentModal = useCallback(() => {
    if (!docDetail) return;

    setDocumentModalMode("edit");
    setTargetFolderId(docDetail.folderId);
    setDocumentForm({
      title: docDetail.title,
      type: docDetail.type,
      content: docDetail.content,
    });
    setDocumentSubmitError(null);
    setIsDocumentModalOpen(true);
  }, [docDetail]);

  const handleCreateFolder = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFolderSubmitError(null);

      try {
        const folder = await createFolderMutation.mutateAsync({
          name: folderName.trim(),
        });
        setIsFolderModalOpen(false);
        setFolderName("");
        setExpandedFolderIds((previous) => new Set(previous).add(folder.id));
      } catch (error) {
        setFolderSubmitError(
          error instanceof Error ? error.message : "Failed to create folder.",
        );
      }
    },
    [createFolderMutation, folderName],
  );

  const handleDocumentSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setDocumentSubmitError(null);

      try {
        if (documentModalMode === "create") {
          if (!targetFolderId) {
            setDocumentSubmitError("Folder is required.");
            return;
          }

          const doc = await createDocumentationMutation.mutateAsync({
            title: documentForm.title.trim(),
            type: documentForm.type,
            content: documentForm.content,
            folderId: targetFolderId,
          });

          setIsDocumentModalOpen(false);
          setDocumentForm(emptyDocumentFormValues);
          setSelectedDocId(doc.id);
          setExpandedFolderIds((previous) => new Set(previous).add(doc.folderId));
          return;
        }

        if (!selectedDocId) return;

        await updateDocumentationMutation.mutateAsync({
          docId: selectedDocId,
          title: documentForm.title.trim(),
          type: documentForm.type,
          content: documentForm.content,
        });

        setIsDocumentModalOpen(false);
      } catch (error) {
        setDocumentSubmitError(
          error instanceof Error ? error.message : "Failed to save document.",
        );
      }
    },
    [
      createDocumentationMutation,
      documentForm,
      documentModalMode,
      selectedDocId,
      targetFolderId,
      updateDocumentationMutation,
    ],
  );

  const handleDeleteDocument = useCallback(async () => {
    if (!selectedDocId || !docDetail) return;

    const confirmed = window.confirm(
      `Delete "${docDetail.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      const nextDocId = findNextDocId(folders, selectedDocId);
      await deleteDocumentationMutation.mutateAsync(selectedDocId);
      setSelectedDocId(nextDocId);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to delete document.",
      );
    }
  }, [deleteDocumentationMutation, docDetail, folders, selectedDocId]);

  return {
    folders,
    expandedFolderIds,
    selectedDocId,
    setSelectedDocId,
    activeTocSegment,
    isTreeLoading,
    isTreeError,
    isDetailLoading,
    isDetailError,
    isLeader,
    canEditSelectedDoc,
    hasAnyDocs,
    showToc,
    notebookEntry,
    breadcrumbFolderName,
    breadcrumbDocTitle,
    toggleFolder,
    handleTocSelect,
    openCreateFolderModal,
    openCreateDocumentModal,
    openEditDocumentModal,
    handleDeleteDocument,
    isDeletePending: deleteDocumentationMutation.isPending,
    folderModal: {
      isOpen: isFolderModalOpen,
      name: folderName,
      submitError: folderSubmitError,
      isSubmitting: createFolderMutation.isPending,
      onNameChange: setFolderName,
      onClose: () => setIsFolderModalOpen(false),
      onSubmit: handleCreateFolder,
    },
    documentModal: {
      isOpen: isDocumentModalOpen,
      mode: documentModalMode,
      values: documentForm,
      submitError: documentSubmitError,
      isSubmitting:
        createDocumentationMutation.isPending || updateDocumentationMutation.isPending,
      onChange: setDocumentForm,
      onClose: () => setIsDocumentModalOpen(false),
      onSubmit: handleDocumentSubmit,
    },
  };
}

export type DocsViewState = ReturnType<typeof useDocsView>;
