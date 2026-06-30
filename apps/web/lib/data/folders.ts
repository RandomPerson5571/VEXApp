import "server-only";

import { prisma } from "@stlvex/database";
import {
  folderWithDocsInclude,
  type FolderWithDocs,
} from "@stlvex/database/types";

export type CreateFolderInput = {
  name: string;
};

export type UpdateFolderInput = {
  folderId: string;
  name: string;
};

export async function listFoldersWithDocs(
  _teamId: string,
): Promise<FolderWithDocs[]> {
  return prisma.folder.findMany({
    include: folderWithDocsInclude,
    orderBy: { name: "asc" },
  });
}

export async function createFolder(input: CreateFolderInput): Promise<FolderWithDocs> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Folder name is required.");
  }

  return prisma.folder.create({
    data: { name },
    include: folderWithDocsInclude,
  });
}

export async function updateFolder(input: UpdateFolderInput): Promise<FolderWithDocs> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Folder name is required.");
  }

  const existing = await prisma.folder.findUnique({
    where: { id: input.folderId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Folder not found.");
  }

  return prisma.folder.update({
    where: { id: input.folderId },
    data: { name },
    include: folderWithDocsInclude,
  });
}

export async function deleteFolder(folderId: string): Promise<void> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { _count: { select: { docs: true } } },
  });

  if (!folder) {
    throw new Error("Folder not found.");
  }

  if (folder._count.docs > 0) {
    throw new Error("Cannot delete a folder that contains documents.");
  }

  await prisma.folder.delete({ where: { id: folderId } });
}
