"use client";

import {
  DocsDirectorySidebar,
  DocsMainPanel,
  DocsTableOfContents,
  DocsViewModals,
} from "@/components/documents/DocsViewComponents";
import { useDocsView } from "@/lib/hooks/use-docs-view";

export function DocsView() {
  const view = useDocsView();

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
        notebookEntry={view.notebookEntry}
        canEditSelectedDoc={view.canEditSelectedDoc}
        isLeader={view.isLeader}
        isDeletePending={view.isDeletePending}
        openEditDocumentModal={view.openEditDocumentModal}
        handleDeleteDocument={view.handleDeleteDocument}
      />

      <DocsTableOfContents
        showToc={view.showToc}
        activeSegment={view.activeTocSegment}
        onSelect={view.handleTocSelect}
      />

      <DocsViewModals
        folderModal={view.folderModal}
        documentModal={view.documentModal}
      />
    </div>
  );
}
