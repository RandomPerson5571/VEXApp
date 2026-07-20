-- Enable pgvector for embedding storage / cosine search
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "TopicCategory" AS ENUM ('PROGRAMMING', 'CAD', 'HARDWARE', 'GENERAL');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('SLIDESHOW', 'LINK', 'MARKDOWN');

-- DropDocuments
DROP TABLE IF EXISTS "_AuthoredDocs";
DROP TABLE IF EXISTS "Documentation";
DROP TABLE IF EXISTS "Folder";
DROP TYPE IF EXISTS "DocType";

-- CreateTable
CREATE TABLE "KnowledgeNode" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topicCategory" "TopicCategory" NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentUrl" TEXT,
    "content" TEXT,
    "embedding" vector(1536),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEdge" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeNode_teamId_idx" ON "KnowledgeNode"("teamId");

-- CreateIndex
CREATE INDEX "KnowledgeNode_topicCategory_idx" ON "KnowledgeNode"("topicCategory");

-- CreateIndex
CREATE INDEX "KnowledgeEdge_sourceId_idx" ON "KnowledgeEdge"("sourceId");

-- CreateIndex
CREATE INDEX "KnowledgeEdge_targetId_idx" ON "KnowledgeEdge"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeEdge_sourceId_targetId_relationshipType_key" ON "KnowledgeEdge"("sourceId", "targetId", "relationshipType");

-- AddForeignKey
ALTER TABLE "KnowledgeNode" ADD CONSTRAINT "KnowledgeNode_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeNode" ADD CONSTRAINT "KnowledgeNode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEdge" ADD CONSTRAINT "KnowledgeEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEdge" ADD CONSTRAINT "KnowledgeEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
