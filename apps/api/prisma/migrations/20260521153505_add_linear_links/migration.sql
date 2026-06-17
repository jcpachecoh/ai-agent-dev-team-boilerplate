-- CreateEnum
CREATE TYPE "LinearEntityType" AS ENUM ('testCase', 'milestone', 'requirement');

-- CreateTable
CREATE TABLE "linear_links" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "entityType" "LinearEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "issueTitle" TEXT NOT NULL,
    "issueUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linear_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linear_links_projectId_issueId_entityType_entityId_key" ON "linear_links"("projectId", "issueId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "linear_links" ADD CONSTRAINT "linear_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
