"use client";

import { FileText } from "lucide-react";

import {
  DocsDirectorySidebar,
  DocsMainPanel,
  DocsViewModals,
} from "@/components/documents/DocsViewComponents";
import { useTeam } from "@/components/providers/UserProvider";
import { useDocsView } from "@/lib/hooks/use-docs-view";

function DocumentsFallback() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 dark:bg-[#03070e] p-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 dark:border-slate-900 bg-white dark:bg-[#090e18]/80 p-8 text-center shadow-md dark:shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60">
          <FileText className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="text-xl font-black text-slate-100">No team assigned</h1>
        <p className="mt-2 text-sm text-slate-400">
          Join or select a team to view design notebook documentation.
        </p>
      </div>
    </div>
  );
}

export function DocsView() {
  const team = useTeam();
  const view = useDocsView();

  if (!team) {
    return <DocumentsFallback />;
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 font-sans dark:bg-[#03070e]">
      <DocsDirectorySidebar
        folders={view.folders}
        expandedFolderIds={view.expandedFolderIds}
        selectedDocId={view.selectedDocId}
        isLeader={view.isLeader}
        isLoading={view.isTreeLoading}
        isError={view.isTreeError}
        onToggleFolder={view.toggleFolder}
        onSelectDoc={view.setSelectedDocId}
        onCreateFolder={view.openCreateFolderModal}
        onCreateDocument={view.openCreateDocumentModal}
      />

      <DocsMainPanel
        breadcrumbFolderName={view.breadcrumbFolderName}
        breadcrumbDocTitle={view.breadcrumbDocTitle}
        isTreeLoading={view.isTreeLoading}
        isTreeError={view.isTreeError}
        hasAnyDocs={view.hasAnyDocs}
        selectedDocId={view.selectedDocId}
        isDetailLoading={view.isDetailLoading}
        isDetailError={view.isDetailError}
        selectedDocTitle={view.selectedDocTitle}
        selectedDocContent={view.selectedDocContent}
        canEditSelectedDoc={view.canEditSelectedDoc}
        isLeader={view.isLeader}
        isDeletePending={view.isDeletePending}
        openEditDocumentModal={view.openEditDocumentModal}
        handleDeleteDocument={view.handleDeleteDocument}
      />

      <DocsViewModals
        folderModal={view.folderModal}
        documentModal={view.documentModal}
      />
    </div>
  );
}
