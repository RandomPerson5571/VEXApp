"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextSelection } from "@tiptap/pm/state";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react";

type ScoutNoteEditorProps = {
  content: string;
  editable: boolean;
  onChange?: (html: string) => void;
};

export function ScoutNoteEditor({
  content,
  editable,
  onChange,
}: ScoutNoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "<p></p>",
    editable,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true, // ponytail: stored-mark shortcuts need a re-render
    editorProps: {
      attributes: {
        class:
          "scout-note-editor min-h-[280px] px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none dark:text-slate-200 [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-bold [&_em]:italic",
      },
      // ponytail: TipTap Mod-a uses AllSelection; after delete it sticks and kills mark shortcuts
      handleKeyDown: (view, event) => {
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "a") {
          return false;
        }
        const { doc } = view.state;
        const to = Math.max(1, doc.content.size - 1);
        view.dispatch(
          view.state.tr.setSelection(TextSelection.create(doc, 1, to)),
        );
        return true;
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange?.(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = content || "<p></p>";
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, content]);

  if (!editor) {
    return (
      <div className="min-h-[320px] rounded-xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#0a0a0a]" />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
      {editable && (
        <div className="flex flex-wrap gap-1 border-b border-slate-200 px-2 py-1.5 dark:border-[#1a1a1a]">
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Ordered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-slate-600 transition dark:text-slate-300 ${
        active
          ? "border-orange-500/40 bg-orange-500/15 text-orange-500"
          : "border-transparent hover:border-slate-200 hover:bg-slate-100 dark:hover:border-[#2a2a2a] dark:hover:bg-[#121212]"
      }`}
    >
      {children}
    </button>
  );
}
