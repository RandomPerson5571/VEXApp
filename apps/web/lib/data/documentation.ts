import "server-only";

import { prisma } from "@stlvex/database";
import {
  documentationDetailInclude,
  type DocType,
  type DocumentationDetail,
} from "@stlvex/database/types";

export const DEFAULT_DOCUMENTATION_TEMPLATE = `## Introduction

## Design Constraints
-

## Concept Sketches

## Prototypes

## Testing Results

## Conclusion

## Next Steps
`;

export type CreateDocumentationInput = {
  title: string;
  type: DocType;
  content: string;
  folderId: string;
  authorId: string;
};

export type UpdateDocumentationInput = {
  docId: string;
  title?: string;
  type?: DocType;
  content?: string;
  userId: string;
  isLeader: boolean;
};

export async function getDocumentationById(
  id: string,
): Promise<DocumentationDetail | null> {
  return prisma.documentation.findUnique({
    where: { id },
    include: documentationDetailInclude,
  });
}

export async function createDocumentation(
  input: CreateDocumentationInput,
): Promise<DocumentationDetail> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }

  const folder = await prisma.folder.findUnique({
    where: { id: input.folderId },
    select: { id: true },
  });

  if (!folder) {
    throw new Error("Folder not found.");
  }

  return prisma.documentation.create({
    data: {
      title,
      type: input.type,
      content: input.content,
      folderId: input.folderId,
      authors: { connect: { id: input.authorId } },
    },
    include: documentationDetailInclude,
  });
}

export async function updateDocumentation(
  input: UpdateDocumentationInput,
): Promise<DocumentationDetail> {
  const existing = await prisma.documentation.findUnique({
    where: { id: input.docId },
    include: { authors: { select: { id: true } } },
  });

  if (!existing) {
    throw new Error("Document not found.");
  }

  const isAuthor = existing.authors.some((author) => author.id === input.userId);
  if (!isAuthor && !input.isLeader) {
    throw new Error("You do not have permission to edit this document.");
  }

  const data: {
    title?: string;
    type?: DocType;
    content?: string;
  } = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      throw new Error("Title is required.");
    }
    data.title = title;
  }

  if (input.type !== undefined) {
    data.type = input.type;
  }

  if (input.content !== undefined) {
    data.content = input.content;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("No changes to save.");
  }

  return prisma.documentation.update({
    where: { id: input.docId },
    data,
    include: documentationDetailInclude,
  });
}

export async function deleteDocumentation(docId: string): Promise<void> {
  const existing = await prisma.documentation.findUnique({
    where: { id: docId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Document not found.");
  }

  await prisma.documentation.delete({ where: { id: docId } });
}
