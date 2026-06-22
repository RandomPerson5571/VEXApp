import type { Documentation } from "@stlvex/database/types";

import type { DesignNotebookEntry } from "@/lib/types/team";

const SECTION_ALIASES: Record<string, keyof DesignNotebookEntry> = {
  introduction: "introduction",
  "design constraints": "designConstraints",
  constraints: "designConstraints",
  "concept sketches": "conceptSketchesDescription",
  sketches: "conceptSketchesDescription",
  prototypes: "prototypesText",
  "testing results": "testingResults",
  results: "testingResults",
  conclusion: "conclusion",
  "next steps": "nextSteps",
};

function normalizeHeading(value: string): string {
  return value.trim().toLowerCase().replace(/^#+\s*/, "");
}

function parseMarkdownSections(content: string): Partial<DesignNotebookEntry> {
  const sections: Partial<DesignNotebookEntry> = {};
  const lines = content.split(/\r?\n/);
  let currentKey: keyof DesignNotebookEntry | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!currentKey || buffer.length === 0) {
      return;
    }

    const text = buffer.join("\n").trim();
    if (!text) {
      return;
    }

    if (currentKey === "designConstraints") {
      sections.designConstraints = text
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean);
      return;
    }

    sections[currentKey] = text as never;
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      flush();
      buffer = [];
      const alias = SECTION_ALIASES[normalizeHeading(headingMatch[1] ?? "")];
      currentKey = alias ?? null;
      continue;
    }

    if (currentKey) {
      buffer.push(line);
    }
  }

  flush();
  return sections;
}

function inferWeek(title: string): string {
  const match = title.match(/week\s*\d+/i);
  return match?.[0] ?? title;
}

export function toDesignNotebookEntry(doc: Documentation): DesignNotebookEntry {
  const sections = parseMarkdownSections(doc.content);

  return {
    id: doc.id,
    title: doc.title,
    week: inferWeek(doc.title),
    category: doc.type,
    introduction: sections.introduction ?? doc.content,
    designConstraints: sections.designConstraints ?? [],
    conceptSketchesDescription:
      sections.conceptSketchesDescription ??
      "See the concept sketches section in this document.",
    prototypesText:
      sections.prototypesText ?? "Prototype details are documented in this entry.",
    testingResults:
      sections.testingResults ?? "Testing results are documented in this entry.",
    conclusion: sections.conclusion ?? "See the conclusion section in this document.",
    nextSteps: sections.nextSteps ?? "See the next steps section in this document.",
  };
}
