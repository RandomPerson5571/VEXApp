"use client";

import { useState } from "react";
import { GitBranch, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import {
  CONTENT_OPTIONS,
  formatEnumLabel,
  inputClassName,
  nodeEdgesFor,
  panelClassName,
  TOPIC_OPTIONS,
  type SidebarMode,
} from "@/components/knowledge/knowledge-view-utils";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import type {
  CreateNodePayload,
  KnowledgeEdgeRecord,
  KnowledgeNodeRecord,
  KnowledgeSearchHit,
  UpdateNodePayload,
} from "@/lib/queries/knowledge";
import type { ContentType, TopicCategory } from "@stlvex/database/types";

function NodePreview({ node }: { node: KnowledgeNodeRecord }) {
  if (node.contentType === "MARKDOWN") {
    return (
      <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-[#121212] dark:text-slate-300">
        {node.content?.trim() || "No content yet."}
      </pre>
    );
  }

  if (!node.contentUrl) {
    return (
      <p className="mt-3 text-xs text-slate-500">No URL set for this node.</p>
    );
  }

  if (node.contentType === "SLIDESHOW") {
    return (
      <iframe
        title={node.title}
        src={node.contentUrl}
        className="mt-3 h-40 w-full rounded-lg border border-slate-200 dark:border-slate-800"
      />
    );
  }

  return (
    <a
      href={node.contentUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-3 block truncate text-sm text-orange-600 underline dark:text-orange-400"
    >
      {node.contentUrl}
    </a>
  );
}

function NodeFormFields({
  title,
  topicCategory,
  contentType,
  content,
  contentUrl,
  onTitleChange,
  onTopicChange,
  onContentTypeChange,
  onContentChange,
  onContentUrlChange,
}: {
  title: string;
  topicCategory: TopicCategory;
  contentType: ContentType;
  content: string;
  contentUrl: string;
  onTitleChange: (value: string) => void;
  onTopicChange: (value: TopicCategory) => void;
  onContentTypeChange: (value: ContentType) => void;
  onContentChange: (value: string) => void;
  onContentUrlChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Title"
        className={inputClassName}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={topicCategory}
          onChange={(event) =>
            onTopicChange(event.target.value as TopicCategory)
          }
          className={inputClassName}
        >
          {TOPIC_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatEnumLabel(option)}
            </option>
          ))}
        </select>
        <select
          value={contentType}
          onChange={(event) =>
            onContentTypeChange(event.target.value as ContentType)
          }
          className={inputClassName}
        >
          {CONTENT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatEnumLabel(option)}
            </option>
          ))}
        </select>
      </div>
      {contentType === "MARKDOWN" ? (
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Markdown content"
          rows={4}
          className={inputClassName}
        />
      ) : (
        <input
          value={contentUrl}
          onChange={(event) => onContentUrlChange(event.target.value)}
          placeholder="Content URL"
          className={inputClassName}
        />
      )}
    </div>
  );
}

type KnowledgeSidebarProps = {
  nodes: KnowledgeNodeRecord[];
  edges: KnowledgeEdgeRecord[];
  selectedNode: KnowledgeNodeRecord | null;
  linkSourceId: string | null;
  searchQuery: string;
  searchResults: KnowledgeSearchHit[];
  formError: string | null;
  isAdmin: boolean;
  isSearching: boolean;
  isCreatingNode: boolean;
  isUpdatingNode: boolean;
  isCreatingEdge: boolean;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onClearSelection: () => void;
  onSelectNode: (id: string) => void;
  onStartLink: (sourceId: string) => void;
  onCancelLink: () => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onCreateNode: (payload: CreateNodePayload) => Promise<void>;
  onUpdateNode: (nodeId: string, payload: UpdateNodePayload) => Promise<void>;
};

export function KnowledgeSidebar({
  nodes,
  edges,
  selectedNode,
  linkSourceId,
  searchQuery,
  searchResults,
  formError,
  isAdmin,
  isSearching,
  isCreatingNode,
  isUpdatingNode,
  isCreatingEdge,
  onSearchQueryChange,
  onSearch,
  onClearSearch,
  onClearSelection,
  onSelectNode,
  onStartLink,
  onCancelLink,
  onDeleteNode,
  onDeleteEdge,
  onCreateNode,
  onUpdateNode,
}: KnowledgeSidebarProps) {
  const [mode, setMode] = useState<SidebarMode>("browse");
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "node" | "edge";
    id: string;
    label: string;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [topicCategory, setTopicCategory] =
    useState<TopicCategory>("GENERAL");
  const [contentType, setContentType] = useState<ContentType>("MARKDOWN");
  const [content, setContent] = useState("");
  const [contentUrl, setContentUrl] = useState("");

  const linkSource = nodes.find((node) => node.id === linkSourceId) ?? null;

  const resetForm = () => {
    setTitle("");
    setContent("");
    setContentUrl("");
    setTopicCategory("GENERAL");
    setContentType("MARKDOWN");
  };

  const startEdit = (node: KnowledgeNodeRecord) => {
    setTitle(node.title);
    setTopicCategory(node.topicCategory);
    setContentType(node.contentType);
    setContent(node.content ?? "");
    setContentUrl(node.contentUrl ?? "");
    setMode("edit");
  };

  const handleCreateNode = async () => {
    await onCreateNode({
      title,
      topicCategory,
      contentType,
      content: contentType === "MARKDOWN" ? content : null,
      contentUrl: contentType === "MARKDOWN" ? null : contentUrl.trim() || null,
    });
    resetForm();
    setMode("browse");
  };

  const handleUpdateNode = async () => {
    if (!selectedNode) return;
    await onUpdateNode(selectedNode.id, {
      title,
      topicCategory,
      contentType,
      content: contentType === "MARKDOWN" ? content : null,
      contentUrl: contentType === "MARKDOWN" ? null : contentUrl.trim() || null,
    });
    setMode("browse");
  };

  const formFields = (
    <NodeFormFields
      title={title}
      topicCategory={topicCategory}
      contentType={contentType}
      content={content}
      contentUrl={contentUrl}
      onTitleChange={setTitle}
      onTopicChange={setTopicCategory}
      onContentTypeChange={setContentType}
      onContentChange={setContent}
      onContentUrlChange={setContentUrl}
    />
  );

  return (
    <aside className="flex w-full flex-col gap-3 overflow-y-auto p-4 lg:w-[340px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
            Knowledge
          </h1>
          <p className="text-xs text-slate-500">
            Explore links or search by meaning.
          </p>
        </div>
        {isAdmin && mode === "browse" ? (
          <button
            type="button"
            onClick={() => setMode("create")}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-500"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        ) : null}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search topics…"
          className={`${inputClassName} flex-1`}
        />
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#121212]"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {searchResults.length > 0 ? (
        <section className={`${panelClassName} space-y-1`}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={onClearSearch}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          {searchResults.map((hit) => (
            <button
              key={hit.id}
              type="button"
              onClick={() => onSelectNode(hit.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-[#121212] ${
                selectedNode?.id === hit.id
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : ""
              }`}
            >
              <span className="truncate font-medium">{hit.title}</span>
              <span className="ml-2 shrink-0 text-[10px] text-slate-500">
                {Math.round(hit.similarity * 100)}%
              </span>
            </button>
          ))}
        </section>
      ) : null}

      {isAdmin && linkSource ? (
        <section className={`${panelClassName} border-orange-500/30 bg-orange-500/5`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                Create edge
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                From {linkSource.title}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelLink}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#121212]"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {isCreatingEdge
              ? "Creating edge…"
              : "Click the second node on the graph."}
          </p>
        </section>
      ) : null}

      {isAdmin && mode === "create" ? (
        <section className={panelClassName}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              New node
            </h2>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setMode("browse");
              }}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#121212]"
              aria-label="Close create form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {formFields}
          <button
            type="button"
            onClick={handleCreateNode}
            disabled={isCreatingNode || !title.trim()}
            className="mt-2 w-full rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
          >
            Create node
          </button>
        </section>
      ) : null}

      {isAdmin && mode === "edit" && selectedNode ? (
        <section className={panelClassName}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Edit node
            </h2>
            <button
              type="button"
              onClick={() => setMode("browse")}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#121212]"
              aria-label="Close edit form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {formFields}
          <button
            type="button"
            onClick={handleUpdateNode}
            disabled={isUpdatingNode || !title.trim()}
            className="mt-2 w-full rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
          >
            {isUpdatingNode ? "Saving…" : "Save changes"}
          </button>
        </section>
      ) : null}

      {selectedNode && mode !== "edit" ? (
        <section className={panelClassName}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate font-bold text-slate-900 dark:text-slate-100">
                {selectedNode.title}
              </h2>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                {formatEnumLabel(selectedNode.topicCategory)} ·{" "}
                {formatEnumLabel(selectedNode.contentType)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => startEdit(selectedNode)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#121212]"
                  aria-label="Edit node"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClearSelection}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#121212]"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    type: "node",
                    id: selectedNode.id,
                    label: selectedNode.title,
                  })
                }
                className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                aria-label="Delete node"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <NodePreview node={selectedNode} />

          {isAdmin && !linkSourceId ? (
            <button
              type="button"
              onClick={() => onStartLink(selectedNode.id)}
              className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium dark:border-slate-700"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Create edge
            </button>
          ) : null}

          {nodeEdgesFor(selectedNode.id, edges).length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500">Connections</p>
              {nodeEdgesFor(selectedNode.id, edges).map((edge) => (
                <div
                  key={edge.id}
                  className="flex items-start justify-between gap-2 text-xs text-slate-600 dark:text-slate-400"
                >
                  <span>
                    {edge.source.title} → {edge.target.title}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        type: "edge",
                        id: edge.id,
                        label: `${edge.source.title} → ${edge.target.title}`,
                      })
                    }
                    className="shrink-0 text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : mode === "browse" && !linkSourceId && !selectedNode ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-800">
          <p className="text-sm text-slate-500">
            Select a node on the graph, or click empty space to show all nodes.
          </p>
        </div>
      ) : null}

      {formError ? (
        <p className="text-xs text-rose-500">{formError}</p>
      ) : null}

      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        title={
          deleteTarget?.type === "node" ? "Delete node?" : "Remove connection?"
        }
        description={
          deleteTarget?.type === "node"
            ? `"${deleteTarget.label}" and its links will be removed.`
            : `Remove the link "${deleteTarget?.label}".`
        }
        confirmLabel={deleteTarget?.type === "node" ? "Delete" : "Remove"}
        variant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "node") {
            onDeleteNode(deleteTarget.id);
          } else {
            onDeleteEdge(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </aside>
  );
}
