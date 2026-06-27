import { prisma } from "@stlvex/database";
import type { Documentation, Folder, User } from "@stlvex/database/types";

export type DocumentationWithRelations = Documentation & {
  authors: User[];
  folder: Folder;
};

export async function getLatestDocumentationForTeam(
  _teamId: string,
): Promise<DocumentationWithRelations | null> {
  const firstFolder = await prisma.folder.findFirst({
    orderBy: { name: "asc" },
  });

  if (!firstFolder) {
    return null;
  }

  const firstDoc = await prisma.documentation.findFirst({
    where: { folderId: firstFolder.id },
    orderBy: { createdAt: "desc" },
  });

  if (!firstDoc) {
    return null;
  }

  return prisma.documentation.findUnique({
    where: { id: firstDoc.id },
    include: { authors: true, folder: true },
  });
}
