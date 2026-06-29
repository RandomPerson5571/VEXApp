"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  DocumentFormModal,
} from "@/components/documents/DocumentFormModal";
import { FolderFormModal } from "@/components/documents/FolderFormModal";
import type { DesignNotebookEntry } from "@/lib/types/team";
import type { FolderWithDocs } from "@stlvex/database/types";

import { DOCS_TABLE_OF_CONTENTS } from "./docs-view-utils";
import type { DocsViewState } from "@/lib/hooks/use-docs-view";

export function DocsSidebarSkeleton() {
  return (
    <div className="space-y-3.5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-6 animate-pulse rounded-md bg-slate-900/80" />
          <div className="ml-4 space-y-1.5 border-l border-slate-900 pl-3">
            <div className="h-5 animate-pulse rounded-md bg-slate-950/80" />
            <div className="h-5 animate-pulse rounded-md bg-slate-950/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocsContentSkeleton({ sectionCount = 4 }: { sectionCount?: number }) {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-900/80" />
      <div className="h-1 w-16 animate-pulse rounded-full bg-blue-600/40" />
      {Array.from({ length: sectionCount }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-900/70" />
          <div className="h-16 animate-pulse rounded-lg bg-slate-950/60" />
        </div>
      ))}
    </div>
  );
}

type DocsDirectorySidebarProps = {
  folders: FolderWithDocs[];
  expandedFolderIds: Set<string>;
  selectedDocId: string | null;
  isLeader: boolean;
  isLoading: boolean;
  isError: boolean;
  onToggleFolder: (folderId: string) => void;
  onSelectDoc: (docId: string) => void;
  onCreateFolder: () => void;
  onCreateDocument: (folderId: string) => void;
};

export function DocsDirectorySidebar({
  folders,
  expandedFolderIds,
  selectedDocId,
  isLeader,
  isLoading,
  isError,
  onToggleFolder,
  onSelectDoc,
  onCreateFolder,
  onCreateDocument,
}: DocsDirectorySidebarProps) {
  return (
    <aside className="w-[250px] bg-[#070b13] border-r border-slate-900 flex flex-col h-full select-none p-5">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-900 pb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Directory
        </span>
        {isLeader ? (
          <button
            type="button"
            onClick={onCreateFolder}
            className="inline-flex items-center gap-1 rounded-md border border-slate-900 bg-slate-950/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition hover:border-blue-500/30 hover:bg-blue-600/10 hover:text-blue-300"
            title="New folder"
          >
            <Plus className="h-3 w-3" />
            Folder
          </button>
        ) : null}
      </div>

      <div className="space-y-3.5 flex-1 overflow-y-auto dashboard-scroll">
        {isLoading ? (
          <DocsSidebarSkeleton />
        ) : isError ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
            <AlertTriangle className="mx-auto mb-2 h-4 w-4 text-red-400" />
            <p className="text-[11px] font-semibold text-red-300">
              Failed to load directory
            </p>
          </div>
        ) : folders.length === 0 ? (
          <div className="rounded-lg border border-slate-900 bg-[#090e18]/45 p-4 text-center">
            <FolderOpen className="mx-auto mb-2 h-5 w-5 text-slate-600" />
            <p className="text-[11px] font-bold text-slate-400">No folders yet</p>
            {isLeader ? (
              <p className="mt-1 text-[10px] text-slate-600">
                Create a folder to start organizing documentation.
              </p>
            ) : null}
          </div>
        ) : (
          folders.map((folder) => {
            const isExpanded = expandedFolderIds.has(folder.id);

            return (
              <div key={folder.id} className="space-y-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleFolder(folder.id)}
                    className="flex min-w-0 flex-1 items-center justify-between text-left text-xs font-black text-slate-300 hover:text-slate-100 py-1 cursor-pointer"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateDocument(folder.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-600 transition hover:border-slate-800 hover:bg-slate-900/60 hover:text-blue-400"
                    title="New document"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isExpanded ? (
                  <div className="pl-4.5 border-l border-slate-900 space-y-1 py-1">
                    {folder.docs.length === 0 ? (
                      <p className="px-2 py-1.5 text-[10px] font-semibold text-slate-600">
                        No documents
                      </p>
                    ) : (
                      folder.docs.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => onSelectDoc(doc.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-semibold text-left cursor-pointer ${
                            selectedDocId === doc.id
                              ? "bg-blue-600/10 text-blue-400 font-bold border-l-2 border-blue-500"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

type DocsBreadcrumbProps = {
  folderName: string | null;
  docTitle: string | null;
};

export function DocsBreadcrumb({ folderName, docTitle }: DocsBreadcrumbProps) {
  return (
    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2 font-mono">
      <span>Documentation</span>
      {folderName ? (
        <>
          <ChevronRight className="h-3 w-3" />
          <span>{folderName}</span>
        </>
      ) : null}
      {docTitle ? (
        <>
          <ChevronRight className="h-3 w-3 text-blue-500" />
          <span className="text-blue-500">{docTitle}</span>
        </>
      ) : null}
    </div>
  );
}

type DocsNotebookArticleProps = {
  entry: DesignNotebookEntry;
  canEdit: boolean;
  isLeader: boolean;
  isDeletePending: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function DocsNotebookArticle({
  entry,
  canEdit,
  isLeader,
  isDeletePending,
  onEdit,
  onDelete,
}: DocsNotebookArticleProps) {
  return (
    <article className="max-w-3xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-none">
            {entry.title}
          </h1>
          <div className="h-1 w-16 bg-blue-600 rounded-full mt-4" />
        </div>

        {(canEdit || isLeader) && (
          <div className="flex shrink-0 items-center gap-2">
            {canEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-950/60 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-blue-500/30 hover:bg-blue-600/10 hover:text-blue-300"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            ) : null}
            {isLeader ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeletePending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-950/60 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            ) : null}
          </div>
        )}
      </div>

      <section id="introduction" className="space-y-3.5 scroll-mt-20">
        <h2 className="text-base font-black text-slate-100 tracking-tight">Introduction</h2>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {entry.introduction}
        </p>
      </section>

      <section id="constraints" className="space-y-3.5 scroll-mt-20">
        <h2 className="text-base font-black text-slate-100 tracking-tight">
          Design Constraints
        </h2>
        {entry.designConstraints.length > 0 ? (
          <ul className="space-y-2 list-disc pl-5">
            {entry.designConstraints.map((constraint) => (
              <li
                key={constraint}
                className="text-xs text-slate-400 leading-normal font-semibold"
              >
                {constraint}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 font-semibold italic">No constraints listed.</p>
        )}
      </section>

      <section id="sketches" className="space-y-4 scroll-mt-20">
        <h2 className="text-base font-black text-slate-100 tracking-tight">
          Concept Sketches
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {entry.conceptSketchesDescription}
        </p>
      </section>

      <section id="prototypes" className="space-y-3.5 scroll-mt-20">
        <h2 className="text-base font-black text-slate-100 tracking-tight">Prototypes</h2>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {entry.prototypesText}
        </p>
      </section>

      <section id="results" className="space-y-3.5 scroll-mt-20">
        <h2 className="text-base font-black text-slate-100 tracking-tight">
          Testing Results
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {entry.testingResults}
        </p>
      </section>

      <section id="conclusion" className="space-y-3.5 scroll-mt-20">
        <h2 className="text-base font-black text-slate-100 tracking-tight">Conclusion</h2>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {entry.conclusion}
        </p>
      </section>

      <section id="steps" className="space-y-3.5 scroll-mt-20">
        <h2 className="text-base font-black text-slate-100 tracking-tight">Next Steps</h2>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {entry.nextSteps}
        </p>
      </section>
    </article>
  );
}

type DocsMainPanelProps = Pick<
  DocsViewState,
  | "isTreeLoading"
  | "isTreeError"
  | "hasAnyDocs"
  | "selectedDocId"
  | "isDetailLoading"
  | "isDetailError"
  | "notebookEntry"
  | "canEditSelectedDoc"
  | "isLeader"
  | "isDeletePending"
  | "openEditDocumentModal"
  | "handleDeleteDocument"
> & {
  breadcrumbFolderName: string | null;
  breadcrumbDocTitle: string | null;
};

export function DocsMainPanel({
  breadcrumbFolderName,
  breadcrumbDocTitle,
  isTreeLoading,
  isTreeError,
  hasAnyDocs,
  selectedDocId,
  isDetailLoading,
  isDetailError,
  notebookEntry,
  canEditSelectedDoc,
  isLeader,
  isDeletePending,
  openEditDocumentModal,
  handleDeleteDocument,
}: DocsMainPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto px-10 py-8 bg-[#03070e] text-slate-300 dashboard-scroll">
      <DocsBreadcrumb folderName={breadcrumbFolderName} docTitle={breadcrumbDocTitle} />

      {isTreeLoading ? (
        <DocsContentSkeleton />
      ) : isTreeError ? (
        <div className="border border-red-500/20 bg-red-500/5 p-12 rounded-2xl text-center max-w-2xl mx-auto my-12 shadow-xl">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-300">Unable to load documentation</p>
          <p className="text-xs text-slate-500 mt-1">
            Something went wrong while fetching the directory. Please refresh and try again.
          </p>
        </div>
      ) : !hasAnyDocs ? (
        <div className="border border-slate-900 bg-[#090e18]/45 p-12 rounded-2xl text-center max-w-2xl mx-auto my-12 shadow-xl select-none">
          <FileText className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-300">No documents yet</p>
          <p className="text-xs text-slate-600 mt-1">
            Your team has not published any design notebook entries. The directory and outline
            will populate here once documentation is available.
          </p>
        </div>
      ) : !selectedDocId ? (
        <div className="border border-slate-900 bg-[#090e18]/45 p-12 rounded-2xl text-center max-w-2xl mx-auto my-12 shadow-xl select-none">
          <FileText className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-300">Select a document</p>
          <p className="text-xs text-slate-600 mt-1">
            Choose an entry from the directory tree to view its contents.
          </p>
        </div>
      ) : isDetailLoading ? (
        <DocsContentSkeleton sectionCount={5} />
      ) : isDetailError || !notebookEntry ? (
        <div className="border border-red-500/20 bg-red-500/5 p-12 rounded-2xl text-center max-w-2xl mx-auto my-12 shadow-xl">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-300">Unable to load document</p>
          <p className="text-xs text-slate-500 mt-1">
            The selected entry could not be fetched. It may have been removed.
          </p>
        </div>
      ) : (
        <DocsNotebookArticle
          entry={notebookEntry}
          canEdit={canEditSelectedDoc}
          isLeader={isLeader}
          isDeletePending={isDeletePending}
          onEdit={openEditDocumentModal}
          onDelete={handleDeleteDocument}
        />
      )}
    </div>
  );
}

type DocsTableOfContentsProps = {
  showToc: boolean;
  activeSegment: string;
  onSelect: (sectionId: string) => void;
};

export function DocsTableOfContents({
  showToc,
  activeSegment,
  onSelect,
}: DocsTableOfContentsProps) {
  return (
    <aside className="w-[200px] bg-[#070b13] border-l border-slate-900 flex flex-col h-full select-none p-5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4 border-b border-slate-900 pb-2">
        Table of Contents
      </span>

      <div className="space-y-1">
        {DOCS_TABLE_OF_CONTENTS.map((toc) => {
          const isSelected = showToc && activeSegment === toc.id;

          return (
            <button
              key={toc.id}
              type="button"
              disabled={!showToc}
              onClick={() => onSelect(toc.id)}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-semibold leading-normal transition flex items-center gap-1.5 ${
                !showToc
                  ? "text-slate-700 cursor-not-allowed"
                  : isSelected
                    ? "bg-blue-600/10 text-blue-400 font-bold border-l border-blue-500 cursor-pointer"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/10 cursor-pointer"
              }`}
            >
              <div
                className={`h-1 w-1 rounded-full ${isSelected ? "bg-blue-400" : "bg-slate-600"}`}
              />
              <span>{toc.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

type DocsViewModalsProps = {
  folderModal: DocsViewState["folderModal"];
  documentModal: DocsViewState["documentModal"];
};

export function DocsViewModals({ folderModal, documentModal }: DocsViewModalsProps) {
  return (
    <>
      <FolderFormModal
        isOpen={folderModal.isOpen}
        name={folderModal.name}
        onNameChange={folderModal.onNameChange}
        onClose={folderModal.onClose}
        onSubmit={folderModal.onSubmit}
        isSubmitting={folderModal.isSubmitting}
        submitError={folderModal.submitError}
      />

      <DocumentFormModal
        isOpen={documentModal.isOpen}
        mode={documentModal.mode}
        values={documentModal.values}
        onChange={documentModal.onChange}
        onClose={documentModal.onClose}
        onSubmit={documentModal.onSubmit}
        isSubmitting={documentModal.isSubmitting}
        submitError={documentModal.submitError}
      />
    </>
  );
}
