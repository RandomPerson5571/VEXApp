import type {
  DocumentationDetail,
  FolderDocSummary,
  FolderWithDocs,
} from "@stlvex/database/types";

export const DOCS_TABLE_OF_CONTENTS = [
  { id: "introduction", label: "Introduction" },
  { id: "constraints", label: "Design Constraints" },
  { id: "sketches", label: "Concept Sketches" },
  { id: "prototypes", label: "Prototypes" },
  { id: "results", label: "Testing Results" },
  { id: "conclusion", label: "Conclusion" },
  { id: "steps", label: "Next Steps" },
] as const;

export type DocsTreeSelection = {
  folder: FolderWithDocs;
  doc: FolderDocSummary;
};

export function findDocInTree(
  folders: FolderWithDocs[],
  docId: string,
): DocsTreeSelection | null {
  for (const folder of folders) {
    const doc = folder.docs.find((entry) => entry.id === docId);
    if (doc) {
      return { folder, doc };
    }
  }

  return null;
}

export function findFirstDocId(folders: FolderWithDocs[]): string | null {
  for (const folder of folders) {
    const firstDoc = folder.docs[0];
    if (firstDoc) {
      return firstDoc.id;
    }
  }

  return null;
}

export function findNextDocId(
  folders: FolderWithDocs[],
  excludeDocId: string,
): string | null {
  let foundExcluded = false;

  for (const folder of folders) {
    for (const doc of folder.docs) {
      if (doc.id === excludeDocId) {
        foundExcluded = true;
        continue;
      }

      if (foundExcluded) {
        return doc.id;
      }
    }
  }

  for (const folder of folders) {
    for (const doc of folder.docs) {
      if (doc.id !== excludeDocId) {
        return doc.id;
      }
    }
  }

  return null;
}

export function hasAnyDocsInTree(folders: FolderWithDocs[]): boolean {
  return folders.some((folder) => folder.docs.length > 0);
}

export function canEditDocumentation(
  doc: DocumentationDetail,
  profileId: string,
  isLeader: boolean,
): boolean {
  if (isLeader) return true;
  return doc.authors.some((author) => author.id === profileId);
}

export function scrollToDocSection(
  sectionId: string,
  onActiveChange: (sectionId: string) => void,
): void {
  onActiveChange(sectionId);
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
}
