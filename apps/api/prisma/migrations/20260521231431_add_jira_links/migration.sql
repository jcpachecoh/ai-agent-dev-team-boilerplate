/*
  Warnings:

  - You are about to drop the `linear_links` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "JiraEntityType" AS ENUM ('testCase', 'milestone', 'requirement');

-- DropForeignKey
ALTER TABLE "linear_links" DROP CONSTRAINT "linear_links_projectId_fkey";

-- DropTable
DROP TABLE "linear_links";

-- DropEnum
DROP TYPE "LinearEntityType";

-- CreateTable
CREATE TABLE "jira_links" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "issueKey" TEXT NOT NULL,
    "entityType" "JiraEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "issueSummary" TEXT NOT NULL,
    "issueUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jira_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jira_links_projectId_issueKey_entityType_entityId_key" ON "jira_links"("projectId", "issueKey", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "jira_links" ADD CONSTRAINT "jira_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
